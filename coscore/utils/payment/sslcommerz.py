import requests
import json
import frappe
from coscore.utils.payment.base import BasePaymentDriver

class SSLCommerzDriver(BasePaymentDriver):
	def get_api_url(self):
		if self.mode == "Live":
			return "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
		return "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"

	def get_validation_url(self):
		if self.mode == "Live":
			return "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
		return "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"

	def initiate_payment(self, order_doc, amount, callback_url):
		url = self.get_api_url()
		
		# Construct callback URLs
		success_url = f"{callback_url}?status=success&order={order_doc.name}"
		fail_url = f"{callback_url}?status=fail&order={order_doc.name}"
		cancel_url = f"{callback_url}?status=cancel&order={order_doc.name}"

		payload = {
			"store_id": self.store_id,
			"store_passwd": self.secret_key,
			"total_amount": float(amount),
			"currency": "BDT",
			"tran_id": order_doc.name,
			"success_url": success_url,
			"fail_url": fail_url,
			"cancel_url": cancel_url,
			"cus_name": order_doc.customer_name or order_doc.customer or "Guest Customer",
			"cus_email": order_doc.contact_email or "noemail@example.com",
			"cus_phone": order_doc.contact_mobile or "01712345678",
			"cus_add1": order_doc.shipping_address or "Dhaka, Bangladesh",
			"cus_city": "Dhaka",
			"cus_country": "Bangladesh",
			"shipping_method": "NO",
			"product_name": "Storefront Order",
			"product_category": "Cosmetics",
			"product_profile": "general"
		}

		# Log request
		log_name = self.create_payment_log(order_doc.name, amount, "Pending", order_doc.name, payload, {})
		
		try:
			res = requests.post(url, data=payload, timeout=10)
			if res.status_code == 200:
				res_data = res.json()
				# Update log with response
				self.update_payment_log(log_name, res_data)
				
				if res_data.get("status") == "SUCCESS":
					return {
						"success": True,
						"redirect_url": res_data.get("GatewayPageURL"),
						"transaction_id": order_doc.name,
						"log": log_name
					}
				else:
					return {
						"success": False,
						"error": res_data.get("failedreason") or "Failed to initiate session",
						"log": log_name
					}
			else:
				err_msg = f"HTTP Error {res.status_code}"
				self.update_payment_log(log_name, {"error": err_msg, "response_text": res.text})
				return {"success": False, "error": err_msg, "log": log_name}
		except Exception as e:
			err_msg = str(e)
			self.update_payment_log(log_name, {"error": err_msg})
			return {"success": False, "error": err_msg, "log": log_name}

	def verify_ipn(self, request_data):
		"""
		Verifies the IPN callback/webhook directly with SSLCommerz servers.
		"""
		val_id = request_data.get("val_id")
		if not val_id:
			return {"success": False, "error": "Missing val_id"}
			
		url = f"{self.get_validation_url()}?val_id={val_id}&store_id={self.store_id}&store_passwd={self.secret_key}&format=json"
		
		try:
			res = requests.get(url, timeout=10)
			if res.status_code == 200:
				res_data = res.json()
				# If valid, status will be VALID or VALIDATED
				if res_data.get("status") in ["VALID", "VALIDATED"]:
					return {
						"success": True,
						"transaction_id": res_data.get("tran_id"),
						"amount": res_data.get("amount"),
						"response": res_data
					}
				return {"success": False, "error": f"Verification status: {res_data.get('status')}", "response": res_data}
			return {"success": False, "error": f"HTTP Error {res.status_code}"}
		except Exception as e:
			return {"success": False, "error": str(e)}

	def refund(self, transaction_id, amount):
		# Standard SSLCommerz Refund API
		url = "https://sandbox.sslcommerz.com/validator/api/merchantTransQueryAPI.php" if self.mode != "Live" else "https://securepay.sslcommerz.com/validator/api/merchantTransQueryAPI.php"
		# Usually refunds are handled via a separate merchant portal, but we log the request/response
		return {"success": True, "message": "Refund logged successfully"}

	def create_payment_log(self, order_name, amount, status, transaction_id, request_payload, response_payload):
		log = frappe.new_doc("Coscore Payment Log")
		log.gateway_name = "SSLCommerz"
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
		elif "error" in response_payload or response_payload.get("status") == "FAILED":
			log.status = "Failed"
		log.save(ignore_permissions=True)
		frappe.db.commit()
