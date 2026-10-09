import frappe
import json
from coscore.utils.meta_capi import send_meta_capi_event

@frappe.whitelist(allow_guest=True)
def track_event(*args, **kwargs):
	"""
	Whitelisted API endpoint for frontend apps (Next.js, Nella, mobile, etc.)
	to dispatch Meta Conversions API events directly through ERPNext.
	Automatically extracts visitor Cloudflare IP & User-Agent.
	"""
	payload = None
	if frappe.request:
		try:
			payload = frappe.request.get_json()
		except Exception:
			pass

	if not payload:
		if args:
			payload = args[0]
		elif frappe.local.form_dict:
			payload = frappe.local.form_dict

	if isinstance(payload, str):
		try:
			payload = json.loads(payload)
		except Exception:
			payload = {}

	if not isinstance(payload, dict):
		payload = kwargs or {}

	event_name = payload.get("event_name")
	if not event_name:
		frappe.throw("Parameter 'event_name' is required")

	event_id = payload.get("event_id")
	user_data = payload.get("user_data") or {}
	custom_data = payload.get("custom_data") or {}
	app_source = payload.get("app_source") or "coscore"
	event_source_url = payload.get("event_source_url") or (frappe.request.headers.get("Referer") if frappe.request else None)
	action_source = payload.get("action_source") or "website"

	result = send_meta_capi_event(
		event_name=event_name,
		event_id=event_id,
		user_data=user_data,
		custom_data=custom_data,
		app_source=app_source,
		event_source_url=event_source_url,
		action_source=action_source
	)

	return result
