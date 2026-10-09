import frappe

def get_context(context):
    """Context for the thank‑you page (/thank‑you)"""
    # SEO (optional)
    if frappe.db.exists('Coscore SEO Setting'):
        context.seo = frappe.get_doc('Coscore SEO Setting')
    else:
        context.seo = frappe._dict()

    order_name = frappe.form_dict.get('order')
    if not order_name:
        frappe.throw('Order reference missing', frappe.PermissionError)

    # Fetch Sales Invoice (assumes order is a Sales Invoice name)
    try:
        invoice = frappe.get_doc('Sales Invoice', order_name)
    except frappe.DoesNotExistError:
        frappe.throw('Order not found', frappe.PermissionError)

    context.invoice = {
        'name': invoice.name,
        'status': invoice.status,
        'posting_date': invoice.posting_date,
        'grand_total': invoice.grand_total,
        'currency': invoice.currency,
        'customer': invoice.customer,
        'items': [
            {
                'item_name': d.item_name,
                'qty': d.qty,
                'rate': d.rate,
                'amount': d.amount,
                'image': frappe.db.get_value('Coscore Product', d.item_code, 'image')
            } for d in invoice.items
        ]
    }
    return context
