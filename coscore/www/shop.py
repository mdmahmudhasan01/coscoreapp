import frappe

def get_context(context):
    """Context for the shop page (/shop and /shop?category=...)"""
    # SEO settings (optional)
    if frappe.db.exists('Coscore SEO Setting'):
        context.seo = frappe.get_doc('Coscore SEO Setting')
    else:
        context.seo = frappe._dict()

    # Category filter (optional, slug passed via query param "category")
    cat_slug = frappe.form_dict.get('category')
    if cat_slug:
        cat = frappe.get_all('Coscore Product Category',
                             filters={'slug': cat_slug, 'is_active': 1},
                             fields=['name'])
        if cat:
            context.category = cat[0].name
        else:
            context.category = None
    else:
        context.category = None

    # Pagination
    page = int(frappe.form_dict.get('page', 1))
    per_page = 12
    start = (page - 1) * per_page

    # Sorting – supported values: price_asc, price_desc, title
    sort = frappe.form_dict.get('sort', 'title')
    order_by = {
        'price_asc': 'price asc',
        'price_desc': 'price desc',
        'title': 'title asc'
    }.get(sort, 'title asc')

    # Base filters
    filters = {'is_active': 1}
    if context.category:
        filters['category'] = context.category

    # Total product count for pagination UI
    context.total = frappe.db.count('Coscore Product', filters=filters)

    # Fetch product list
    context.products = frappe.get_all('Coscore Product',
                                     filters=filters,
                                     fields=[
                                         'title', 'slug', 'price', 'discount_price',
                                         'stock_status', 'category'
                                     ],
                                     order_by=order_by,
                                     limit_start=start,
                                     limit_page_length=per_page)

    context.page = page
    context.per_page = per_page
    return context
