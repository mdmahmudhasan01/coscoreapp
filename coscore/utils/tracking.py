import hashlib
import requests
import json
import frappe
from frappe.utils import now_datetime

def sha256_hash(value):
	"""
	Hashes value using SHA-256 for Meta privacy compliance.
	"""
	if not value:
		return ""
	cleaned = str(value).strip().lower()
	return hashlib.sha256(cleaned.encode('utf-8')).hexdigest()

def fire_tracking_event(event_name, user_data=None, custom_data=None, event_id=None, app_source="coscore"):
	"""
	Fires a server-side event to Meta Conversions API (CAPI), GA4, and Cloudflare.
	"""
	from coscore.utils.meta_capi import send_meta_capi_event
	# 1. Fire Meta Conversions API (CAPI) with full tracing
	meta_res = send_meta_capi_event(
		event_name=event_name,
		event_id=event_id,
		user_data=user_data,
		custom_data=custom_data,
		app_source=app_source,
		event_source_url=(user_data or {}).get("event_source_url")
	)

	# Load SEO Setting for global GA4 credentials
	ga_measurement_id = None
	ga_api_secret = frappe.conf.get("ga_api_secret")
	seo_setting_name = frappe.db.exists("Coscore SEO Setting", "Coscore SEO Setting")
	if seo_setting_name:
		seo = frappe.get_doc("Coscore SEO Setting", seo_setting_name)
		ga_measurement_id = getattr(seo, "google_analytics_id", None) or getattr(seo, "ga4_id", None)
	if not ga_measurement_id:
		ga_measurement_id = frappe.conf.get("google_measurement_id")

	# 2. Fire GA4 Measurement Protocol
	if ga_measurement_id and ga_api_secret:
		ga_url = f"https://www.google-analytics.com/mp/collect?api_secret={ga_api_secret}&measurement_id={ga_measurement_id}"
		ga_payload = {
			"client_id": user_data.get("client_id") or sha256_hash(user_data.get("email") or user_data.get("phone") or "anonymous"),
			"events": [
				{
					"name": event_name.lower(),
					"params": {
						"currency": "BDT",
						"value": custom_data.get("value"),
						"transaction_id": event_id,
						**custom_data
					}
				}
			]
		}
		
		log_name = create_ad_tracking_log(event_name, "GA4", ga_payload)
		
		try:
			res = requests.post(
				ga_url,
				headers={"Content-Type": "application/json"},
				json=ga_payload,
				timeout=10
			)
			update_ad_tracking_log(log_name, "Success" if res.status_code == 204 or res.status_code == 200 else "Failed", res.text or {})
		except Exception as e:
			update_ad_tracking_log(log_name, "Failed", {"error": str(e)})

	# 3. Fire Cloudflare Server-Side Tracking (Cloudflare Zaraz / Edge Relay)
	cf_endpoint = frappe.conf.get("cloudflare_tracking_endpoint") or "https://nella.lookzene.com/cdn-cgi/zaraz/s"
	cf_payload = {
		"event": event_name,
		"event_id": event_id,
		"timestamp": int(frappe.utils.now_datetime().timestamp()),
		"user_data": {
			"em": sha256_hash(user_data.get("email")) if user_data.get("email") else "",
			"ph": sha256_hash(user_data.get("phone")) if user_data.get("phone") else "",
			"client_ip_address": frappe.local.request_ip if hasattr(frappe.local, "request_ip") else "127.0.0.1",
		},
		"custom_data": custom_data,
		"action_source": "server"
	}
	log_name_cf = create_ad_tracking_log(event_name, "Cloudflare", cf_payload)
	try:
		cf_headers = {"Content-Type": "application/json"}
		cf_token = frappe.conf.get("cloudflare_api_token")
		if cf_token:
			cf_headers["Authorization"] = f"Bearer {cf_token}"
		res = requests.post(cf_endpoint, headers=cf_headers, json=cf_payload, timeout=5)
		update_ad_tracking_log(log_name_cf, "Success" if res.status_code in (200, 201, 204) else "Failed", res.text or {})
	except Exception as e:
		update_ad_tracking_log(log_name_cf, "Failed", {"error": str(e)})

def on_payment_entry_submit_purchase_tracking(doc, method=None):
	"""
	Triggered strictly when a Payment Entry is submitted (on_submit, docstatus == 1, payment_type == 'Receive').
	Fires server-side Purchase event to Meta CAPI, Cloudflare, and GA4 for the referenced Sales Order.
	STRICT RULE: If Payment Entry is not successfully submitted, NO Purchase event is ever fired.
	"""
	if doc.docstatus != 1 or doc.payment_type != "Receive":
		return

	from coscore.utils.meta_capi import convert_bdt_to_usd, get_client_ip, get_client_user_agent

	referenced_orders = set()
	referenced_invoices = set()

	# 1. Search in references table
	for ref in getattr(doc, "references", []):
		if ref.reference_doctype == "Sales Order" and ref.reference_name:
			referenced_orders.add(ref.reference_name)
		elif ref.reference_doctype == "Sales Invoice" and ref.reference_name:
			referenced_invoices.add(ref.reference_name)
			# Find linked Sales Order from Sales Invoice Items
			so_list = frappe.db.get_all(
				"Sales Invoice Item",
				filters={"parent": ref.reference_name},
				fields=["sales_order"],
				distinct=True
			)
			for so_item in so_list:
				if so_item.sales_order:
					referenced_orders.add(so_item.sales_order)

	# 2. Check reference_no (e.g. Sales Order name in reference_no)
	if getattr(doc, "reference_no", None) and frappe.db.exists("Sales Order", doc.reference_no):
		referenced_orders.add(doc.reference_no)

	# 3. Check custom sales_order link if defined
	if getattr(doc, "sales_order", None) and frappe.db.exists("Sales Order", doc.sales_order):
		referenced_orders.add(doc.sales_order)

	# Case A: Fire Purchase event for each referenced Sales Order
	if referenced_orders:
		for so_name in referenced_orders:
			try:
				so = frappe.get_doc("Sales Order", so_name)
				
				# Retrieve saved customer client IP & UA from Sales Order (captured during checkout)
				cust_ip = getattr(so, "custom_client_ip", None) or get_client_ip()
				cust_ua = getattr(so, "custom_client_user_agent", None) or get_client_user_agent()
				fbp = getattr(so, "custom_fbp", None)
				fbc = getattr(so, "custom_fbc", None)

				# Customer contact details
				cust_phone = (
					getattr(so, "contact_mobile", None)
					or getattr(so, "contact_phone", None)
					or frappe.db.get_value("Customer", so.customer, "mobile_no")
					or frappe.db.get_value("Customer", so.customer, "phone")
				)
				cust_email = (
					getattr(so, "contact_email", None)
					or frappe.db.get_value("Customer", so.customer, "email_id")
				)

				# Customer name split
				full_name = (so.customer_name or so.customer or "").strip()
				first_name = full_name.split(" ")[0] if full_name else ""
				last_name = " ".join(full_name.split(" ")[1:]) if " " in full_name else ""

				# Address details (City, State, Postal Code)
				city = getattr(so, "custom_shipping_district", None)
				state = None
				zip_code = None
				if getattr(so, "customer_address", None):
					addr = frappe.db.get_value("Address", so.customer_address, ["city", "state", "pincode"], as_dict=True)
					if addr:
						if not city:
							city = addr.get("city")
						state = addr.get("state")
						zip_code = addr.get("pincode")

				user_data = {
					"email": cust_email,
					"phone": cust_phone,
					"first_name": first_name,
					"last_name": last_name,
					"city": city,
					"state": state,
					"zip": zip_code,
					"country": "bd",
					"external_id": so.customer,
					"client_ip_address": cust_ip,
					"client_user_agent": cust_ua,
					"fbp": fbp,
					"fbc": fbc,
					"referrer_url": getattr(so, "custom_referrer_url", None),
					"event_source_url": getattr(so, "custom_event_source_url", None)
				}

				# Currency Conversion (BDT -> USD for Meta Ads Manager)
				amount_bdt = float(doc.paid_amount or doc.received_amount or so.grand_total)
				usd_amount, exchange_rate = convert_bdt_to_usd(amount_bdt, doc.posting_date)
				usd_value_str = f"{usd_amount:.2f}"

				# Items list converted to USD
				contents = []
				for item in so.items:
					usd_item_price = round(float(item.rate) / exchange_rate, 2) if exchange_rate else float(item.rate)
					contents.append({
						"id": item.item_code,
						"name": item.item_name,
						"quantity": int(item.qty),
						"item_price": usd_item_price
					})

				# Custom Data for Meta Conversions API
				custom_data = {
					"value": usd_value_str,
					"currency": "USD",
					"contents": contents,
					"content_type": "product",
					"order_id": so.name,
					"order_source": getattr(so, "order_source", "lookzene main"),
					"payment_entry": doc.name,
					"original_currency": "BDT",
					"original_value": round(amount_bdt, 2),
					"exchange_rate": exchange_rate
				}

				# Unique Event ID for deduplication
				event_id = getattr(so, "custom_meta_event_id", None) or f"PURCHASE-{so.name}-{doc.name}"

				# Determine app source (coscore vs nella)
				order_src = (getattr(so, "order_source", "") or "").lower()
				app_source = "nella" if "nella" in order_src else "coscore"

				fire_tracking_event("Purchase", user_data, custom_data, event_id, app_source=app_source)
				
				frappe.logger("tracking").info(f"Fired server-side Purchase event for SO {so.name} via Payment Entry {doc.name} (Amount: {amount_bdt} BDT = ${usd_value_str} USD)")
			except Exception as e:
				frappe.log_error(f"Error firing server-side Purchase tracking on Payment Entry {doc.name} for SO {so_name}: {str(e)}", "Payment Tracking Error")

	# Case B: Standalone Sales Invoice without Sales Order link
	elif referenced_invoices:
		for sinv_name in referenced_invoices:
			try:
				sinv = frappe.get_doc("Sales Invoice", sinv_name)
				
				cust_phone = frappe.db.get_value("Customer", sinv.customer, "mobile_no") or frappe.db.get_value("Customer", sinv.customer, "phone")
				cust_email = frappe.db.get_value("Customer", sinv.customer, "email_id")
				full_name = (sinv.customer_name or sinv.customer or "").strip()
				first_name = full_name.split(" ")[0] if full_name else ""
				last_name = " ".join(full_name.split(" ")[1:]) if " " in full_name else ""

				user_data = {
					"email": cust_email,
					"phone": cust_phone,
					"first_name": first_name,
					"last_name": last_name,
					"country": "bd",
					"client_ip_address": get_client_ip(),
					"client_user_agent": get_client_user_agent()
				}

				amount_bdt = float(doc.paid_amount or doc.received_amount or sinv.grand_total)
				usd_amount, exchange_rate = convert_bdt_to_usd(amount_bdt, doc.posting_date)
				usd_value_str = f"{usd_amount:.2f}"

				contents = []
				for item in sinv.items:
					usd_item_price = round(float(item.rate) / exchange_rate, 2) if exchange_rate else float(item.rate)
					contents.append({
						"id": item.item_code,
						"name": item.item_name,
						"quantity": int(item.qty),
						"item_price": usd_item_price
					})

				custom_data = {
					"value": usd_value_str,
					"currency": "USD",
					"contents": contents,
					"content_type": "product",
					"order_id": sinv.name,
					"payment_entry": doc.name,
					"original_currency": "BDT",
					"original_value": round(amount_bdt, 2),
					"exchange_rate": exchange_rate
				}

				event_id = f"PURCHASE-INV-{sinv.name}-{doc.name}"
				fire_tracking_event("Purchase", user_data, custom_data, event_id, app_source="coscore")
				frappe.logger("tracking").info(f"Fired server-side Purchase event for Invoice {sinv.name} via Payment Entry {doc.name}")
			except Exception as e:
				frappe.log_error(f"Error firing server-side Purchase tracking on Payment Entry {doc.name} for Invoice {sinv_name}: {str(e)}", "Payment Tracking Error")

def create_ad_tracking_log(event_name, source, payload):
	if not frappe.db.exists("DocType", "Coscore Ad Tracking Event"):
		return None
	try:
		log = frappe.new_doc("Coscore Ad Tracking Event")
		log.event_name = event_name
		log.source = source
		log.payload_json = json.dumps(payload, indent=2)
		log.sent_status = "Pending"
		log.created_at = now_datetime()
		log.insert(ignore_permissions=True)
		frappe.db.commit()
		return log.name
	except Exception:
		return None

def update_ad_tracking_log(log_name, status, response):
	if not log_name or not frappe.db.exists("DocType", "Coscore Ad Tracking Event"):
		return
	try:
		log = frappe.get_doc("Coscore Ad Tracking Event", log_name)
		log.sent_status = status
		log.response_log = json.dumps(response, indent=2) if isinstance(response, dict) else str(response)
		log.save(ignore_permissions=True)
		frappe.db.commit()
	except Exception:
		pass
