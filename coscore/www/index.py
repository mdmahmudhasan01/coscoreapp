import frappe

def get_context(context):
    """Context for the homepage (/)"""
    # SEO settings (single record)
    if frappe.db.exists('Coscore SEO Setting'):
        context.seo = frappe.get_doc('Coscore SEO Setting')
    else:
        context.seo = frappe._dict()

    # Active homepage banners
    context.banners = frappe.get_all('Coscore Homepage Banner',
        filters={'is_active': 1},
        fields=['*'],
        order_by='sort_order')

    # Active homepage sections ordered by sort_order
    context.sections = frappe.get_all('Coscore Homepage Section',
        filters={'is_active': 1},
        fields=['*'],
        order_by='sort_order')
    return context
