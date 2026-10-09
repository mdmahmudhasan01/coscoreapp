import frappe
from coscore.utils.phone_validator import validate_and_normalize_phone

@frappe.whitelist(allow_guest=True)
def check_customer_status(phone=None, email=None, **kwargs):
	"""
	Checks if a customer with the given phone or email is already registered/verified.
	Already registered customers do NOT require OTP verification to purchase.
	"""
	norm_phone = validate_and_normalize_phone(phone) if phone else ""
	email_clean = email.strip().lower() if email else ""

	is_registered = False

	# Check Coscore Customer Verification
	if norm_phone and frappe.db.exists("Coscore Customer Verification", {"phone_number": norm_phone, "is_valid": 1}):
		is_registered = True
	elif email_clean and frappe.db.exists("Customer", {"email_id": email_clean}):
		is_registered = True
	elif norm_phone and frappe.db.exists("Customer", {"mobile_no": norm_phone}):
		is_registered = True

	return {
		"status": "success",
		"is_registered": is_registered,
		"needs_otp": not is_registered
	}

@frappe.whitelist(allow_guest=True)
def register_customer(email=None, password=None, full_name=None, phone=None, **kwargs):
	if not email:
		frappe.throw("Email is required")
	
	email = email.strip().lower()
	
	normalized_phone = ""
	if phone:
		normalized_phone = validate_and_normalize_phone(phone) or phone

	# Check or create Coscore Customer Verification
	if normalized_phone:
		cv_name = frappe.db.get_value("Coscore Customer Verification", {"phone_number": normalized_phone}, "name")
		if not cv_name:
			cv_doc = frappe.get_doc({
				"doctype": "Coscore Customer Verification",
				"phone_number": normalized_phone,
				"is_valid": 1,
				"verification_method": "SMS",
				"notes": f"Registered for {full_name} ({email})"
			})
			cv_doc.insert(ignore_permissions=True)

	# Ensure ERPNext Customer exists
	cust_name = frappe.db.get_value("Customer", {"email_id": email}, "name")
	if not cust_name and normalized_phone:
		cust_name = frappe.db.get_value("Customer", {"mobile_no": normalized_phone}, "name")

	if not cust_name:
		try:
			cust = frappe.get_doc({
				"doctype": "Customer",
				"customer_name": full_name or email.split("@")[0],
				"email_id": email,
				"mobile_no": normalized_phone,
				"customer_group": "Individual",
				"territory": "Bangladesh"
			})
			cust.insert(ignore_permissions=True)
		except Exception as e:
			frappe.log_error(f"Customer creation note for {email}: {e}")

	frappe.db.commit()

	return {
		"status": "success",
		"message": "Account created successfully",
		"user": {
			"id": email,
			"email": email,
			"user_metadata": {
				"full_name": full_name,
				"phone": normalized_phone
			}
		}
	}

@frappe.whitelist(allow_guest=True)
def login_customer(email=None, password=None, **kwargs):
	if not email:
		frappe.throw("Email is required")
	
	email = email.strip().lower()
	cust = frappe.db.get_value("Customer", {"email_id": email}, ["customer_name", "mobile_no"], as_dict=True)
	
	return {
		"status": "success",
		"message": "Signed in successfully",
		"user": {
			"id": email,
			"email": email,
			"user_metadata": {
				"full_name": cust.get("customer_name") if cust else email.split("@")[0],
				"phone": cust.get("mobile_no") if cust else ""
			}
		}
	}

@frappe.whitelist(allow_guest=True)
def search_customers(query=None, **kwargs):
	"""
	Search customers by email prefix for autocomplete suggestions.
	Returns name, email, and customer_name for matching customers.
	"""
	if not query or len(str(query).strip()) < 2:
		return {"status": "success", "customers": []}

	q = str(query).strip().lower()

	customers = frappe.db.sql("""
		SELECT customer_name, email_id
		FROM `tabCustomer`
		WHERE LOWER(email_id) LIKE %s
		LIMIT 8
	""", (f"{q}%",), as_dict=True)

	return {
		"status": "success",
		"customers": [
			{
				"customer_name": c.get("customer_name"),
				"email": c.get("email_id"),
			}
			for c in customers if c.get("email_id")
		]
	}

@frappe.whitelist(allow_guest=True)
def subscribe_newsletter(email=None, full_name=None, phone=None, **kwargs):
	"""
	Subscribe an email to the Lookzene newsletter (Email Group Member).
	Also creates or updates the ERPNext Customer record using name and phone
	passed from the browser session/cookies.
	"""
	if not email:
		frappe.throw("Email is required")

	import re
	email = email.strip().lower()

	# Validate email format
	if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
		return {"status": "error", "message": "Invalid email address"}

	# Normalize phone if provided
	normalized_phone = ""
	if phone:
		try:
			from coscore.utils.phone_validator import validate_and_normalize_phone
			normalized_phone = validate_and_normalize_phone(str(phone)) or str(phone).strip()
		except Exception:
			normalized_phone = str(phone).strip()

	customer_name = (full_name or "").strip() or email.split("@")[0]

	# ── 1. Create / update ERPNext Customer ──────────────────────────────
	existing_cust = frappe.db.get_value("Customer", {"email_id": email}, "name")
	if not existing_cust and normalized_phone:
		existing_cust = frappe.db.get_value("Customer", {"mobile_no": normalized_phone}, "name")

	if existing_cust:
		# Update missing fields only
		update_fields = {}
		cust_data = frappe.db.get_value("Customer", existing_cust, ["customer_name", "mobile_no", "email_id"], as_dict=True)
		if full_name and not cust_data.get("customer_name"):
			update_fields["customer_name"] = customer_name
		if normalized_phone and not cust_data.get("mobile_no"):
			update_fields["mobile_no"] = normalized_phone
		if email and not cust_data.get("email_id"):
			update_fields["email_id"] = email
		if update_fields:
			frappe.db.set_value("Customer", existing_cust, update_fields)
	else:
		try:
			cust = frappe.get_doc({
				"doctype": "Customer",
				"customer_name": customer_name,
				"email_id": email,
				"mobile_no": normalized_phone,
				"customer_group": "Individual",
				"territory": "Bangladesh"
			})
			cust.insert(ignore_permissions=True)
		except Exception as e:
			frappe.log_error(f"Newsletter customer creation note for {email}: {e}")

	# ── 2. Add to Email Group (newsletter list) ──────────────────────────
	group_name = "Lookzene Newsletter"
	try:
		if not frappe.db.exists("Email Group", group_name):
			grp = frappe.get_doc({
				"doctype": "Email Group",
				"title": group_name
			})
			grp.insert(ignore_permissions=True)

		already = frappe.db.get_value("Email Group Member", {"email_group": group_name, "email": email}, "name")
		if not already:
			member = frappe.get_doc({
				"doctype": "Email Group Member",
				"email_group": group_name,
				"email": email
			})
			member.insert(ignore_permissions=True)
	except Exception as e:
		frappe.log_error(f"Newsletter subscription note for {email}: {e}")

	frappe.db.commit()

	return {
		"status": "success",
		"message": "You have been subscribed successfully!",
		"email": email
	}
