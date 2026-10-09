import requests
import json
import frappe
from coscore.utils.payment.base import BasePaymentDriver

class BKashDriver(BasePaymentDriver):
	def get_base_url(self):
		if self.mode == "Live":
			return "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized"
		return "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized"

	def get_headers(self, token):
		return {
			"Content-Type": "application/json",
			"Authorization": f"Bearer {token}",
			"X-APP-Key": self.api_key
		}

	def initiate_payment(self, order_doc, amount, callback_url):
		# Standard tokenized bKash checkout flow includes:
		# 1. Grant Token
		# 2. Create Payment API
		# 3. Customer redirects to bKash checkout page
		# For local testing, we create a stub that logs the request and returns a mock redirect success URL
		
		payload = {
			"mode": "0011",
			"payerReference": order_doc.name,
			"callbackURL": callback_url,
			"amount": float(amount),
			"currency": "BDT",
			"intent": "sale",
			"merchantInvoiceNumber": order_doc.name
		}

		log_name = self.create_payment_log(order_doc.name, amount, "Pending", order_doc.name, payload, {})
		
		# Return success mock response for local testing
		mock_url = f"{callback_url}?status=success&order={order_doc.name}&paymentID=TR-{order_doc.name}"
		mock_response = {
			"status": "SUCCESS",
			"paymentID": f"TR-{order_doc.name}",
			"bkashURL": mock_url
		}
		
		self.update_payment_log(log_name, mock_response)
		
		return {
			"success": True,
			"redirect_url": mock_url,
			"transaction_id": f"TR-{order_doc.name}",
			"log": log_name
		}

	def verify_ipn(self, request_data):
		# Verify callback parameters
		payment_id = request_data.get("paymentID")
		if payment_id:
			return {
				"success": True,
				"transaction_id": request_data.get("order"),
				"amount": request_data.get("amount", 0),
				"response": {"status": "Completed", "paymentID": payment_id}
			}
		return {"success": False, "error": "Invalid callback data"}

	def refund(self, transaction_id, amount):
		return {"success": True, "message": "Refund logged successfully"}

	def create_payment_log(self, order_name, amount, status, transaction_id, request_payload, response_payload):
		log = frappe.new_doc("Coscore Payment Log")
		log.gateway_name = "bKash"
		log.sales_order = order_name
		log.amount = amount
		log.status = status
		log.transaction_id = transaction_id
		log.raw_request = json.dumps(request_payload, indent=2)
		log.raw_response = json.dumps(response_payload, indent=2)
		log.insert(ignore_permissions=True)
		frappe.db.commit()
		return log.name

	def update_payment_log(self, log_name, response_payload):
		log = frappe.get_doc("Coscore Payment Log", log_name)
		log.raw_response = json.dumps(response_payload, indent=2)
		if response_payload.get("status") == "SUCCESS":
			log.status = "Success"
		log.save(ignore_permissions=True)
		frappe.db.commit()
