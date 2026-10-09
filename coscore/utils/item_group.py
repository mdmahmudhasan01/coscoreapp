import frappe

def sync_item_group_to_header_menu(doc=None, method=None):
	"""
	Syncs ERPNext Item Groups to Website Settings top_bar_items and Coscore Product Category.
	Triggered whenever an Item Group is created, updated, or deleted in ERPNext.
	"""
	try:
		# Exclude internal ERPNext default non-customer item groups
		internal_groups = {"All Item Groups", "Raw Material", "Sub Assemblies", "Consumable", "Services", "Products"}

		trashed_name = doc.name if (doc and method == "on_trash") else None

		if trashed_name:
			# Remove Coscore Product Category for trashed item group
			frappe.db.delete("Coscore Product Category", {"category_name": trashed_name})

		# Fetch all non-internal Item Groups from ERPNext
		filters = {"name": ["not in", list(internal_groups)]}
		if trashed_name:
			filters["name"] = ["not in", list(internal_groups | {trashed_name})]

		item_groups = frappe.db.get_all(
			"Item Group",
			filters=filters,
			fields=["name", "item_group_name", "parent_item_group", "is_group", "image"],
			order_by="creation asc"
		)

		for ig in item_groups:
			label = ig.item_group_name or ig.name
			slug = label.lower().replace(" ", "-")

			# Ensure corresponding Coscore Product Category exists
			cat_id = frappe.db.get_value("Coscore Product Category", {"item_group": ig.name}, "name")
			if not cat_id:
				cat_id = frappe.db.get_value("Coscore Product Category", {"category_name": label}, "name")
			if not cat_id:
				cat_id = frappe.db.get_value("Coscore Product Category", {"slug": slug}, "name")

			if not cat_id:
				try:
					cat = frappe.new_doc("Coscore Product Category")
					cat.category_name = label
					cat.slug = slug
					cat.item_group = ig.name
					cat.banner_image = ig.image or ""
					cat.is_active = 1
					cat.insert(ignore_permissions=True)
				except Exception as e:
					frappe.log_error(f"Error creating Coscore Product Category for {label}: {e}")
			else:
				updates = {"item_group": ig.name}
				if ig.image:
					updates["banner_image"] = ig.image
				frappe.db.set_value("Coscore Product Category", cat_id, updates)

		# Sync Website Settings top_bar_items
		ws = frappe.get_doc("Website Settings")
		
		# Keep non-item-group top bar items if any existed
		existing_items = ws.top_bar_items or []
		non_ig_items = [
			item for item in existing_items 
			if not item.url or not item.url.startswith("/shop/")
		]

		ws.top_bar_items = non_ig_items

		# Append Item Groups as Website Header Menu items
		for ig in item_groups:
			label = ig.item_group_name or ig.name
			slug = label.lower().replace(" ", "-")
			ws.append("top_bar_items", {
				"label": label,
				"url": f"/shop/{slug}",
				"open_in_new_tab": 0,
				"right": 0
			})

		ws.flags.ignore_permissions = True
		ws.save()

		# Only commit explicitly if called directly, not during doc events
		if not doc:
			frappe.db.commit()
	except Exception as e:
		frappe.log_error(f"Failed to sync Item Group to header menu: {e}")

def sync_item_to_coscore_product(doc=None, method=None):
	"""
	Automatically links ERPNext Items to Coscore Product doctype.
	Triggered on Item insert/update/trash.
	"""
	if not doc:
		return

	try:
		if method == "on_trash":
			frappe.db.delete("Coscore Product", {"item": doc.name})
			return

		title = doc.item_name or doc.item_code
		slug = title.lower().replace(" ", "-").replace("/", "-").replace("+", "plus")

		c_prod_name = frappe.db.get_value("Coscore Product", {"item": doc.name}, "name")
		if not c_prod_name:
			c_prod_name = frappe.db.get_value("Coscore Product", {"slug": slug}, "name")

		if c_prod_name:
			c_prod = frappe.get_doc("Coscore Product", c_prod_name)
		else:
			c_prod = frappe.new_doc("Coscore Product")
			c_prod.item = doc.name
			c_prod.slug = slug

		c_prod.title = title
		if hasattr(doc, "brand") and doc.brand:
			c_prod.brand = doc.brand
		elif not c_prod.brand:
			c_prod.brand = "Beauty Brand"

		if hasattr(doc, "item_group") and doc.item_group:
			cat_id = frappe.db.get_value("Coscore Product Category", {"item_group": doc.item_group}, "name")
			if not cat_id:
				cat_id = frappe.db.get_value("Coscore Product Category", {"category_name": doc.item_group}, "name")
			if cat_id:
				c_prod.category = cat_id
		elif not c_prod.category:
			c_prod.category = "skincare"

		rate = getattr(doc, "standard_rate", 0) or 0
		if rate > 0:
			c_prod.price = rate

		is_disabled = getattr(doc, "disabled", 0)
		c_prod.stock_status = "Out of Stock" if is_disabled else "In Stock"
		c_prod.is_active = 0 if is_disabled else 1

		if not c_prod.short_description:
			c_prod.short_description = doc.description or f"Authentic {title} sourced from authorized distributors."

		c_prod.flags.ignore_permissions = True
		c_prod.save()
	except Exception as e:
		frappe.log_error(f"Failed to sync ERPNext Item to Coscore Product: {e}")

def create_initial_item_groups():
	"""
	Creates and syncs full 3-level website header menu Item Groups in ERPNext.
	Top Category (is_group=1) -> Column Group (is_group=1) -> Subcategory (is_group=0)
	"""
	header_tree = {
		"Skincare": {
			"Cleanse": ["Cleansers", "Oil Cleansers", "Exfoliators", "Toners"],
			"Treat": ["Serums", "Essences", "Ampoules", "Face Masks"],
			"Moisturize": ["Moisturizers", "Eye Cream", "Face Oils", "Lip Care"]
		},
		"Sun Protection": {
			"Face": ["Face Sunscreen", "Tinted SPF", "Mineral SPF"],
			"Body": ["Body Sunscreen", "Sun Sprays", "After Sun"]
		},
		"Makeup": {
			"Face": ["Foundation", "Concealer", "Powder", "Blush"],
			"Eyes": ["Mascara", "Eyeliner", "Eyeshadow", "Brows"],
			"Lips": ["Lipstick", "Lip Tint", "Lip Gloss", "Lip Balm"]
		},
		"Hair Care": {
			"Wash": ["Shampoo", "Conditioner", "Scalp Care"],
			"Treat": ["Hair Masks", "Hair Oils", "Serums"]
		},
		"Body Care": {
			"Cleanse": ["Body Wash", "Body Scrubs", "Hand Wash"],
			"Moisturize": ["Body Lotion", "Body Butter", "Hand Cream"]
		},
		"K-Beauty": {
			"Curated": ["Snail Mucin", "Glass Skin", "Korean Sunscreen", "Sheet Masks"]
		}
	}

	parent_root = "All Item Groups"
	if not frappe.db.exists("Item Group", parent_root):
		p_doc = frappe.get_doc({
			"doctype": "Item Group",
			"item_group_name": parent_root,
			"is_group": 1
		})
		p_doc.insert(ignore_permissions=True)

	created = []
	for top_cat, columns in header_tree.items():
		# Top Level Category (e.g. Skincare)
		if not frappe.db.exists("Item Group", top_cat):
			top_doc = frappe.get_doc({
				"doctype": "Item Group",
				"item_group_name": top_cat,
				"parent_item_group": parent_root,
				"is_group": 1
			})
			top_doc.insert(ignore_permissions=True)
			created.append(top_cat)
		else:
			frappe.db.set_value("Item Group", top_cat, "is_group", 1)

		for col_name, subcats in columns.items():
			col_ig_name = col_name
			if frappe.db.exists("Item Group", col_name):
				existing_parent = frappe.db.get_value("Item Group", col_name, "parent_item_group")
				if existing_parent != top_cat:
					col_ig_name = f"{top_cat} {col_name}"

			if not frappe.db.exists("Item Group", col_ig_name):
				col_doc = frappe.get_doc({
					"doctype": "Item Group",
					"item_group_name": col_ig_name,
					"parent_item_group": top_cat,
					"is_group": 1
				})
				col_doc.insert(ignore_permissions=True)
				created.append(f"Column: {col_ig_name}")
			else:
				frappe.db.set_value("Item Group", col_ig_name, "is_group", 1)

			for sub_name in subcats:
				if not frappe.db.exists("Item Group", sub_name):
					sub_doc = frappe.get_doc({
						"doctype": "Item Group",
						"item_group_name": sub_name,
						"parent_item_group": col_ig_name,
						"is_group": 0
					})
					sub_doc.insert(ignore_permissions=True)
					created.append(f"Sub: {sub_name}")

	frappe.db.commit()
	sync_item_group_to_header_menu()
	return created
