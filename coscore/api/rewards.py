import frappe

def setup_rewards_custom_fields():
	"""
	Ensures that the Customer document has a 'custom_rewards_points' field.
	"""
	try:
		if not frappe.db.has_column("Customer", "custom_rewards_points"):
			from frappe.custom.doctype.custom_field.custom_field import create_custom_field
			create_custom_field("Customer", {
				"fieldname": "custom_rewards_points",
				"label": "Rewards Points",
				"fieldtype": "Int",
				"default": 0,
				"insert_after": "customer_name"
			})
	except Exception as e:
		frappe.log_error(f"Failed to setup rewards custom field: {str(e)}", "Coscore Rewards Setup")

@frappe.whitelist(allow_guest=True)
def get_points(email=None, phone=None):
	"""
	Exposed API endpoint for the frontend to fetch a customer's rewards points balance.
	"""
	setup_rewards_custom_fields()
	
	if not email and not phone:
		return {"status": "error", "message": "Email or phone number is required", "points": 0}

	customer = None
	if email:
		customer = frappe.db.get_value("Customer", {"email_id": email}, "name")
	if not customer and phone:
		customer = frappe.db.get_value("Customer", {"mobile_no": phone}, "name")

	if not customer:
		return {"status": "error", "message": "Customer not found", "points": 0}

	points = frappe.db.get_value("Customer", customer, "custom_rewards_points") or 0
	return {"status": "success", "customer": customer, "points": int(points)}

def add_rewards_points(customer_name, points_to_add):
	"""
	Python API to increment customer reward points. Called upon checkout.
	"""
	if not customer_name or points_to_add <= 0:
		return

	setup_rewards_custom_fields()

	try:
		current_points = frappe.db.get_value("Customer", customer_name, "custom_rewards_points") or 0
		new_points = int(current_points) + int(points_to_add)
		
		frappe.db.set_value("Customer", customer_name, "custom_rewards_points", new_points)
		frappe.db.commit()
	except Exception as e:
		frappe.log_error(f"Failed to add rewards points for {customer_name}: {str(e)}", "Coscore Rewards Update")
