import frappe
from .base import BasePaymentDriver
from .paystack import PaystackDriver
# Placeholder for future Stripe driver
# from .stripe import StripeDriver

_DRIVERS = {
    "Paystack": PaystackDriver,
    # "Stripe": StripeDriver,
}

def get_payment_driver(gateway_name: str) -> BasePaymentDriver:
    driver_cls = _DRIVERS.get(gateway_name)
    if not driver_cls:
        raise ValueError(f"Unsupported payment gateway: {gateway_name}")
    return driver_cls()
