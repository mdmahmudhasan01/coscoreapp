import frappe

def get_context(context):
    """Context for the checkout page (/checkout)"""
    # SEO (optional)
    if frappe.db.exists('Coscore SEO Setting'):
        context.seo = frappe.get_doc('Coscore SEO Setting')
    else:
        context.seo = frappe._dict()

    user = frappe.session.user
    # Load cart items
    cart_items = frappe.get_all('Coscore Cart Item',
                               filters={'owner': user},
                               fields=['item_code', 'item_name', 'quantity',
                                       'price', 'discount_price', 'image',
                                       'product_slug'])
    if not cart_items:
        # Redirect to shop if empty (frontend will handle)
        context.empty_cart = True
        return context
    # Compute subtotal
    subtotal = sum(item.quantity * (item.discount_price or item.price) for item in cart_items)
    context.cart_items = cart_items
    context.subtotal = subtotal
    context.total = subtotal  # Shipping will be added client‑side

    # Load shipping address defaults (if any) – stored in a custom DocType "Coscore Shipping Address"
    address = frappe.get_all('Coscore Shipping Address',
                            filters={'owner': user},
                            fields=['district', 'thana', 'address_line', 'postal_code'],
                            limit=1)
    if address:
        context.address = address[0]
    else:
        context.address = frappe._dict()

    # Load available payment gateways (fixture "Coscore Payment Gateway")
    context.payment_gateways = frappe.get_all('Coscore Payment Gateway',
                                            filters={'is_active': 1},
                                            fields=['name', 'gateway_title', 'logo'])

    # Load districts for the address form
    context.districts = frappe.get_all('Coscore District',
                                      filters={'is_active': 1},
                                      fields=['name', 'district_name'])
    return context
