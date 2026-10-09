import json
import re

import frappe

# Storefront runs on lookzene.com; File uploads live on the ERP host.
# Relative /files/... URLs break on the storefront nginx, so absolutize to the ERP origin.
MEDIA_ORIGIN = "https://cp.lookzene.com"
_MEDIA_PATH_RE = re.compile(r"/(?:private/)?files/[^\s\"'<>\\]+")


def absolutize_media_url(url: str | None) -> str | None:
	"""Turn /files/... (and /private/files/...) into an absolute ERP URL."""
	if not url:
		return url
	url = str(url).strip().rstrip("\\")
	if not url or url.startswith(("http://", "https://", "data:", "//")):
		return url
	if url.startswith("/files/") or url.startswith("/private/files/"):
		return f"{MEDIA_ORIGIN}{url}"
	return url


def absolutize_media_in_text(text: str | None) -> str | None:
	"""Rewrite embedded /files/... paths inside HTML/JSON blobs."""
	if not text:
		return text

	def _repl(match: re.Match) -> str:
		return absolutize_media_url(match.group(0)) or match.group(0)

	return _MEDIA_PATH_RE.sub(_repl, str(text))


def _normalize_label(value: str | None) -> str:
	return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def _item_group_descendants(ig_name: str) -> list[str]:
	"""Guest-safe nested-set descendants (no DocType permission checks)."""
	bounds = frappe.db.get_value("Item Group", ig_name, ["lft", "rgt"], as_dict=True)
	if not bounds or bounds.lft is None or bounds.rgt is None:
		return []
	return frappe.db.sql_list(
		"select name from `tabItem Group` where lft > %s and rgt < %s order by lft asc",
		(bounds.lft, bounds.rgt),
	)


def _category_ids_for_slug(category_slug: str) -> list[str]:
	"""Resolve a storefront category slug to Coscore Product Category names.

	Matches by Coscore category, Item Group descendants, linked Item.item_group,
	and plural/singular label variants (e.g. Toner vs Toners).

	Uses raw DB access so Guest API calls do not require Item Group permissions.
	"""
	cat = frappe.db.get_value(
		"Coscore Product Category",
		{"slug": category_slug},
		["name", "category_name"],
		as_dict=True,
	)
	if not cat:
		return []

	cat_ids = {cat.name}
	all_ig_names = [cat.category_name] if cat.category_name else []

	ig_name = frappe.db.get_value("Item Group", {"item_group_name": cat.category_name}, "name")
	if not ig_name:
		ig_name = frappe.db.get_value("Item Group", {"name": cat.category_name}, "name")
	if not ig_name and cat.category_name:
		# Try common plural/singular variants
		for candidate in (f"{cat.category_name}s", cat.category_name.rstrip("s")):
			ig_name = frappe.db.get_value("Item Group", {"item_group_name": candidate}, "name") or frappe.db.get_value(
				"Item Group", {"name": candidate}, "name"
			)
			if ig_name:
				break

	if ig_name:
		descendants = _item_group_descendants(ig_name)
		all_ig = [ig_name, *descendants]
		for d in all_ig:
			ig_doc = frappe.db.get_value("Item Group", d, ["name", "item_group_name"], as_dict=True)
			if ig_doc:
				all_ig_names.append(ig_doc.item_group_name or ig_doc.name)

		# Include Coscore products whose ERP Item sits in these item groups
		if all_ig:
			item_codes = frappe.db.sql_list(
				"select name from `tabItem` where item_group in ({})".format(", ".join(["%s"] * len(all_ig))),
				tuple(all_ig),
			)
			if item_codes:
				via_item = frappe.db.sql_list(
					"""
					select distinct category from `tabCoscore Product`
					where is_active = 1 and item in ({})
					""".format(", ".join(["%s"] * len(item_codes))),
					tuple(item_codes),
				)
				cat_ids.update([c for c in via_item if c])

	# Map Item Group labels -> Coscore categories with normalized equality
	# so "Toners" matches Coscore category "Toner".
	wanted = {_normalize_label(n) for n in all_ig_names if n}
	wanted.add(_normalize_label(cat.category_name))
	wanted.add(_normalize_label(category_slug))

	for row in frappe.db.get_all("Coscore Product Category", fields=["name", "category_name", "slug"]):
		labels = {
			_normalize_label(row.name),
			_normalize_label(row.category_name),
			_normalize_label(row.slug),
		}
		# Also accept singular/plural by stripping trailing s
		expanded = set(labels)
		for label in list(labels):
			if label.endswith("s") and len(label) > 3:
				expanded.add(label[:-1])
			else:
				expanded.add(f"{label}s")
		if wanted & expanded:
			cat_ids.add(row.name)

	return list(cat_ids)


@frappe.whitelist(allow_guest=True)
def get_homepage_data():
	"""
	Returns active banners and sections configured for the homepage.
	"""
	banners = frappe.db.get_all(
		"Coscore Homepage Banner",
		filters={"is_active": 1},
		fields=["title", "subtitle", "image", "cta_link", "sort_order"],
		order_by="sort_order asc"
	)
	for b in banners:
		b["image"] = absolutize_media_url(b.get("image"))

	sections = frappe.db.get_all(
		"Coscore Homepage Section",
		filters={"is_active": 1},
		fields=["name", "section_name", "section_type", "sort_order", "custom_html"],
		order_by="sort_order asc"
	)

	# Hydrate sections with products if applicable
	for sec in sections:
		if sec.get("custom_html"):
			sec["custom_html"] = absolutize_media_in_text(sec.get("custom_html"))
		if sec.section_type == "Featured Products":
			# Get featured active products
			sec["products"] = get_featured_products()
		elif sec.section_type == "Category Grid":
			top_categories = ["Skincare", "Sun Protection", "Makeup", "Hair Care", "Body Care", "K-Beauty"]
			raw_cats = frappe.db.get_all(
				"Coscore Product Category",
				filters={"category_name": ["in", top_categories]},
				fields=["name", "category_name", "slug", "banner_image"]
			)
			for c in raw_cats:
				c["banner_image"] = absolutize_media_url(c.get("banner_image"))
			top_map = {c["category_name"]: c for c in raw_cats}
			sec["categories"] = [top_map[name] for name in top_categories if name in top_map]

	return {
		"status": "success",
		"banners": banners,
		"sections": sections
	}

@frappe.whitelist(allow_guest=True)
def get_categories():
	# Sync ERPNext Item Groups to Website Header Menu & Categories
	from coscore.utils.item_group import sync_item_group_to_header_menu
	sync_item_group_to_header_menu()

	top_categories = ["Skincare", "Sun Protection", "Makeup", "Hair Care", "Body Care", "K-Beauty"]
	categories = frappe.db.get_all(
		"Coscore Product Category",
		filters={"is_active": 1, "category_name": ["in", top_categories]},
		fields=["name", "category_name", "slug", "banner_image", "parent_category"]
	)
	for c in categories:
		c["banner_image"] = absolutize_media_url(c.get("banner_image"))
	return {"status": "success", "data": categories}

@frappe.whitelist(allow_guest=True)
def get_header_menu():
	from coscore.utils.item_group import sync_item_group_to_header_menu
	sync_item_group_to_header_menu()

	top_categories = ["Skincare", "Sun Protection", "Makeup", "Hair Care", "Body Care", "K-Beauty"]
	menu_data = []

	for top in top_categories:
		if not frappe.db.exists("Item Group", top):
			continue

		slug = top.lower().replace(" ", "-")
		
		# Fetch columns under this top category
		cols = frappe.db.get_all(
			"Item Group",
			filters={"parent_item_group": top, "is_group": 1},
			fields=["name", "item_group_name"],
			order_by="creation asc"
		)

		columns_list = []
		for col in cols:
			raw_label = col.item_group_name or col.name
			col_label = raw_label
			if col_label.startswith(top):
				col_label = col_label[len(top):].strip()
			if not col_label:
				col_label = raw_label
			# Fetch subcategories under this column
			subs = frappe.db.get_all(
				"Item Group",
				filters={"parent_item_group": col.name},
				fields=["name", "item_group_name"],
				order_by="creation asc"
			)
			sub_items = []
			for s in subs:
				s_label = s.item_group_name or s.name
				s_slug = s_label.lower().replace(" ", "-")
				sub_items.append({
					"label": s_label,
					"slug": s_slug,
					"url": f"/shop/{s_slug}"
				})
			
			columns_list.append({
				"title": col_label,
				"items": sub_items
			})

		menu_data.append({
			"label": top,
			"slug": slug,
			"url": f"/shop/{slug}",
			"columns": columns_list
		})

	return {"status": "success", "data": menu_data}

@frappe.whitelist(allow_guest=True)
def get_product_detail(slug):
	if not slug:
		frappe.throw("Product slug is required")

	product = frappe.db.get_value(
		"Coscore Product",
		{"slug": slug, "is_active": 1},
		[
			"name", "title", "slug", "item", "brand",
			"seo_title", "seo_description",
			"short_description", "description",
			"benefits", "how_to_use", "key_ingredients", "skin_type",
			"price", "discount_price", "stock_status", "category", "is_featured"
		],
		as_dict=True
	)

	if not product:
		return {"status": "error", "message": "Product not found"}

	# Hide if product is Shipping Charge or Service
	title_lower = (product.get("title") or "").lower().strip()
	slug_lower = (product.get("slug") or "").lower().strip()
	if title_lower == "shipping charge" or "shipping charge" in title_lower or slug_lower == "shipping-charge":
		return {"status": "error", "message": "Product not found"}

	# Gather all images: child table, attached files, and linked Item image
	images_list = frappe.db.get_all(
		"Coscore Product Image",
		filters={"parent": product.name, "parenttype": "Coscore Product"},
		fields=["image", "alt_text"],
		order_by="idx asc"
	)
	
	images = [absolutize_media_url(img.image) for img in images_list if img.image]

	# Check for attached files in File doctype
	attached_files = frappe.db.get_all(
		"File",
		filters={
			"attached_to_doctype": "Coscore Product",
			"attached_to_name": product.name,
			"is_folder": 0
		},
		fields=["file_url"],
		order_by="creation asc"
	)
	for f in attached_files:
		file_url = absolutize_media_url(f.file_url)
		if file_url and file_url not in images:
			images.append(file_url)

	# Include ERPNext Item image if present
	if product.get("item"):
		item_img = absolutize_media_url(frappe.db.get_value("Item", product.item, "image"))
		if item_img and item_img not in images:
			images.insert(0, item_img)

	product["images"] = [{"image": img, "alt_text": product.title} for img in images]
	product["image"] = images[0] if images else None

	# Set cache-friendly response header
	frappe.local.response["http_status_code"] = 200

	return {"status": "success", "data": product}

@frappe.whitelist(allow_guest=True)
def get_products(category_slug=None, sort_by=None, search=None, page=1, page_size=12):
	"""
	Returns active products with filters and sorting. Excludes 'Shipping Charge' items and 'Service' item group products.
	"""
	filters = {"is_active": 1}

	if category_slug:
		cat_ids = _category_ids_for_slug(category_slug)
		if cat_ids:
			filters["category"] = ["in", cat_ids]
		else:
			# Keep previous behaviour for unknown slugs (empty result rather than all products)
			filters["category"] = category_slug

	if search:
		filters["title"] = ["like", f"%{search}%"]

	# Parse page parameters
	try:
		page = int(page)
		page_size = int(page_size)
	except ValueError:
		page = 1
		page_size = 12
		
	start = (page - 1) * page_size
	
	# Handle sort
	order_by = "title asc"
	if sort_by == "price-low-high":
		order_by = "price asc"
	elif sort_by == "price-high-low":
		order_by = "price desc"
	elif sort_by == "newest":
		order_by = "creation desc"

	raw_products = frappe.db.get_all(
		"Coscore Product",
		filters=filters,
		fields=["name", "title", "slug", "item", "price", "discount_price", "stock_status", "category", "is_featured"],
		order_by=order_by,
		start=start,
		page_length=page_size
	)

	# Filter out Shipping Charge item and Service category products
	products = []
	for p in raw_products:
		t = (p.get("title") or "").lower().strip()
		s = (p.get("slug") or "").lower().strip()
		it = (p.get("item") or "").lower().strip()
		if t == "shipping charge" or "shipping charge" in t or s == "shipping-charge" or it == "shipping charge":
			continue
		products.append(p)
	
	# Hydrate image
	for p in products:
		img_rows = frappe.db.get_all(
			"Coscore Product Image",
			filters={"parent": p.name, "parenttype": "Coscore Product"},
			fields=["image"],
			limit=1
		)
		img_url = img_rows[0].image if img_rows and img_rows[0].image else None

		if not img_url and p.get("item"):
			img_url = frappe.db.get_value("Item", p.item, "image")

		if not img_url:
			attached = frappe.db.get_all("File", filters={"attached_to_doctype": "Coscore Product", "attached_to_name": p.name, "is_folder": 0}, fields=["file_url"], limit=1)
			if attached:
				img_url = attached[0].file_url

		p["image"] = absolutize_media_url(img_url)

	total_count = len(products)

	return {
		"status": "success",
		"data": products,
		"total": total_count,
		"page": page,
		"page_size": page_size
	}

def get_featured_products():
	raw_products = frappe.db.get_all(
		"Coscore Product",
		filters={"is_featured": 1, "is_active": 1},
		fields=["name", "title", "slug", "item", "price", "discount_price", "stock_status", "category"],
		limit=12
	)
	products = []
	for p in raw_products:
		t = (p.get("title") or "").lower().strip()
		s = (p.get("slug") or "").lower().strip()
		it = (p.get("item") or "").lower().strip()
		if t == "shipping charge" or "shipping charge" in t or s == "shipping-charge" or it == "shipping charge":
			continue
		products.append(p)
		if len(products) >= 8:
			break

	for p in products:
		img_rows = frappe.db.get_all(
			"Coscore Product Image",
			filters={"parent": p.name, "parenttype": "Coscore Product"},
			fields=["image"],
			limit=1
		)
		img_url = img_rows[0].image if img_rows and img_rows[0].image else None
		if not img_url and p.get("item"):
			img_url = frappe.db.get_value("Item", p.item, "image")
		if not img_url:
			attached = frappe.db.get_all("File", filters={"attached_to_doctype": "Coscore Product", "attached_to_name": p.name, "is_folder": 0}, fields=["file_url"], limit=1)
			if attached:
				img_url = attached[0].file_url
		p["image"] = absolutize_media_url(img_url)
	return products

@frappe.whitelist(allow_guest=True)
def submit_job_application(full_name=None, email=None, phone=None, resume_url=None, job_title="Digital Marketer", experience=None, cover_letter=None):
	req_data = {}
	if frappe.request:
		try:
			req_data = frappe.request.get_json() or {}
		except Exception:
			pass
	if not req_data and frappe.form_dict:
		req_data = frappe.form_dict

	full_name = full_name or req_data.get("full_name") or req_data.get("fullName")
	email = email or req_data.get("email")
	phone = phone or req_data.get("phone")
	resume_url = resume_url or req_data.get("resume_url") or req_data.get("portfolioUrl")
	job_title = job_title or req_data.get("job_title") or req_data.get("jobTitle") or "Digital Marketer"
	experience = experience or req_data.get("experience")
	cover_letter = cover_letter or req_data.get("cover_letter") or req_data.get("coverLetter")

	if not full_name or not email or not phone or not resume_url:
		frappe.throw("Full name, email, phone, and resume link are required.")

	doc = frappe.get_doc({
		"doctype": "Coscore Job Applicant",
		"full_name": full_name,
		"email": email,
		"phone": phone,
		"job_title": job_title or "Digital Marketer",
		"experience": experience or "",
		"resume_url": resume_url,
		"cover_letter": cover_letter or "",
		"status": "New"
	})
	doc.insert(ignore_permissions=True)
	frappe.db.commit()

	return {
		"status": "success",
		"message": "Application submitted successfully!",
		"applicant_id": doc.name
	}
