import re
import frappe
from frappe.utils import now_datetime

# Regular expression for Bangladeshi phone numbers
# Allows optional +880 or 880 prefix followed by 01[3-9]\d{8}
# Or simply 01[3-9]\d{8}
BD_PHONE_PATTERN = re.compile(r'^(?:\+?880|880)?(01[3-9]\d{8})$')

def validate_and_normalize_phone(phone):
	"""
	Validates and normalizes a Bangladeshi mobile number.
	Returns normalized number (01XXXXXXXXX) if valid, otherwise None.
	"""
	if not phone:
		return None
		
	# Strip whitespaces, dashes, and parentheses
	cleaned = re.sub(r'[\s\-\(\)]', '', str(phone))
	
	match = BD_PHONE_PATTERN.match(cleaned)
	if match:
		return match.group(1)
		
	return None

@frappe.whitelist(allow_guest=True)
def validate_phone_endpoint(phone):
	"""
	Whitelisted API endpoint to validate a phone number and log it.
	"""
	if not phone:
		return {"status": "error", "message": "Phone number is required", "valid": False}
		
	normalized = validate_and_normalize_phone(phone)
	is_valid = normalized is not None
	
	# Log verification attempt in Coscore Customer Verification
	# Wrap in try-except so it doesn't block the request if anything fails
	try:
		verification = frappe.new_doc("Coscore Customer Verification")
		verification.phone_number = phone
		verification.is_valid = 1 if is_valid else 0
		verification.verification_method = "SMS" # default
		if is_valid:
			verification.verified_at = now_datetime()
			verification.notes = f"Validated & Normalized to {normalized}"
		else:
			verification.notes = "Failed regex validation"
		verification.insert(ignore_permissions=True)
		frappe.db.commit()
	except Exception as e:
		frappe.log_error(f"Failed to log customer verification for {phone}: {str(e)}", "Coscore Phone Validation")

	if is_valid:
		return {"status": "success", "valid": True, "normalized": normalized}
	else:
		return {"status": "error", "valid": False, "message": "Invalid Bangladeshi mobile number. Must be 11 digits starting with 013-019."}
