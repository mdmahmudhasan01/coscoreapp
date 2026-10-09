import frappe
from coscore.utils.courier.steadfast import SteadfastDriver

def get_courier_driver(courier_name):
	"""
	Factory function to load and initialize the appropriate courier driver.
	"""
	if not frappe.db.exists("Coscore Courier Setting", courier_name):
		return None
		
	setting = frappe.get_doc("Coscore Courier Setting", courier_name)
	if not setting.is_active:
		return None

	# Fetch credentials: check site_config.json first (preferred for secrets), then DB setting
	api_key = frappe.conf.get(f"{courier_name.lower()}_api_key") or setting.api_key
	secret_key = frappe.conf.get(f"{courier_name.lower()}_secret_key") or setting.secret_key
	base_url = setting.base_url

	if courier_name == "Steadfast":
		return SteadfastDriver(api_key, secret_key, base_url)
		
	return None

def sync_order_to_default_courier(order_doc, shipping_details):
	"""
	Finds the active default courier setting, initializes its driver,
	creates a consignment, and logs the result to Coscore Order Tracking.
	"""
	default_courier = frappe.db.get_value("Coscore Courier Setting", {"is_default": 1, "is_active": 1}, "name")
	
	if not default_courier:
		# Fall back to any active courier setting
		default_courier = frappe.db.get_value("Coscore Courier Setting", {"is_active": 1}, "name")
		
	if not default_courier:
		frappe.log_error("No active courier setting found for auto-sync", "Coscore Courier Sync Error")
		return None
		
	driver = get_courier_driver(default_courier)
	if not driver:
		frappe.log_error(f"Failed to initialize driver for {default_courier}", "Coscore Courier Sync Error")
		return None
		
	# Call driver to create consignment
	result = driver.create_consignment(order_doc, shipping_details)
	
	# Create or update Coscore Order Tracking record
	if result and result.get("success"):
		tracking_name = frappe.db.exists("Coscore Order Tracking", {"sales_order": order_doc.name})
		if tracking_name:
			tracking = frappe.get_doc("Coscore Order Tracking", tracking_name)
		else:
			tracking = frappe.new_doc("Coscore Order Tracking")
			tracking.sales_order = order_doc.name
			
		tracking.courier_name = default_courier
		tracking.consignment_id = result.get("consignment_id")
		tracking.tracking_status = result.get("status") or "In Transit"
		tracking.last_synced_at = frappe.utils.now_datetime()
		
		# Add to status history child table
		tracking.append("status_history", {
			"timestamp": frappe.utils.now_datetime(),
			"status": tracking.tracking_status,
			"comments": f"Consignment successfully created via {default_courier} API."
		})
		
		tracking.insert(ignore_permissions=True)
		frappe.db.commit()
		return tracking.name
	else:
		error_msg = result.get("error") if result else "Unknown API error"
		frappe.log_error(f"Failed to sync order {order_doc.name} to {default_courier}: {error_msg}", "Coscore Courier Sync Error")
		return None

def sync_sales_invoice_to_courier(doc, method):
	"""
	Hook handler on Sales Invoice submit.
	"""
	# Get linked Sales Order if exists, otherwise refer to the Invoice itself
	sales_order_name = None
	for item in doc.items:
		if item.sales_order:
			sales_order_name = item.sales_order
			break

	shipping_details = {
		"address": doc.shipping_address or doc.address_display or "",
		"district": doc.custom_shipping_district if hasattr(doc, "custom_shipping_district") else "",
		"thana": doc.custom_shipping_thana if hasattr(doc, "custom_shipping_thana") else "",
		"phone": doc.contact_mobile or doc.contact_phone or ""
	}

	# Ensure we have a valid order reference for the tracking doc
	# If no Sales Order is linked, we associate it with the invoice name
	tracking_ref_doc = doc
	if sales_order_name:
		try:
			tracking_ref_doc = frappe.get_doc("Sales Order", sales_order_name)
		except Exception:
			pass

	# Call the courier sync helper
	sync_order_to_default_courier(tracking_ref_doc, shipping_details)

def poll_courier_tracking_statuses():
	"""
	Scheduled task to poll delivery statuses for active courier tracking records.
	"""
	# Get all tracking records that aren't Delivered or Cancelled/Returned
	active_trackings = frappe.db.get_all(
		"Coscore Order Tracking",
		filters={"tracking_status": ["not in", ["Delivered", "Cancelled", "Returned"]]},
		fields=["name", "sales_order", "courier_name", "consignment_id", "tracking_status"]
	)
	
	for tracking_item in active_trackings:
		driver = get_courier_driver(tracking_item.courier_name)
		if not driver:
			continue
			
		# Fetch status by consignment ID
		result = driver.get_status_by_cid(tracking_item.consignment_id)
		if result and result.get("success"):
			new_status = result.get("status")
			
			if new_status and new_status != tracking_item.tracking_status:
				# Update status
				tracking_doc = frappe.get_doc("Coscore Order Tracking", tracking_item.name)
				tracking_doc.tracking_status = new_status
				tracking_doc.last_synced_at = frappe.utils.now_datetime()
				
				# Log in history
				tracking_doc.append("status_history", {
					"timestamp": frappe.utils.now_datetime(),
					"status": new_status,
					"comments": f"Status updated automatically during scheduled sync."
				})
				tracking_doc.save(ignore_permissions=True)
				
				# Stub for SMS/Email notification trigger
				send_status_update_notification(tracking_item.sales_order, new_status)
				
	frappe.db.commit()

def send_status_update_notification(sales_order_name, status):
	"""
	Stub for sending notifications to the customer when the courier status updates.
	"""
	message = f"Your order {sales_order_name} status has been updated to: {status}."
	frappe.log_error(f"Customer Notification Stub for {sales_order_name}: {message}", "Coscore Customer Notification")


