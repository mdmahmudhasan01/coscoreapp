import frappe
from frappe.exceptions import ValidationError
from coscore.utils.validation import validate_bangladeshi_mobile


def test_valid_numbers():
    # Local format
    assert validate_bangladeshi_mobile('01712345678') == '+8801712345678'
    # International format with +
    assert validate_bangladeshi_mobile('+8801712345678') == '+8801712345678'
    # International format without +
    assert validate_bangladeshi_mobile('8801712345678') == '+8801712345678'


def test_invalid_numbers():
    invalid_numbers = [
        '012345',                # too short
        '0199999999',           # only 10 digits
        '12345678901',          # missing leading 0 or country code
        '+881234567890',        # wrong country code
        '01712abc456',           # contains letters
    ]
    for num in invalid_numbers:
        try:
            validate_bangladeshi_mobile(num)
            raised = False
        except ValidationError:
            raised = True
        assert raised, f"{num} should raise ValidationError"
