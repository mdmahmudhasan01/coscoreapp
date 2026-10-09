import frappe
import json
import os

_GEO_DATA = None

def _load_geo_data():
	global _GEO_DATA
	if _GEO_DATA is None:
		possible_paths = [
			'/home/frappe/projects/lookzene/apps/coscore/coscore/public/bd_geo_data.json',
			'/home/frappe/projects/lookzene/apps/coscore/public/bd_geo_data.json',
			'/tmp/node_modules/bd-geo-address/db/mongodb/bangladesh-address.json'
		]
		for p in possible_paths:
			if os.path.exists(p):
				try:
					with open(p, 'r', encoding='utf-8') as f:
						_GEO_DATA = json.load(f)
						break
				except Exception:
					pass
		if _GEO_DATA is None:
			_GEO_DATA = {}
	return _GEO_DATA

@frappe.whitelist(allow_guest=True)
def get_districts():
	districts = frappe.db.get_all(
		"Coscore District",
		filters={"is_active": 1},
		fields=["name", "district_name", "name_en", "name_bn"],
		order_by="district_name asc",
		ignore_permissions=True
	)
	if not districts:
		geo_data = _load_geo_data()
		dist_list = geo_data.get('districts', [])
		districts = [{"name": d, "district_name": d, "name_en": d, "name_bn": ""} for d in dist_list]

	return {"status": "success", "data": districts}

@frappe.whitelist(allow_guest=True)
def get_thanas(district):
	if not district:
		return {"status": "error", "message": "District is required", "data": []}
		
	thanas = frappe.db.get_all(
		"Coscore Thana",
		filters={"district": district, "is_active": 1},
		fields=["name", "thana_name", "delivery_charge_inside", "delivery_charge_outside", "delivery_charge_sub"],
		order_by="thana_name asc",
		ignore_permissions=True
	)
	if not thanas:
		# Fallback to searching by district_name if district argument was passed as district_name string
		dist_name = district
		if frappe.db.exists("Coscore District", district):
			dist_name = frappe.db.get_value("Coscore District", district, "district_name") or district

		thanas = frappe.db.get_all(
			"Coscore Thana",
			filters={"district": dist_name, "is_active": 1},
			fields=["name", "thana_name", "delivery_charge_inside", "delivery_charge_outside", "delivery_charge_sub"],
			order_by="thana_name asc",
			ignore_permissions=True
		)

	if not thanas:
		geo_data = _load_geo_data()
		thanas_map = geo_data.get('thanas_by_district', {})
		th_list = thanas_map.get(district, [])
		charge_inside = 60.0 if district.strip().lower() == 'dhaka' else 120.0
		charge_outside = 120.0
		thanas = [{
			"name": t,
			"thana_name": t,
			"delivery_charge_inside": charge_inside,
			"delivery_charge_outside": charge_outside,
			"delivery_charge_sub": charge_inside
		} for t in th_list]

	return {"status": "success", "data": thanas}

@frappe.whitelist(allow_guest=True)
def get_postal_codes(thana=None, district=None):
	geo_data = _load_geo_data()
	pc_map = geo_data.get('postal_codes_by_thana', {})
	
	clean_thana = thana.split(' (')[0].strip().lower() if thana else ""
	
	dist_name = district
	if district and frappe.db.exists("Coscore District", district):
		dist_name = frappe.db.get_value("Coscore District", district, "district_name") or district
		
	clean_district = dist_name.strip().lower() if dist_name else ""

	key = f"{clean_thana}|{clean_district}"
	results = pc_map.get(key, [])

	if not results and clean_thana:
		# Partial key match by thana
		for k, v in pc_map.items():
			if k.startswith(clean_thana + '|'):
				results.extend(v)
				
	# Deduplicate results
	seen = set()
	dedup_results = []
	for item in results:
		c = item.get('postal_code')
		p = item.get('post_office')
		if c and (c, p) not in seen:
			seen.add((c, p))
			dedup_results.append({"postal_code": c, "post_office": p})

	dedup_results.sort(key=lambda x: (x["postal_code"], x["post_office"]))
	return {"status": "success", "data": dedup_results}

@frappe.whitelist(allow_guest=True)
def calculate_shipping_charge(thana=None, district=None, weight=1.0, is_cod=False, order_amount=0.0):
	try:
		amt = float(order_amount)
		if amt >= 2000.0:
			return {
				"status": "success",
				"charge": 0.0,
				"cod_charge": 0.0,
				"base_charge": 0.0,
				"additional_charge": 0.0,
				"rule": "Free Shipping (Order >= 2000 BDT)"
			}
	except (ValueError, TypeError):
		pass

	if not thana and not district:
		return {"status": "error", "message": "Thana or District is required", "charge": 120.0}

	is_cod_bool = str(is_cod).lower() in ("true", "1", "yes")

	original_user = frappe.session.user
	try:
		frappe.set_user("Administrator")
		try:
			weight = float(weight)
		except (ValueError, TypeError):
			weight = 1.0

		rule_name = None
		district_name = district

		# 1. Search for a specific rule by Thana name if provided
		if thana:
			rule_name = frappe.db.exists("Coscore Shipping Rule", {"thana": thana, "is_active": 1})
			if not district_name and frappe.db.exists("Coscore Thana", thana):
				thana_doc = frappe.get_doc("Coscore Thana", thana)
				district_name = frappe.db.get_value("Coscore District", thana_doc.district, "district_name") or thana_doc.district

		# 2. If no specific rule for Thana, search by Zone Type from District
		if not rule_name and district_name:
			if district_name.strip().lower() == "dhaka":
				zone_type = "Dhaka Metro"
			else:
				zone_type = "Outside Dhaka"
				
			rule_name = frappe.db.exists("Coscore Shipping Rule", {"zone_type": zone_type, "is_active": 1})

		if not rule_name:
			# Fallback to default charges on Thana doc or District location
			charge = 60.0 if (district_name and district_name.strip().lower() == "dhaka") else 120.0
			if thana and frappe.db.exists("Coscore Thana", thana):
				thana_doc = frappe.get_doc("Coscore Thana", thana)
				if district_name and district_name.strip().lower() == "dhaka":
					charge = float(thana_doc.delivery_charge_inside or 60.0)
				else:
					charge = float(thana_doc.delivery_charge_outside or 120.0)
				
			return {
				"status": "success",
				"charge": charge,
				"cod_charge": 0.0,
				"base_charge": charge,
				"additional_charge": 0.0,
				"rule": None
			}

		rule = frappe.get_doc("Coscore Shipping Rule", rule_name)
		charge = float(rule.base_charge or 0.0)
		base_charge = charge
		
		# Calculate weight-based slabs
		additional_charge = 0.0
		slabs = frappe.db.get_all(
			"Coscore Shipping Slab",
			filters={"parent": rule.name, "parenttype": "Coscore Shipping Rule"},
			fields=["up_to_weight", "additional_charge"],
			order_by="up_to_weight asc",
			ignore_permissions=True
		)
		
		for slab in slabs:
			if weight <= float(slab.up_to_weight):
				additional_charge = float(slab.additional_charge)
				break
		else:
			# If weight exceeds all slabs, apply the highest slab's charge
			if slabs:
				additional_charge = float(slabs[-1].additional_charge)

		charge += additional_charge

		# Apply COD charge if selected
		cod_charge = 0.0
		if is_cod_bool:
			cod_charge = float(rule.cod_extra_charge or 0.0)
			charge += cod_charge

		return {
			"status": "success",
			"charge": charge,
			"cod_charge": cod_charge,
			"base_charge": base_charge,
			"additional_charge": additional_charge,
			"rule": rule.name
		}
	finally:
		frappe.set_user(original_user)


