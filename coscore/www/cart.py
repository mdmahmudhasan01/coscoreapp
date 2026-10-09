import frappe

def get_context(context):
    """Context for the cart page (/cart)"""
    # SEO settings (optional)
    if frappe.db.exists('Coscore SEO Setting'):
        context.seo = frappe.get_doc('Coscore SEO Setting')
    else:
        context.seo = frappe._dict()

    # Load cart items for the current user (assuming a custom DocType)
    user = frappe.session.user
    cart_items = frappe.get_all('Coscore Cart Item',
                               filters={'owner': user},
                               fields=['item_code', 'item_name', 'quantity',
                                       'price', 'discount_price', 'image',
                                       'product_slug'])
    # Compute totals
    subtotal = sum(item.quantity * (item.discount_price or item.price) for item in cart_items)
    context.cart_items = cart_items
    context.subtotal = subtotal
    context.total = subtotal  # Shipping will be added via AJAX on front‑end

    # Load districts for shipping address dropdown
    context.districts = frappe.get_all('Coscore District',
                                      filters={'is_active': 1},
                                      fields=['name', 'district_name'])
    return context
