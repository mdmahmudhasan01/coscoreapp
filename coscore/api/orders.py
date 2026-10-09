import frappe
import json
from frappe.model.document import Document

@frappe.whitelist(allow_guest=True)
def create_sales_order(*args, **kwargs):
	# Handle GET/POST payload correctly in Frappe
	payload = None
	if frappe.request:
		try:
			payload = frappe.request.get_json()
		except Exception:
			pass
	
	if not payload:
		if args:
			payload = args[0]
		elif frappe.local.form_dict:
			payload = frappe.local.form_dict

	if not payload:
		frappe.throw("Empty payload received")

	# If the payload contains stringified JSON or is passed inside form data
	if isinstance(payload, str):
		try:
			payload = json.loads(payload)
		except Exception:
			pass

	if not isinstance(payload, dict):
		payload = {}

	if "order_id" not in payload and "items" not in payload:
		# Check if it was passed under a nested parameter or kwargs
		for k, v in kwargs.items():
			if isinstance(v, str):
				try:
					payload = json.loads(v)
					break
				except Exception:
					pass
			elif isinstance(v, dict):
				payload = v
				break

	order_id = payload.get("order_id")
	email = payload.get("email")
	shipping_address = payload.get("shipping_address", {})
	phone = payload.get("phone") or payload.get("mobile") or payload.get("mobile_no") or payload.get("customer_phone") or payload.get("phone_number")
	if not phone and isinstance(shipping_address, dict):
		phone = shipping_address.get("phone") or shipping_address.get("mobile") or shipping_address.get("mobile_no") or shipping_address.get("phone_number")

	if not phone:
		frappe.throw("Phone number is required")
		
	from coscore.utils.phone_validator import validate_and_normalize_phone
	normalized_phone = validate_and_normalize_phone(phone)
	if not normalized_phone:
		frappe.throw("Invalid Bangladeshi mobile number. Must be 11 digits starting with 013-019.")
	phone = normalized_phone

	full_name = payload.get("full_name")
	total_amount = flt(payload.get("total_amount", 0.0))
	shipping_charge = flt(payload.get("shipping_charge", 0.0))
	discount_amount = flt(payload.get("discount_amount", 0.0))
	items = payload.get("items", [])

	if not items:
		frappe.throw("Missing required order fields: items list is empty or missing")
	if not full_name:
		full_name = email or phone or "Guest Customer"

	# Find or Create Customer (running under Administrator context to avoid Guest permission checks)
	original_user = frappe.session.user
	try:
		frappe.set_user("Administrator")
		
		# If user checked 'Create a Lookzene account', create Frappe user credentials
		create_account = payload.get("create_account")
		password = payload.get("password")
		if create_account and password:
			create_user_account_if_requested(full_name, email, phone, password)

		customer_name = get_or_create_customer(full_name, email, phone, shipping_address)

		# Prepare Sales Order
		so = frappe.new_doc("Sales Order")
		so.customer = customer_name
		so.transaction_date = frappe.utils.today()
		so.delivery_date = frappe.utils.add_days(frappe.utils.today(), 3)
		
		# Primary Address link
		primary_addr = frappe.db.get_value("Customer", customer_name, "customer_primary_address")
		if primary_addr:
			so.customer_address = primary_addr
			so.shipping_address_name = primary_addr
		
		# Determine Company
		so.company = frappe.db.get_single_value("Global Defaults", "default_company") or get_first_company()

		# Add items
		for item in items:
			item_code = get_item_code(item.get("id"), item.get("name"))
			so.append("items", {
				"item_code": item_code,
				"qty": flt(item.get("quantity", 1)),
				"rate": flt(item.get("price", 0.0)),
				"delivery_date": so.delivery_date
			})

		if shipping_charge > 0:
			shipping_item = get_item_code("Shipping Charge", "Shipping Charge")
			so.append("items", {
				"item_code": shipping_item,
				"qty": 1.0,
				"rate": shipping_charge,
				"delivery_date": so.delivery_date
			})

		if discount_amount > 0:
			so.apply_discount_on = "Grand Total"
			so.discount_amount = discount_amount

		# Set description/shipping info
		address_text = f"District: {shipping_address.get('district', '')}\nAddress: {shipping_address.get('address', '')}"
		so.description = f"Web Order ID: {order_id}\nShipping Details:\n{address_text}"

		# Set order source (defaults to 'lookzene main' if not explicitly provided)
		so.order_source = payload.get("order_source") or "lookzene main"

		# Try setting custom fields if they exist
		try:
			if frappe.db.has_column("Sales Order", "custom_shipping_district"):
				so.custom_shipping_district = shipping_address.get("district")
			if frappe.db.has_column("Sales Order", "custom_shipping_address"):
				so.custom_shipping_address = shipping_address.get("address")
			
			# Preserve Customer Cloudflare IP, User-Agent, and Meta tracking tokens
			from coscore.utils.meta_capi import get_client_ip, get_client_user_agent
			client_ip = get_client_ip(preferred_ip=payload.get("client_ip"))
			client_ua = payload.get("client_user_agent") or payload.get("user_agent") or get_client_user_agent()
			fbp = payload.get("fbp") or (frappe.request.cookies.get("_fbp") if hasattr(frappe, "request") and frappe.request and hasattr(frappe.request, "cookies") else None)
			fbc = payload.get("fbc") or (frappe.request.cookies.get("_fbc") if hasattr(frappe, "request") and frappe.request and hasattr(frappe.request, "cookies") else None)
			meta_event_id = payload.get("meta_event_id") or payload.get("event_id") or f"PURCHASE-{order_id}"
			referrer_url = payload.get("referrer_url") or (frappe.request.headers.get("Referer") if hasattr(frappe, "request") and frappe.request else None)
			event_source_url = payload.get("event_source_url") or ("https://nella.lookzene.com" if "nella" in (payload.get("order_source") or "").lower() else "https://www.lookzene.com/checkout")

			so.custom_client_ip = client_ip
			so.custom_client_user_agent = client_ua
			so.custom_fbp = fbp
			so.custom_fbc = fbc
			so.custom_meta_event_id = meta_event_id
			so.custom_referrer_url = referrer_url
			so.custom_event_source_url = event_source_url
		except Exception:
			pass

		# Insert and submit the order (on_submit hook handles Customer and Admin SMS triggers)
		so.insert(ignore_permissions=True)
		so.submit()

		# Calculate earned points (1 point per 150 BDT)
		earned_points = int(total_amount / 150)
		
		# Update loyalty points if rewards module functions
		try:
			from coscore.api.rewards import add_rewards_points
			add_rewards_points(customer_name, earned_points)
		except Exception:
			pass

		# Ensure notifications were sent (fallback if hook was bypassed)
		send_order_notifications(so)

		return {
			"status": "success",
			"message": f"Sales Order {so.name} created successfully",
			"order_name": so.name,
			"earned_points": earned_points,
			"courier_status": "Processing Dispatch (Steadfast)"
		}
	finally:
		frappe.set_user(original_user)


def send_order_notifications(doc, method=None):
	"""
	Doc event handler triggered when a Sales Order is submitted (on_submit).
	Sends Customer Order Confirmation SMS & Admin Notification SMS.
	"""
	if getattr(doc.flags, "sms_sent", False):
		return

	from coscore.api.otp import send_sms
	from coscore.utils.phone_validator import validate_and_normalize_phone

	customer_name = doc.customer_name or doc.customer or "Customer"
	
	# Try finding mobile number from Sales Order, Customer record, Address, or Contact
	phone = getattr(doc, "contact_mobile", None) or getattr(doc, "mobile_no", None) or getattr(doc, "phone", None) or getattr(doc, "customer_mobile", None)
	if not phone and doc.customer:
		phone = frappe.db.get_value("Customer", doc.customer, "mobile_no") or frappe.db.get_value("Customer", doc.customer, "phone")

	if not phone and getattr(doc, "customer_address", None):
		phone = frappe.db.get_value("Address", doc.customer_address, "phone")

	if not phone and getattr(doc, "contact_person", None):
		phone = frappe.db.get_value("Contact", doc.contact_person, "mobile_no") or frappe.db.get_value("Contact", doc.contact_person, "phone")

	# Fallback: extract from doc.description if present
	if not phone and getattr(doc, "description", None):
		import re
		match = re.search(r'01[3-9]\d{8}', doc.description)
		if match:
			phone = match.group(0)

	normalized_phone = validate_and_normalize_phone(phone) if phone else None

	# 1. Customer Order Confirmation SMS
	if normalized_phone:
		try:
			cust_msg = f"Lookzene: Dear {customer_name}, your order #{doc.name} (BDT {int(doc.grand_total)}) is confirmed. Thank you for shopping with us!"
			send_sms(normalized_phone, cust_msg)
		except Exception as e:
			frappe.log_error(message=str(e), title="Customer Order Confirmation SMS Failed")
	else:
		frappe.log_error(message=f"Sales Order {doc.name} submitted without valid customer phone number", title="Customer SMS Skipped - No Phone")

	# 2. Admin Order Alert SMS
	try:
		admin_phones = ["01717017707", "01915930000"]
		try:
			settings = frappe.get_doc("Coscore Settings")
			if getattr(settings, "admin_phone_1", None) and settings.admin_phone_1 not in admin_phones:
				admin_phones.insert(0, settings.admin_phone_1)
			if getattr(settings, "admin_phone_2", None) and settings.admin_phone_2 not in admin_phones:
				admin_phones.append(settings.admin_phone_2)
		except Exception:
			pass

		district = getattr(doc, "custom_shipping_district", "") or ""
		admin_phone_display = normalized_phone or phone or "No Phone"
		admin_msg = f"Lookzene Alert: New Order #{doc.name} by {customer_name} ({admin_phone_display}). Total: BDT {int(doc.grand_total)}."
		if district:
			admin_msg += f" Dist: {district}."
		
		for ap in admin_phones:
			if ap:
				send_sms(ap, admin_msg)
	except Exception as e:
		frappe.log_error(message=str(e), title="Admin Order Notification SMS Failed")

	doc.flags.sms_sent = True

def create_user_account_if_requested(full_name, email, phone, password):
	user_id = email.strip() if email else f"{phone}@lookzene.com"
	try:
		if not frappe.db.exists("User", user_id):
			u = frappe.new_doc("User")
			u.email = user_id
			u.first_name = full_name
			if phone:
				u.mobile_no = phone
			u.user_type = "Website User"
			u.send_welcome_email = 0
			u.flags.ignore_permissions = True
			u.insert(ignore_permissions=True)
			
			# Assign Customer role if present
			if frappe.db.exists("Role", "Customer"):
				u.add_roles("Customer")
				
		from frappe.utils.password import update_password
		update_password(user_id, password)
		frappe.db.commit()
		return user_id
	except Exception as e:
		frappe.log_error(message=str(e), title="Account Creation Error")
		return None

def ensure_territory(district_name):
	if not district_name:
		return frappe.db.get_value("Territory", {}, "name") or "All Territories"
	district_clean = str(district_name).strip()
	if frappe.db.exists("Territory", district_clean):
		return district_clean
	
	try:
		parent_t = frappe.db.get_value("Territory", {"is_group": 1}, "name") or "All Territories"
		t = frappe.new_doc("Territory")
		t.territory_name = district_clean
		t.parent_territory = parent_t
		t.insert(ignore_permissions=True)
		return t.name
	except Exception:
		return frappe.db.get_value("Territory", {}, "name") or "All Territories"

def sync_customer_address(customer_name, full_name, email, phone, shipping_address):
	if not shipping_address or not isinstance(shipping_address, dict):
		return None

	district = shipping_address.get("district", "Dhaka") or "Dhaka"
	address_line1 = shipping_address.get("address", "") or ""
	if not address_line1:
		return None

	try:
		# Search for existing address linked to this customer
		existing_addr = frappe.db.sql("""
			SELECT parent FROM `tabDynamic Link`
			WHERE link_doctype = 'Customer' AND link_name = %s AND parenttype = 'Address'
		""", (customer_name,))

		if existing_addr and existing_addr[0][0]:
			addr_name = existing_addr[0][0]
			addr = frappe.get_doc("Address", addr_name)
		else:
			addr = frappe.new_doc("Address")
			addr.address_title = full_name
			addr.address_type = "Shipping"

		addr.address_line1 = address_line1
		addr.city = district
		addr.country = "Bangladesh"
		if phone:
			addr.phone = phone
		if email:
			addr.email_id = email

		has_link = any(l.link_doctype == "Customer" and l.link_name == customer_name for l in addr.get("links", []))
		if not has_link:
			addr.append("links", {
				"link_doctype": "Customer",
				"link_name": customer_name
			})

		addr.save(ignore_permissions=True)
		return addr.name
	except Exception as e:
		frappe.log_error(message=str(e), title="Sync Customer Address Error")
		return None

def get_or_create_customer(full_name, email, phone, shipping_address=None):
	district = shipping_address.get("district", "Dhaka") if isinstance(shipping_address, dict) else "Dhaka"
	territory_name = ensure_territory(district)
	cust_group = "Individual" if frappe.db.exists("Customer Group", "Individual") else (frappe.db.get_value("Customer Group", {}, "name") or "All Customer Groups")

	# Search by email or phone
	customer_name = None
	if email:
		customer_name = frappe.db.get_value("Customer", {"email_id": email}, "name")
	if not customer_name and phone:
		customer_name = frappe.db.get_value("Customer", {"mobile_no": phone}, "name")
	if not customer_name and frappe.db.exists("Customer", full_name):
		customer_name = full_name

	if customer_name:
		cust = frappe.get_doc("Customer", customer_name)
		cust.customer_group = cust_group
		cust.territory = territory_name
		if phone:
			cust.mobile_no = phone
		if email and not cust.email_id:
			cust.email_id = email
		cust.save(ignore_permissions=True)
	else:
		cust = frappe.new_doc("Customer")
		cust.customer_name = full_name
		cust.customer_type = "Individual"
		cust.customer_group = cust_group
		cust.territory = territory_name
		if email:
			cust.email_id = email
		if phone:
			cust.mobile_no = phone
		cust.insert(ignore_permissions=True)
		customer_name = cust.name

	addr_name = sync_customer_address(customer_name, full_name, email, phone, shipping_address)
	if addr_name:
		frappe.db.set_value("Customer", customer_name, "customer_primary_address", addr_name)

	return customer_name

def get_item_code(item_id, item_name):
	# Try item code or name match
	if item_id and frappe.db.exists("Item", item_id):
		return item_id
	if item_name and frappe.db.exists("Item", item_name):
		return item_name
	
	# Check by item_name search
	existing_code = frappe.db.get_value("Item", {"item_name": item_name}, "name") if item_name else None
	if existing_code:
		return existing_code

	# Create the item if it does not exist to prevent order creation from failing
	default_item_group = frappe.db.get_value("Item Group", {"is_group": 0}, "name") or frappe.db.get_value("Item Group", {}, "name") or "All Item Groups"
	default_uom = frappe.db.get_value("UOM", {"uom_name": "Nos"}, "name") or frappe.db.get_value("UOM", {}, "name") or "Nos"

	item = frappe.new_doc("Item")
	item.item_code = item_id or item_name
	item.item_name = item_name or item_id
	item.item_group = default_item_group
	item.stock_uom = default_uom
	item.is_stock_item = 1
	item.insert(ignore_permissions=True)
	return item.name

def get_first_company():
	company = frappe.db.get_value("Company", {}, "name")
	if not company:
		# Scaffold a default company if none exists
		doc = frappe.new_doc("Company")
		doc.company_name = "Coscore Store"
		doc.default_currency = "BDT"
		doc.insert(ignore_permissions=True)
		return doc.name
	return company

def flt(val):
	try:
		return float(val)
	except (ValueError, TypeError):
		return 0.0
