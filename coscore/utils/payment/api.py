import frappe
from frappe import _
from . import get_payment_driver

@frappe.whitelist(allow_guest=True)
def handle_payment_callback():
    """Generic callback that delegates verification to the active driver.
    The driver decides whether the request is a GET (Paystack) or a POST
    (Stripe) and returns a boolean indicating success.
    """
    # Retrieve the active gateway from settings
    setting = frappe.get_single('Coscore Payment Gateway Setting')
    driver = get_payment_driver(setting.gateway_name)
    # frappe.local.request holds the current request object
    success = driver.verify_ipn(frappe.local.request.values)
    if success:
        frappe.msgprint(_('Payment verified successfully.'))
        frappe.redirect('/checkout/result?status=success')
        return
    else:
        frappe.msgprint(_('Payment verification failed.'))
        frappe.redirect('/checkout/result?status=failure')
        return
