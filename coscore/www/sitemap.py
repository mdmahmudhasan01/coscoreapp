import frappe

def get_context(context):
    """Generate sitemap XML for SEO crawlers"""
    base = frappe.utils.get_url()
    urls = [
        f"{base}/",
        f"{base}/shop",
        f"{base}/cart",
        f"{base}/checkout",
        f"{base}/thank-you",
    ]
    # Add product pages
    products = frappe.get_all('Coscore Product', filters={'is_active': 1}, fields=['slug'])
    for p in products:
        urls.append(f"{base}/product/{p.slug}")
    context.urls = urls
    return context
