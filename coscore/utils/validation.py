import re
import frappe
from frappe import ValidationError

# Regex covering local and international formats for Bangladesh
MOBILE_REGEX = re.compile(r'^(?:\+88|88)?(01[3-9]\d{8})$')

def validate_bangladeshi_mobile(number: str) -> str:
    """Validate a Bangladeshi mobile number.
    Returns the normalized E.164 format (e.g. '+8801xxxxxxxxx').
    Raises frappe.ValidationError on invalid input.
    """
    if not number:
        raise ValidationError("Mobile number cannot be empty.")
    match = MOBILE_REGEX.match(number.strip())
    if not match:
        raise ValidationError(
            "Invalid Bangladeshi mobile number. Expected formats: 01xxxxxxxxx, 8801xxxxxxxxx, +8801xxxxxxxxx."
        )
    # Normalize to E.164 (+8801XXXXXXXXX)
    local_part = match.group(1)
    # Remove leading zero if present
    if local_part.startswith('0'):
        local_part = local_part[1:]
    return f"+880{local_part}"

def sales_invoice_mobile_validation(doc, method=None):
    """Hook to validate and normalize the mobile number on a Sales Invoice.
    Expects the field `mobile_no` on the document. Adjust the field name if needed.
    """
    # If the field does not exist, skip validation.
    if not hasattr(doc, "mobile_no"):
        return
    normalized = validate_bangladeshi_mobile(doc.mobile_no)
    doc.mobile_no = normalized
