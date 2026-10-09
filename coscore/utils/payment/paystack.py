import frappe
import requests
from frappe.utils import get_url
from .base import BasePaymentDriver

class PaystackDriver(BasePaymentDriver):
    """Paystack payment gateway driver.

    Implements the abstract methods defined in ``BasePaymentDriver``.
    The driver reads its configuration from the ``Coscore Payment Gateway Setting``
    record named ``Paystack``.
    """

    def __init__(self):
        # Load configuration lazily from the single settings doc
        # Load configuration lazily from the settings doc
        setting = frappe.get_doc("Coscore Payment Gateway Setting", "Paystack")
        # The DocType defines the fields as `api_key` and `api_secret`
        # Keep backward compatibility: if the newer `public_key`/`secret_key` exist, use them;
        # otherwise fall back to the legacy field names.
        self.public_key = getattr(setting, "public_key", getattr(setting, "api_key", ""))
        self.secret_key = getattr(setting, "secret_key", getattr(setting, "api_secret", ""))
        # Default callback – can be overridden when ``initiate_payment`` is called
        self.default_callback = get_url("/api/method/coscore.utils.payment.handle_payment_callback")

    def initiate_payment(self, order_doc, amount, callback_url=None):
        """Create a Paystack transaction and return the redirect URL.

        Args:
            order_doc: The ERPNext order document (e.g., Sales Order).
            amount (float): Amount to be charged. If falsy, falls back to
                ``order_doc.grand_total``.
            callback_url (str, optional): URL Paystack should redirect to after
                payment. Defaults to the driver‑configured callback.
        Returns:
            dict: ``{"payment_url": <url>, "gateway_reference": <ref>}``
        """
        amt = amount or getattr(order_doc, "grand_total", 0)
        callback = callback_url or self.default_callback
        headers = {"Authorization": f"Bearer {self.secret_key}"}
        payload = {
            "email": getattr(order_doc, "customer_email", "customer@example.com"),
            "amount": int(amt * 100),  # Paystack expects kobo
            "callback_url": callback,
            "reference": order_doc.name,
        }
        resp = requests.post("https://api.paystack.co/transaction/initialize", json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()["data"]
        return {"payment_url": data["authorization_url"], "gateway_reference": data["reference"]}

    def verify_ipn(self, request_data):
        """Verify a Paystack callback (IPN) request.

        Paystack redirects back to the ``callback_url`` with a ``reference``
        query parameter. This method confirms the transaction status via the
        Paystack API.
        """
        reference = request_data.get("reference")
        if not reference:
            return {"success": False, "error": "Missing reference"}
        headers = {"Authorization": f"Bearer {self.secret_key}"}
        resp = requests.get(f"https://api.paystack.co/transaction/verify/{reference}", headers=headers)
        resp.raise_for_status()
        data = resp.json()["data"]
        return {"success": data["status"] == "success", "transaction_id": data["reference"]}
