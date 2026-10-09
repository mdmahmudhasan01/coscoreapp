import frappe
import requests
import random
import os
import re

@frappe.whitelist(allow_guest=True)
def send_otp(phone):
    if not phone:
        return {"status": "error", "message": "Phone number is required."}

    from coscore.utils.phone_validator import validate_and_normalize_phone
    phone = validate_and_normalize_phone(phone)
    if not phone:
        return {"status": "error", "message": "Invalid Bangladeshi mobile number."}

    # Check for recent OTP to prevent spam
    cache_key = f"otp_cooldown_{phone}"
    if frappe.cache().get_value(cache_key):
        return {"status": "error", "message": "Please wait before requesting another OTP."}

    # Generate 6 digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Store OTP in cache with 5 minutes expiry (300 seconds)
    frappe.cache().set_value(f"otp_{phone}", otp, expires_in_sec=300)
    # Set cooldown for 60 seconds
    frappe.cache().set_value(cache_key, "1", expires_in_sec=60)

    # Send SMS using approved BulkSMS BD template
    message = f"Your Lookzene OTP is {otp}"
    send_sms(phone, message)

    return {"status": "success", "message": "OTP sent successfully."}

@frappe.whitelist(allow_guest=True)
def verify_otp(phone, otp):
    if not phone or not otp:
        return {"status": "error", "message": "Phone and OTP are required."}
        
    from coscore.utils.phone_validator import validate_and_normalize_phone
    phone = validate_and_normalize_phone(phone)
    
    cached_otp = frappe.cache().get_value(f"otp_{phone}")
    if not cached_otp:
        return {"status": "error", "message": "OTP expired or invalid."}
        
    # convert bytes to string if needed
    if isinstance(cached_otp, bytes):
        cached_otp = cached_otp.decode("utf-8")
        
    if str(cached_otp) == str(otp):
        # Clear OTP after successful verification
        frappe.cache().delete_value(f"otp_{phone}")
        return {"status": "success", "message": "OTP verified successfully."}
        
    return {"status": "error", "message": "Incorrect OTP."}


def send_sms(phone, message):
    """
    Sends an SMS using BulkSMS BD API (bulksmsbd.net/api/smsapi).
    """
    try:
        api_key = os.environ.get("BULKSMS_API_KEY", "2ERP3sqaSVImHzayhSaq")
        sender_id = os.environ.get("BULKSMS_SENDER_ID", "8809617624879")
        url = os.environ.get("BULKSMS_API_URL", "http://bulksmsbd.net/api/smsapi")

        try:
            settings = frappe.get_doc("Coscore Settings")
            if getattr(settings, "bulksms_api_key", None):
                api_key = settings.bulksms_api_key
            if getattr(settings, "bulksms_sender_id", None):
                sender_id = settings.bulksms_sender_id
        except Exception:
            pass

        if not api_key or not sender_id:
            print(f"SMS Mock (No API Key): To {phone} -> {message}")
            return None

        # Format phone number for BulkSMS BD (must be 88017XXXXXXXX)
        raw_digits = re.sub(r'[^\d]', '', str(phone))
        if raw_digits.startswith("8801"):
            clean_phone = raw_digits
        elif raw_digits.startswith("01"):
            clean_phone = "88" + raw_digits
        else:
            clean_phone = "88" + raw_digits if len(raw_digits) == 10 and raw_digits.startswith("1") else raw_digits

        params = {
            "api_key": api_key,
            "type": "text",
            "number": clean_phone,
            "senderid": sender_id,
            "message": message
        }

        response = requests.get(url, params=params, timeout=10)

        # Create Frappe SMS Log entry for tracking
        try:
            log = frappe.new_doc("SMS Log")
            log.requested_numbers = clean_phone
            log.sent_to = clean_phone
            log.message = message
            log.no_of_requested_sms = 1
            log.no_of_sent_sms = 1 if response.status_code == 200 else 0
            log.insert(ignore_permissions=True)
            frappe.db.commit()
        except Exception as log_err:
            print(f"SMS Log creation notice: {log_err}")

        if response.status_code == 200:
            print(f"SMS Sent successfully to {clean_phone}: {response.text}")
            return {"status": "success", "response": response.text}
        else:
            err_msg = f"SMS Failed to {clean_phone}: Status {response.status_code} - {response.text}"
            print(err_msg)
            frappe.log_error(err_msg, title="BulkSMS Send Failed")
            return {"status": "error", "response": response.text}

    except Exception as e:
        err_msg = f"Error sending SMS to {phone}: {str(e)}"
        print(err_msg)
        frappe.log_error(err_msg, title="BulkSMS Exception")
        return {"status": "error", "message": str(e)}

