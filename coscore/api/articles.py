import frappe

from coscore.api.storefront import absolutize_media_url


@frappe.whitelist(allow_guest=True)
def get_articles(limit=3, category=None):
	"""
	Returns published articles for the homepage/journal section.
	Sorted by published_on DESC (newest first).
	Supports optional category filter.
	"""
	filters = {"is_published": 1}
	if category:
		filters["category"] = category

	articles = frappe.db.get_all(
		"Coscore Article",
		filters=filters,
		fields=[
			"name", "title", "slug", "category",
			"cover_image", "excerpt", "author",
			"published_on", "meta_title", "meta_description"
		],
		order_by="published_on desc",
		limit=int(limit)
	)

	base_url = frappe.utils.get_url()

	return {
		"status": "success",
		"articles": [
			{
				"id": a.get("name"),
				"title": a.get("title"),
				"slug": a.get("slug"),
				"url": f"/beauty-journal/{a.get('slug')}",
				"category": a.get("category"),
				"cover_image": absolutize_media_url(a.get("cover_image") or "") or "",
				"excerpt": a.get("excerpt") or "",
				"author": a.get("author") or "Lookzene Team",
				"published_on": str(a.get("published_on") or ""),
				"meta_title": a.get("meta_title") or a.get("title"),
				"meta_description": a.get("meta_description") or a.get("excerpt"),
			}
			for a in articles
		]
	}

@frappe.whitelist(allow_guest=True)
def get_article(slug):
	"""Returns a single article by slug for the article detail page."""
	name = frappe.db.get_value("Coscore Article", {"slug": slug, "is_published": 1}, "name")
	if not name:
		frappe.throw("Article not found", frappe.DoesNotExistError)

	article = frappe.get_doc("Coscore Article", name)

	return {
		"status": "success",
		"article": {
			"title": article.title,
			"slug": article.slug,
			"category": article.category,
			"cover_image": absolutize_media_url(article.cover_image or "") or "",
			"excerpt": article.excerpt or "",
			"content": absolutize_media_in_content(article.content or ""),
			"author": article.author or "Lookzene Team",
			"published_on": str(article.published_on or ""),
			"meta_title": article.meta_title or article.title,
			"meta_description": article.meta_description or article.excerpt or "",
			"meta_keywords": article.meta_keywords or "",
			"og_image": absolutize_media_url(article.og_image or article.cover_image or "") or "",
		}
	}


def absolutize_media_in_content(content: str) -> str:
	from coscore.api.storefront import absolutize_media_in_text

	return absolutize_media_in_text(content) or ""
