import requests
import json
from coscore.utils.courier.base import BaseCourierDriver

class SteadfastDriver(BaseCourierDriver):
	default_base_url = "https://sandbox.steadfast.com.bd/t/api/v1"

	def get_headers(self):
		return {
			"Api-Key": self.api_key,
			"Secret-Key": self.secret_key,
			"Content-Type": "application/json"
		}

	def create_consignment(self, order_doc, shipping_details):
		url = f"{self.base_url}/create_order"
		
		# Parse address details
		address = shipping_details.get("address", "")
		district = shipping_details.get("district", "")
		thana = shipping_details.get("thana", "")
		full_address = f"{address}, Thana: {thana}, District: {district}"
		
		payload = {
			"invoice": order_doc.name,
			"recipient_name": order_doc.customer_name or order_doc.customer,
			"recipient_phone": order_doc.contact_mobile or shipping_details.get("phone", ""),
			"recipient_address": full_address,
			"cod_amount": order_doc.grand_total,
			"note": f"Web Order Ref: {order_doc.name}"
		}
		
		try:
			res = requests.post(url, headers=self.get_headers(), json=payload, timeout=10)
			# Handle sandbox vs production response structure
			if res.status_code == 200:
				res_data = res.json()
				if res_data.get("status") == 200 or res_data.get("status") == "success":
					consignment = res_data.get("consignment", {}) or res_data.get("data", {})
					tracking_code = consignment.get("tracking_code") or consignment.get("consignment_id") or res_data.get("tracking_code")
					return {
						"success": True,
						"consignment_id": tracking_code,
						"status": "In Transit",
						"response": res_data
					}
				else:
					return {
						"success": False,
						"error": res_data.get("message") or "Steadfast response failed",
						"response": res_data
					}
			else:
				return {
					"success": False,
					"error": f"HTTP Error {res.status_code}",
					"response": res.text
				}
		except Exception as e:
			return {
				"success": False,
				"error": str(e),
				"response": {}
			}

	def get_status_by_cid(self, consignment_id):
		url = f"{self.base_url}/status_by_trackingcode/{consignment_id}"
		try:
			res = requests.get(url, headers=self.get_headers(), timeout=10)
			if res.status_code == 200:
				res_data = res.json()
				return {
					"success": True,
					"status": res_data.get("status") or res_data.get("delivery_status"),
					"response": res_data
				}
			return {"success": False, "error": f"HTTP Error {res.status_code}"}
		except Exception as e:
			return {"success": False, "error": str(e)}

	def get_status_by_invoice(self, invoice_id):
		url = f"{self.base_url}/status_by_invoice/{invoice_id}"
		try:
			res = requests.get(url, headers=self.get_headers(), timeout=10)
			if res.status_code == 200:
				res_data = res.json()
				return {
					"success": True,
					"status": res_data.get("status") or res_data.get("delivery_status"),
					"response": res_data
				}
			return {"success": False, "error": f"HTTP Error {res.status_code}"}
		except Exception as e:
			return {"success": False, "error": str(e)}

	def bulk_create(self, consignments):
		url = f"{self.base_url}/create_order/bulk"
		payload = {"orders": consignments}
		try:
			res = requests.post(url, headers=self.get_headers(), json=payload, timeout=15)
			return {"success": res.status_code == 200, "response": res.json()}
		except Exception as e:
			return {"success": False, "error": str(e)}

	def cancel_consignment(self, consignment_id):
		url = f"{self.base_url}/cancel_order/{consignment_id}"
		try:
			res = requests.post(url, headers=self.get_headers(), timeout=10)
			return {"success": res.status_code == 200, "response": res.json()}
		except Exception as e:
			return {"success": False, "error": str(e)}
