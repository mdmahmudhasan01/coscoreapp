"""Production WSGI entry that serves /files and /assets from the sites directory.

Gunicorn is normally started as ``frappe.app:application``, which does not mount
Frappe's StaticDataMiddleware. Public File URLs (``/files/...``) then fall through
to the website router and return 404 HTML even when the file exists on disk.

Use: ``gunicorn ... frappe_app:application`` with cwd = ``sites/``.
"""

from __future__ import annotations

import os

# cwd for lookzene-web is .../sites
os.environ.setdefault("SITES_PATH", ".")

import frappe.app as frappe_app

frappe_app._sites_path = os.path.abspath(os.environ.get("SITES_PATH", "."))
application = frappe_app.application_with_statics()
