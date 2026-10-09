import frappe
import json
from frappe.utils.file_manager import save_file

@frappe.whitelist(allow_guest=True)
def get_stock_levels():
	"""
	Returns all active products with their current stock levels and standard selling prices.
	"""
	# Get all items
	items = frappe.db.get_all(
		"Item",
		filters={"disabled": 0, "is_stock_item": 1},
		fields=["name", "item_name", "image"]
	)

	stock_levels = []
	for item in items:
		item_code = item.name
		# Get price from Item Price (Standard Selling)
		price = frappe.db.get_value(
			"Item Price",
			{"item_code": item_code, "price_list": "Standard Selling"},
			"price_list_rate"
		) or 0.0

		# If standard price is 0, let's fallback to standard BDT price or standard rate
		if not price:
			price = frappe.db.get_value("Item Price", {"item_code": item_code}, "price_list_rate") or 99.0

		# Get stock quantity from Bin
		actual_qty = 0.0
		projected_qty = 0.0
		bin_data = frappe.db.get_values("Bin", {"item_code": item_code}, ["actual_qty", "projected_qty"])
		if bin_data:
			actual_qty = sum([float(b[0] or 0.0) for b in bin_data])
			projected_qty = sum([float(b[1] or 0.0) for b in bin_data])

		stock_levels.append({
			"item_code": item_code,
			"item_name": item.item_name or item_code,
			"price_bdt": float(price),
			"actual_qty": float(actual_qty),
			"available_qty": float(projected_qty if projected_qty > 0 else actual_qty),
			"in_stock": actual_qty > 0
		})

	return {"data": stock_levels}

@frappe.whitelist(allow_guest=True)
def upload_product_from_frontend():
	"""
	Creates a new Item in ERPNext and sets up its price and image.
	"""
	form_dict = frappe.local.form_dict
	
	item_code = form_dict.get("item_code")
	item_name = form_dict.get("item_name")
	item_group = form_dict.get("item_group") or frappe.db.get_value("Item Group", {}, "name") or "All Item Groups"
	price = flt(form_dict.get("price"))
	description = form_dict.get("description", "")
	
	if not item_code or not item_name:
		frappe.local.response["status"] = "error"
		return {"status": "error", "message": "item_code and item_name are required fields"}

	if frappe.db.exists("Item", item_code):
		frappe.local.response["status"] = "error"
		return {"status": "error", "message": f"Item Code {item_code} already exists"}

	# Create Item
	item = frappe.new_doc("Item")
	item.item_code = item_code
	item.item_name = item_name
	item.item_group = item_group
	item.stock_uom = frappe.db.get_value("UOM", {"uom_name": "Nos"}, "name") or frappe.db.get_value("UOM", {}, "name") or "Nos"
	item.description = description
	item.is_stock_item = 1
	item.opening_stock = 100 # give it a default stock level for demo

	# Handle file upload if image is attached
	if "image" in frappe.request.files:
		file = frappe.request.files["image"]
		# Save file using Frappe file manager
		saved_file = save_file(
			fname=file.filename,
			content=file.read(),
			dt="Item",
			dn=item_code,
			is_private=0
		)
		item.image = saved_file.file_url

	item.insert(ignore_permissions=True)

	# Set standard price
	if price > 0:
		price_list = "Standard Selling"
		# Ensure price list exists
		if not frappe.db.exists("Price List", price_list):
			pl = frappe.new_doc("Price List")
			pl.price_list_name = price_list
			pl.enabled = 1
			pl.selling = 1
			pl.insert(ignore_permissions=True)

		item_price = frappe.new_doc("Item Price")
		item_price.item_code = item_code
		item_price.price_list = price_list
		item_price.price_list_rate = price
		item_price.insert(ignore_permissions=True)

	# Update default bin stock
	try:
		warehouse = frappe.db.get_value("Warehouse", {"company": frappe.db.get_value("Company", {}, "name")}, "name")
		if warehouse:
			bin_doc = frappe.new_doc("Bin")
			bin_doc.item_code = item_code
			bin_doc.warehouse = warehouse
			bin_doc.actual_qty = 100
			bin_doc.insert(ignore_permissions=True)
	except Exception:
		pass

	return {"status": "success", "message": f"Product {item_name} successfully uploaded", "item_code": item_code}

def flt(val):
	try:
		return float(val)
	except (ValueError, TypeError):
		return 0.0

@frappe.whitelist(allow_guest=True)
def seed_stock_temp():
	warehouse = "Stores - LZ"
	items = frappe.db.get_all("Item", filters={"disabled": 0})
	messages = []
	for item in items:
		bin_name = frappe.db.exists("Bin", {"item_code": item.name, "warehouse": warehouse})
		if not bin_name:
			bin_doc = frappe.new_doc("Bin")
			bin_doc.item_code = item.name
			bin_doc.warehouse = warehouse
			bin_doc.actual_qty = 100.0
			bin_doc.projected_qty = 100.0
			bin_doc.insert(ignore_permissions=True)
			messages.append(f"Created bin for {item.name}")
		else:
			frappe.db.set_value("Bin", bin_name, "actual_qty", 100.0)
			frappe.db.set_value("Bin", bin_name, "projected_qty", 100.0)
			messages.append(f"Updated bin for {item.name}")
	frappe.db.commit()
	return {"status": "success", "messages": messages}
