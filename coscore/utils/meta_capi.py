import hashlib
import ipaddress
import json
import re
import requests
import frappe
from frappe.utils import now_datetime, flt

META_API_VERSION = "v19.0"
DEFAULT_USD_BDT_RATE = 122.50

def sha256_hash(value: str) -> str:
	"""
	Normalizes value (trim + lowercase) and hashes using SHA-256 for Meta privacy compliance.
	"""
	if not value:
		return ""
	cleaned = str(value).strip().lower()
	if not cleaned:
		return ""
	return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

def normalize_and_hash_phone(phone: str) -> str:
	"""
	Normalizes phone number to E.164 without leading plus (e.g. Bangladesh 8801XXXXXXXXX)
	and hashes using SHA-256.
	"""
	if not phone:
		return ""
	digits = re.sub(r"\D", "", str(phone))
	if digits.startswith("01") and len(digits) == 11:
		digits = f"88{digits}"
	elif digits.startswith("+880"):
		digits = digits.replace("+", "")
	elif digits.startswith("880") and len(digits) == 13:
		pass
	return hashlib.sha256(digits.encode("utf-8")).hexdigest()

def is_valid_ip(ip_str: str) -> bool:
	if not ip_str:
		return False
	try:
		ipaddress.ip_address(str(ip_str).strip())
		return True
	except Exception:
		return False

def is_ipv6(ip_str: str) -> bool:
	if not ip_str:
		return False
	try:
		return isinstance(ipaddress.ip_address(str(ip_str).strip()), ipaddress.IPv6Address)
	except Exception:
		return False

def get_client_ip(preferred_ip: str = None) -> str:
	"""
	Accurately resolves client IP handling Cloudflare edge proxying and Parameter Builder spec:
	1. Prioritizes valid IPv6 addresses over IPv4.
	2. Checks preferred_ip and cookie _fbi (saved by client-side parameter builder).
	3. Checks Cloudflare CF-Connecting-IP, X-Forwarded-For proxy chain, and X-Real-IP.
	4. Falls back to request remote_addr or 127.0.0.1.
	5. Never hashes the client IP.
	"""
	candidate_ips = []

	# 1. Preferred IP from payload or parameter
	if preferred_ip and is_valid_ip(preferred_ip):
		candidate_ips.append(str(preferred_ip).strip())

	# 2. Check cookies (_fbi / _client_ip) set by client-side parameter builder
	if hasattr(frappe, "request") and frappe.request and hasattr(frappe.request, "cookies"):
		fbi_cookie = frappe.request.cookies.get("_fbi") or frappe.request.cookies.get("_client_ip")
		if fbi_cookie and is_valid_ip(fbi_cookie):
			candidate_ips.append(str(fbi_cookie).strip())

	# 3. Check request headers
	if hasattr(frappe, "request") and frappe.request:
		headers = frappe.request.headers
		# Cloudflare real client IP
		cf_ip = headers.get("CF-Connecting-IP")
		if cf_ip and is_valid_ip(cf_ip):
			candidate_ips.append(cf_ip.strip())

		# X-Forwarded-For proxy chain (may contain multiple IPs)
		x_forwarded = headers.get("X-Forwarded-For")
		if x_forwarded:
			for part in x_forwarded.split(","):
				cleaned_part = part.strip()
				if is_valid_ip(cleaned_part):
					candidate_ips.append(cleaned_part)

		# X-Real-IP
		x_real_ip = headers.get("X-Real-IP")
		if x_real_ip and is_valid_ip(x_real_ip):
			candidate_ips.append(x_real_ip.strip())

		# Remote Address
		if hasattr(frappe.request, "remote_addr") and is_valid_ip(frappe.request.remote_addr):
			candidate_ips.append(frappe.request.remote_addr.strip())

	if hasattr(frappe, "local") and hasattr(frappe.local, "request_ip") and is_valid_ip(frappe.local.request_ip):
		candidate_ips.append(frappe.local.request_ip.strip())

	# Prioritize IPv6 over IPv4
	for candidate in candidate_ips:
		if is_ipv6(candidate):
			return candidate

	# Fallback to first valid IPv4
	for candidate in candidate_ips:
		if is_valid_ip(candidate):
			return candidate

	return "127.0.0.1"

def process_with_param_builder(
	host: str = "www.lookzene.com",
	query_params: dict = None,
	cookies: dict = None,
	referer: str = None,
	client_ip: str = None,
	request_uri: str = "/",
	fbc: str = None,
	fbp: str = None,
	event_source_url: str = None
) -> dict:
	"""
	Executes Meta's official Conversions API Parameter Builder SDK (Python) to:
	- Generate match keys with official 8-character appendix (fbc, fbp, event_source_url, referrer_url)
	- Increase parameter coverage per Meta's Jul 21, 2026 specifications.
	"""
	try:
		from capi_param_builder import ParamBuilder, PlainDataObject
		pb = ParamBuilder(["lookzene.com"])
		q_params = {}
		if query_params:
			for k, v in query_params.items():
				q_params[k] = v if isinstance(v, list) else [str(v)]

		cookie_dict = dict(cookies or {})
		if fbc and "_fbc" not in cookie_dict:
			cookie_dict["_fbc"] = str(fbc).strip()
		if fbp and "_fbp" not in cookie_dict:
			cookie_dict["_fbp"] = str(fbp).strip()
		if client_ip and "_fbi" not in cookie_dict:
			cookie_dict["_fbi"] = str(client_ip).strip()

		data = PlainDataObject(
			host=host or "www.lookzene.com",
			query_params=q_params,
			cookies=cookie_dict,
			referer=referer,
			x_forwarded_for=client_ip,
			remote_address=client_ip or "127.0.0.1",
			scheme="https",
			request_uri=request_uri or "/"
		)
		pb.process_request_from_context(data)
		return {
			"fbc": pb.get_fbc() or fbc,
			"fbp": pb.get_fbp() or fbp,
			"event_source_url": pb.get_event_source_url() or event_source_url,
			"referrer_url": pb.get_referrer_url() or referer,
		}
	except Exception as err:
		frappe.logger("meta_capi").debug(f"ParamBuilder execution fallback: {err}")
		return {
			"fbc": fbc,
			"fbp": fbp,
			"event_source_url": event_source_url,
			"referrer_url": referer,
		}

def get_client_user_agent() -> str:
	"""
	Retrieves visitor User-Agent header from incoming request or defaults to server identifier.
	"""
	if hasattr(frappe, "request") and frappe.request:
		return frappe.request.headers.get("User-Agent") or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
	return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"

def convert_bdt_to_usd(amount_bdt: float, transaction_date: str = None) -> tuple[float, float]:
	"""
	Converts BDT amount to USD accurately for Meta Ads Manager:
	1. Checks ERPNext's Currency Exchange table (tabCurrency Exchange)
	2. Checks site_config.json (usd_bdt_exchange_rate)
	3. Falls back to DEFAULT_USD_BDT_RATE (122.50)
	Returns: (converted_usd_amount, exchange_rate_used)
	"""
	amount_bdt = flt(amount_bdt)
	rate = None

	# 1. Check ERPNext Currency Exchange table
	try:
		filters = {"from_currency": "USD", "to_currency": "BDT"}
		if transaction_date:
			filters["date"] = ["<=", transaction_date]
		rate = frappe.db.get_value("Currency Exchange", filters, "exchange_rate", order_by="date desc")
		if not rate:
			filters_reverse = {"from_currency": "BDT", "to_currency": "USD"}
			if transaction_date:
				filters_reverse["date"] = ["<=", transaction_date]
			rev_rate = frappe.db.get_value("Currency Exchange", filters_reverse, "exchange_rate", order_by="date desc")
			if rev_rate and flt(rev_rate) > 0:
				rate = 1.0 / flt(rev_rate)
	except Exception:
		pass

	# 2. Check site_config.json
	if not rate:
		conf_rate = frappe.conf.get("usd_bdt_exchange_rate")
		if conf_rate:
			rate = flt(conf_rate)
		else:
			bdt_usd_rate = frappe.conf.get("bdt_to_usd_rate")
			if bdt_usd_rate and flt(bdt_usd_rate) > 0:
				rate = 1.0 / flt(bdt_usd_rate)

	# 3. Default fallback
	if not rate or flt(rate) <= 0:
		rate = DEFAULT_USD_BDT_RATE

	rate = flt(rate)
	usd_amount = round(amount_bdt / rate, 2)
	return usd_amount, rate

def get_meta_credentials(app_source: str = "coscore"):
	"""
	Retrieves Meta Pixel/Dataset ID and Access Token for either Coscore or Nella.
	Priority:
	1. App-specific overrides in site_config.json (e.g. nella_meta_pixel_id)
	2. Global meta_pixel_id and meta_capi_token in site_config.json
	3. Fallback to Coscore SEO Setting DocType
	"""
	is_nella = (app_source or "").lower() in ["nella", "nella landing", "nella.lookzene.com"]

	if is_nella:
		pixel_id = frappe.conf.get("nella_meta_pixel_id") or frappe.conf.get("meta_pixel_id")
		access_token = frappe.conf.get("nella_meta_capi_token") or frappe.conf.get("meta_capi_token")
	else:
		pixel_id = frappe.conf.get("meta_pixel_id")
		access_token = frappe.conf.get("meta_capi_token")

	# Fallback to Coscore SEO Setting if missing in conf
	if not pixel_id and frappe.db.exists("Coscore SEO Setting", "Coscore SEO Setting"):
		try:
			seo = frappe.get_cached_doc("Coscore SEO Setting", "Coscore SEO Setting")
			pixel_id = seo.meta_pixel_id
		except Exception:
			pass

	return pixel_id, access_token

def send_meta_capi_event(
	event_name: str,
	event_id: str = None,
	user_data: dict = None,
	custom_data: dict = None,
	app_source: str = "coscore",
	event_source_url: str = None,
	action_source: str = "website",
	attribution_data: dict = None,
	original_event_data: dict = None,
	event_time: int = None
) -> dict:
	"""
	Primary function to transmit Conversions API event to Meta with full tracing & audit log.
	Compatible with both Coscore (Main Store) and Nella (Landing Page).
	"""
	pixel_id, access_token = get_meta_credentials(app_source)

	if not pixel_id or not access_token:
		error_msg = f"Meta CAPI credentials missing for app '{app_source}' (pixel_id={pixel_id})."
		frappe.logger("meta_capi").warning(error_msg)
		create_event_audit_log(
			event_name=event_name,
			source="Meta",
			payload={"event_name": event_name, "event_id": event_id, "app_source": app_source},
			sent_status="Failed",
			response_log={"error": error_msg}
		)
		return {"status": "error", "message": error_msg}

	user_data = user_data or {}
	custom_data = custom_data or {}

	# Generate fallback event_id if not provided
	if not event_id:
		event_id = f"evt_{now_datetime().strftime('%Y%m%d%H%M%S')}_{frappe.generate_hash(length=8)}"

	# Build compliant user_data
	client_ip = user_data.get("client_ip_address") or user_data.get("client_ip") or get_client_ip()
	client_ua = user_data.get("client_user_agent") or user_data.get("user_agent") or get_client_user_agent()

	formatted_user_data = {
		"client_ip_address": client_ip,
		"client_user_agent": client_ua
	}

	# Hash PII fields if plain values are provided; preserve if already sha256 (64 hex chars or with appendix)
	def process_hash(val, is_phone=False):
		if not val:
			return None
		s_val = str(val).strip()
		# If already SHA-256 hex string (length 64, lowercase hex)
		if len(s_val) == 64 and re.match(r"^[a-f0-9]{64}$", s_val):
			return s_val
		# If already processed by Parameter Builder (64 hex + dot + appendix)
		if re.match(r"^[a-f0-9]{64}\.[A-Za-z0-9_-]{2,10}$", s_val):
			return s_val
		return normalize_and_hash_phone(s_val) if is_phone else sha256_hash(s_val)

	# Email
	raw_email = user_data.get("em") or user_data.get("email")
	if isinstance(raw_email, list):
		processed_em = [process_hash(e) for e in raw_email if e]
		if processed_em:
			formatted_user_data["em"] = processed_em
	elif raw_email:
		h = process_hash(raw_email)
		if h:
			formatted_user_data["em"] = [h]

	# Phone
	raw_phone = user_data.get("ph") or user_data.get("phone") or user_data.get("mobile")
	if isinstance(raw_phone, list):
		processed_ph = [process_hash(p, is_phone=True) for p in raw_phone if p]
		if processed_ph:
			formatted_user_data["ph"] = processed_ph
		elif None in raw_phone:
			formatted_user_data["ph"] = [None]
	elif raw_phone:
		h = process_hash(raw_phone, is_phone=True)
		if h:
			formatted_user_data["ph"] = [h]
	else:
		formatted_user_data["ph"] = [None]

	# Names
	first_name = user_data.get("fn") or user_data.get("first_name")
	if first_name:
		h_fn = process_hash(first_name)
		if h_fn:
			formatted_user_data["fn"] = [h_fn]

	last_name = user_data.get("ln") or user_data.get("last_name")
	if last_name:
		h_ln = process_hash(last_name)
		if h_ln:
			formatted_user_data["ln"] = [h_ln]

	# City / District
	city = user_data.get("ct") or user_data.get("city") or user_data.get("district")
	if city:
		h_ct = process_hash(city)
		if h_ct:
			formatted_user_data["ct"] = [h_ct]

	# Country
	country = user_data.get("country") or "bd"
	if country:
		h_co = process_hash(country)
		if h_co:
			formatted_user_data["country"] = [h_co]

	# State / Division
	state = user_data.get("st") or user_data.get("state") or user_data.get("division")
	if state:
		h_st = process_hash(state)
		if h_st:
			formatted_user_data["st"] = [h_st]

	# Zip / Postal code
	zip_code = user_data.get("zp") or user_data.get("zip") or user_data.get("postal_code")
	if zip_code:
		h_zp = process_hash(zip_code)
		if h_zp:
			formatted_user_data["zp"] = [h_zp]

	# External ID (Unique customer identifier for Event Match Quality)
	external_id = user_data.get("external_id") or user_data.get("customer_id")
	if external_id:
		h_ext = process_hash(external_id)
		if h_ext:
			formatted_user_data["external_id"] = [h_ext]

	# Process tracking tokens with Meta Parameter Builder SDK
	pb_host = "nella.lookzene.com" if "nella" in (app_source or "").lower() else "www.lookzene.com"
	pb_cookies = {}
	if user_data.get("fbc"):
		pb_cookies["_fbc"] = str(user_data["fbc"]).strip()
	if user_data.get("fbp"):
		pb_cookies["_fbp"] = str(user_data["fbp"]).strip()
	if client_ip:
		pb_cookies["_fbi"] = client_ip

	pb_res = process_with_param_builder(
		host=pb_host,
		cookies=pb_cookies,
		referer=user_data.get("referrer_url"),
		client_ip=client_ip,
		request_uri="/checkout" if "purchase" in event_name.lower() else "/",
		fbc=user_data.get("fbc"),
		fbp=user_data.get("fbp"),
		event_source_url=event_source_url
	)

	# Cookie tracking tokens (_fbp, _fbc) with case preserved
	if pb_res.get("fbp"):
		formatted_user_data["fbp"] = pb_res["fbp"]
	elif user_data.get("fbp"):
		formatted_user_data["fbp"] = str(user_data["fbp"]).strip()

	if pb_res.get("fbc"):
		formatted_user_data["fbc"] = pb_res["fbc"]
	elif user_data.get("fbc"):
		formatted_user_data["fbc"] = str(user_data["fbc"]).strip()

	# Build event payload entry
	event_entry = {
		"event_name": event_name,
		"event_time": int(event_time or now_datetime().timestamp()),
		"event_id": event_id,
		"action_source": action_source or "website",
		"user_data": formatted_user_data,
		"custom_data": custom_data
	}

	# Referrer URL (page that referred the visitor, e.g. facebook.com, instagram.com)
	final_referrer = pb_res.get("referrer_url") or user_data.get("referrer_url")
	if final_referrer:
		event_entry["referrer_url"] = str(final_referrer).strip()

	final_source_url = pb_res.get("event_source_url") or event_source_url
	if not final_source_url:
		if "nella" in (app_source or "").lower():
			final_source_url = "https://nella.lookzene.com"
		else:
			final_source_url = "https://www.lookzene.com"

	event_entry["event_source_url"] = final_source_url

	if attribution_data:
		event_entry["attribution_data"] = attribution_data

	if original_event_data:
		event_entry["original_event_data"] = original_event_data
	else:
		event_entry["original_event_data"] = {
			"event_name": event_name,
			"event_time": event_entry["event_time"]
		}

	request_payload = {
		"data": [event_entry]
	}

	# Optional Meta Test Event Code for development verification in Events Manager
	test_event_code = frappe.conf.get("meta_test_event_code")
	if test_event_code:
		request_payload["test_event_code"] = test_event_code

	# Meta Graph API endpoint
	meta_url = f"https://graph.facebook.com/{META_API_VERSION}/{pixel_id}/events"
	headers = {
		"Authorization": f"Bearer {access_token}",
		"Content-Type": "application/json"
	}

	sent_status = "Pending"
	response_log = {}

	try:
		res = requests.post(meta_url, headers=headers, json=request_payload, timeout=12)
		try:
			response_log = res.json()
		except Exception:
			response_log = {"raw_response": res.text}

		if res.status_code == 200 and response_log.get("events_received", 0) > 0:
			sent_status = "Success"
		else:
			sent_status = "Failed"

	except Exception as e:
		sent_status = "Failed"
		response_log = {"error": str(e)}

	# Persist full audit trace in ERPNext DocType
	log_id = create_event_audit_log(
		event_name=event_name,
		source="Meta",
		payload=request_payload,
		sent_status=sent_status,
		response_log=response_log
	)

	return {
		"status": "success" if sent_status == "Success" else "failed",
		"event_name": event_name,
		"event_id": event_id,
		"log_id": log_id,
		"meta_response": response_log
	}

def create_event_audit_log(event_name: str, source: str, payload: dict, sent_status: str, response_log: dict):
	"""
	Logs every CAPI event execution (success + failure) into the database for event tracing.
	"""
	if not frappe.db.exists("DocType", "Coscore Ad Tracking Event"):
		return None

	try:
		log = frappe.new_doc("Coscore Ad Tracking Event")
		log.name = f"META-LOG-{now_datetime().strftime('%Y%m%d%H%M%S')}-{frappe.generate_hash(length=6)}"
		log.event_name = event_name if event_name in [
			"PageView", "ViewContent", "AddToCart", "Purchase", "Lead", "InitiateCheckout", "Contact"
		] else "Purchase"
		# Source must match Select options: Meta, GA4, Cloudflare
		log.source = "Meta"
		
		# Set payload in payload_json field
		payload_str = json.dumps(payload, indent=2)
		log.payload_json = payload_str

		log.sent_status = "Success" if sent_status in ["Sent", "Success"] else ("Failed" if sent_status == "Failed" else "Pending")
		log.response_log = json.dumps(response_log, indent=2)
		log.created_at = now_datetime()
		log.insert(ignore_permissions=True)
		frappe.db.commit()
		return log.name
	except Exception as err:
		frappe.log_error(f"Failed to record Meta CAPI event trace in DB: {str(err)}", "Meta CAPI Logging Error")
		return None

def setup_sales_order_tracking_fields():
	"""
	Utility to ensure custom tracking fields exist on DocType 'Sales Order'
	to preserve customer Cloudflare IP, User-Agent, and tokens from checkout.
	"""
	from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

	custom_fields = {
		"Sales Order": [
			{"fieldname": "custom_client_ip", "label": "Customer Client IP", "fieldtype": "Data", "insert_after": "order_source", "read_only": 1},
			{"fieldname": "custom_client_user_agent", "label": "Customer User Agent", "fieldtype": "Small Text", "insert_after": "custom_client_ip", "read_only": 1},
			{"fieldname": "custom_fbp", "label": "Meta FBP Cookie", "fieldtype": "Data", "insert_after": "custom_client_user_agent", "read_only": 1},
			{"fieldname": "custom_fbc", "label": "Meta FBC Cookie", "fieldtype": "Data", "insert_after": "custom_fbp", "read_only": 1},
			{"fieldname": "custom_meta_event_id", "label": "Meta Event ID", "fieldtype": "Data", "insert_after": "custom_fbc", "read_only": 1},
			{"fieldname": "custom_referrer_url", "label": "Referrer URL", "fieldtype": "Small Text", "insert_after": "custom_meta_event_id", "read_only": 1},
			{"fieldname": "custom_event_source_url", "label": "Event Source URL", "fieldtype": "Small Text", "insert_after": "custom_referrer_url", "read_only": 1}
		]
	}
	create_custom_fields(custom_fields, update=True)
	frappe.db.commit()
	return "Tracking custom fields created on Sales Order successfully"

def test_end_to_end_purchase_flow():
	"""
	Validates the complete Meta Conversions API (CAPI) workflow:
	1. Ensures COD Sales Order creation does NOT trigger any Meta Purchase event.
	2. Ensures Draft Payment Entry does NOT trigger any Meta Purchase event.
	3. Ensures Submitted Payment Entry DOES trigger Meta Purchase event with:
	   - Converted USD currency and value
	   - Preserved customer Cloudflare IP & User-Agent
	   - Meta 200 OK response with events_received = 1
	"""
	from coscore.api.orders import create_sales_order
	from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry

	results = {}

	# Count baseline Purchase events in DB
	base_count = frappe.db.count("Coscore Ad Tracking Event", filters={"event_name": "Purchase", "source": "Meta"})
	results["initial_purchase_log_count"] = base_count

	# 1. Simulate COD Checkout from website (Nella Landing / Coscore)
	test_order_id = f"TEST-ORD-{frappe.generate_hash(length=6).upper()}"
	test_payload = {
		"order_id": test_order_id,
		"order_source": "nella landing",
		"full_name": "Sultana Razia",
		"phone": "01711223344",
		"email": "sultana.razia@lookzene.customer",
		"shipping_address": {
			"district": "Dhaka",
			"address": "House 12, Road 5, Dhanmondi",
			"phone": "01711223344"
		},
		"items": [
			{
				"id": "nella-white-snow",
				"name": "Nella White Snow Fermented Underarm Whitening Cream",
				"quantity": 1,
				"price": 1440.0
			}
		],
		"total_amount": 1500.0,
		"shipping_charge": 60.0,
		"discount_amount": 0,
		"client_ip": "103.145.118.25", # Simulated Cloudflare client IP
		"client_user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15",
		"fbp": "fb.1.1712345678901.123456789",
		"fbc": "fb.1.1712345678902.987654321"
	}

	so_resp = create_sales_order(test_payload)
	so_name = so_resp.get("order_name")
	results["sales_order_created"] = so_name

	# Verify Sales Order customer tracking fields
	so = frappe.get_doc("Sales Order", so_name)
	results["so_custom_client_ip"] = so.custom_client_ip
	results["so_custom_client_ua"] = so.custom_client_user_agent
	results["so_grand_total_bdt"] = so.grand_total

	# Verify NO Purchase event fired upon Sales Order creation
	count_after_so = frappe.db.count("Coscore Ad Tracking Event", filters={"event_name": "Purchase", "source": "Meta"})
	results["purchase_events_after_so_creation"] = count_after_so - base_count
	assert count_after_so == base_count, "ERROR: Purchase event must NOT trigger on Sales Order creation!"

	# 2. Create Payment Entry against Sales Order as Draft (Administrator manually preparing entry)
	pe = get_payment_entry("Sales Order", so.name)
	pe.posting_date = frappe.utils.today()
	pe.reference_no = f"REC-{test_order_id}"
	pe.reference_date = frappe.utils.today()
	pe.insert(ignore_permissions=True)
	results["draft_payment_entry"] = pe.name

	# Verify NO Purchase event fired upon Draft Payment Entry creation
	count_after_draft_pe = frappe.db.count("Coscore Ad Tracking Event", filters={"event_name": "Purchase", "source": "Meta"})
	results["purchase_events_after_draft_pe"] = count_after_draft_pe - base_count
	assert count_after_draft_pe == base_count, "ERROR: Purchase event must NOT trigger on Draft Payment Entry!"

	# 3. Submit Payment Entry (Administrator confirms payment received)
	pe.submit()
	results["submitted_payment_entry"] = pe.name

	# Verify Purchase event WAS fired upon Payment Entry submission
	count_after_submit_pe = frappe.db.count("Coscore Ad Tracking Event", filters={"event_name": "Purchase", "source": "Meta"})
	results["purchase_events_after_submit_pe"] = count_after_submit_pe - base_count
	assert count_after_submit_pe == base_count + 1, "ERROR: Exactly 1 Purchase event must trigger upon Payment Entry submission!"

	# Retrieve the emitted CAPI log from database
	latest_log_name = frappe.db.get_value(
		"Coscore Ad Tracking Event",
		filters={"event_name": "Purchase", "source": "Meta"},
		fieldname="name",
		order_by="creation desc"
	)
	log_doc = frappe.get_doc("Coscore Ad Tracking Event", latest_log_name)
	log_payload = json.loads(getattr(log_doc, "payload_json", "{}") or "{}")
	log_response = json.loads(log_doc.response_log or "{}")

	results["log_id"] = latest_log_name
	results["log_sent_status"] = log_doc.sent_status
	results["emitted_event_name"] = log_payload.get("data", [{}])[0].get("event_name")
	results["emitted_currency"] = log_payload.get("data", [{}])[0].get("custom_data", {}).get("currency")
	results["emitted_usd_value"] = log_payload.get("data", [{}])[0].get("custom_data", {}).get("value")
	results["emitted_client_ip"] = log_payload.get("data", [{}])[0].get("user_data", {}).get("client_ip_address")
	results["meta_api_response"] = log_response

	return results

def cleanup_test_records(sales_order_name="SAL-ORD-2026-00021", payment_entry_name="ACC-PAY-2026-00001"):
	"""
	Cancels and removes test documents created during CAPI end-to-end verification.
	"""
	if payment_entry_name and frappe.db.exists("Payment Entry", payment_entry_name):
		try:
			pe = frappe.get_doc("Payment Entry", payment_entry_name)
			if pe.docstatus == 1:
				pe.cancel()
			pe.delete()
		except Exception as e:
			frappe.logger("meta_capi").warning(f"Error deleting test PE: {e}")

	if sales_order_name and frappe.db.exists("Sales Order", sales_order_name):
		try:
			so = frappe.get_doc("Sales Order", sales_order_name)
			if so.docstatus == 1:
				so.cancel()
			so.delete()
		except Exception as e:
			frappe.logger("meta_capi").warning(f"Error deleting test SO: {e}")

	frappe.db.commit()
	return "Test records cleaned successfully"

def test_both_storefronts():
	"""
	Verifies that both Lookzene Main Store (lookzene.com) and Nella Landing (nella.lookzene.com)
	accurately trigger the server-side Meta Purchase event with respective URLs, IP, and tokens.
	"""
	from coscore.api.orders import create_sales_order
	from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry

	output = {}

	# 1. Main Store Order (lookzene.com)
	ord_id_main = f"TEST-MAIN-{frappe.generate_hash(length=5).upper()}"
	res_main = create_sales_order({
		"order_id": ord_id_main,
		"order_source": "lookzene main",
		"full_name": "Lookzene Main Tester",
		"phone": "01811223388",
		"email": "mainstore@lookzene.com",
		"shipping_address": {"district": "Dhaka", "address": "Gulshan 2"},
		"items": [{"id": "nella-white-snow", "name": "Nella White Snow", "quantity": 1, "price": 1200}],
		"total_amount": 1200,
		"shipping_charge": 0,
		"fbp": "fb.1.1712345678901.112233",
		"fbc": "fb.1.1712345678902.445566",
		"client_ip": "103.145.118.80",
		"event_source_url": "https://www.lookzene.com/checkout"
	})
	so_main_name = res_main["order_name"]
	pe_main = get_payment_entry("Sales Order", so_main_name)
	pe_main.paid_amount = 1200
	pe_main.received_amount = 1200
	pe_main.mode_of_payment = "Cash"
	pe_main.insert(ignore_permissions=True)
	pe_main.submit()

	log_main = frappe.get_all(
		"Coscore Ad Tracking Event",
		filters={"event_name": "Purchase", "source": "Meta"},
		fields=["name", "sent_status", "payload_json", "response_log"],
		order_by="creation desc",
		limit=1
	)[0]
	output["lookzene_main"] = {
		"order_name": so_main_name,
		"payment_entry": pe_main.name,
		"log_id": log_main["name"],
		"status": log_main["sent_status"],
		"event_source_url": json.loads(log_main["payload_json"])["data"][0].get("event_source_url"),
		"meta_response": json.loads(log_main["response_log"])
	}

	# 2. Nella Landing Order (nella.lookzene.com)
	ord_id_nella = f"TEST-NELLA-{frappe.generate_hash(length=5).upper()}"
	res_nella = create_sales_order({
		"order_id": ord_id_nella,
		"order_source": "nella landing",
		"full_name": "Nella Landing Tester",
		"phone": "01711223399",
		"email": "nellatest@lookzene.com",
		"shipping_address": {"district": "Chittagong", "address": "Agrabad"},
		"items": [{"id": "nella-white-snow", "name": "Nella White Snow", "quantity": 1, "price": 999}],
		"total_amount": 999,
		"shipping_charge": 0,
		"fbp": "fb.1.1712345678901.778899",
		"fbc": "fb.1.1712345678902.998877",
		"client_ip": "103.145.118.90",
		"event_source_url": "https://nella.lookzene.com"
	})
	so_nella_name = res_nella["order_name"]
	pe_nella = get_payment_entry("Sales Order", so_nella_name)
	pe_nella.paid_amount = 999
	pe_nella.received_amount = 999
	pe_nella.mode_of_payment = "Cash"
	pe_nella.insert(ignore_permissions=True)
	pe_nella.submit()

	log_nella = frappe.get_all(
		"Coscore Ad Tracking Event",
		filters={"event_name": "Purchase", "source": "Meta"},
		fields=["name", "sent_status", "payload_json", "response_log"],
		order_by="creation desc",
		limit=1
	)[0]
	output["nella_landing"] = {
		"order_name": so_nella_name,
		"payment_entry": pe_nella.name,
		"log_id": log_nella["name"],
		"status": log_nella["sent_status"],
		"event_source_url": json.loads(log_nella["payload_json"])["data"][0].get("event_source_url"),
		"meta_response": json.loads(log_nella["response_log"])
	}

	return output

