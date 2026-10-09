class BaseCourierDriver:
	def __init__(self, api_key, secret_key, base_url=None):
		self.api_key = api_key
		self.secret_key = secret_key
		self.base_url = base_url or self.default_base_url

	def create_consignment(self, order_doc, shipping_details):
		raise NotImplementedError

	def get_status_by_cid(self, consignment_id):
		raise NotImplementedError

	def get_status_by_invoice(self, invoice_id):
		raise NotImplementedError

	def bulk_create(self, consignments):
		raise NotImplementedError

	def cancel_consignment(self, consignment_id):
		raise NotImplementedError
