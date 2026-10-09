class BasePaymentDriver:
	def __init__(self, api_key, secret_key, store_id=None, mode="Sandbox"):
		self.api_key = api_key
		self.secret_key = secret_key
		self.store_id = store_id
		self.mode = mode # 'Sandbox' or 'Live'

	def initiate_payment(self, order_doc, amount, callback_url):
		raise NotImplementedError

	def verify_ipn(self, request_data):
		raise NotImplementedError

	def handle_success(self, request_data):
		raise NotImplementedError

	def handle_fail(self, request_data):
		raise NotImplementedError

	def handle_cancel(self, request_data):
		raise NotImplementedError

	def refund(self, transaction_id, amount):
		raise NotImplementedError
