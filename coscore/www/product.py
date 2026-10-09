import frappe

def get_context(context):
    """Context for a single product page (/product/<slug>)"""
    # SEO settings
    if frappe.db.exists('Coscore SEO Setting'):
        context.seo = frappe.get_doc('Coscore SEO Setting')
    else:
        context.seo = frappe._dict()

    slug = frappe.form_dict.get('slug')
    if not slug:
        frappe.throw('Product slug missing', frappe.PermissionError)

    prod = frappe.get_all('Coscore Product',
                          filters={'slug': slug, 'is_active': 1},
                          fields=['name', 'title', 'slug', 'seo_title', 'seo_description',
                                  'short_description', 'description', 'price',
                                  'discount_price', 'stock_status', 'category', 'item'])
    if not prod:
        frappe.throw('Product not found', frappe.DoesNotExistError)
    prod = prod[0]
    context.product = prod

    # Images child table
    context.images = frappe.get_all('Coscore Product Image',
                                    filters={'parent': prod.name, 'parenttype': 'Coscore Product'},
                                    fields=['image', 'alt_text'])

    # Related products (same category, excluding self)
    if prod.category:
        context.related_products = frappe.get_all(
            'Coscore Product',
            filters={'category': prod.category, 'is_active': 1, 'name': ['!=', prod.name]},
            fields=['name', 'title', 'slug', 'price', 'discount_price', 'stock_status'],
            limit=4
        )
        for rp in context.related_products:
            imgs = frappe.get_all('Coscore Product Image',
                                  filters={'parent': rp.name, 'parenttype': 'Coscore Product'},
                                  fields=['image'], limit=1)
            rp['image'] = imgs[0].image if imgs else None
    else:
        context.related_products = []

    return context
