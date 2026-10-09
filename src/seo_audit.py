import urllib.request
import re

pages = [
    "/",
    "/shop/skincare",
    "/shop/sun-protection",
    "/shop/k-beauty",
    "/about",
    "/authenticity",
    "/careers",
    "/faq"
]

print("=== ON-PAGE SEO AUDIT REPORT FOR LOOKZENE ===\n")

for p in pages:
    url = f"http://127.0.0.1:3002{p}"
    req = urllib.request.Request(url, headers={"Host": "lookzene.com"})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode("utf-8")
            
            title_m = re.search(r"<title>(.*?)</title>", html, re.I)
            title = title_m.group(1) if title_m else "MISSING"
            
            desc_m = re.search(r"name=[\"\']description[\"\'].*?content=[\"\'](.*?)[\"\']", html, re.I)
            if not desc_m:
                desc_m = re.search(r"content=[\"\'](.*?)[\"\'].*?name=[\"\']description[\"\']", html, re.I)
            desc = desc_m.group(1) if desc_m else "MISSING"
            
            canonical_m = re.search(r"rel=[\"\']canonical[\"\'].*?href=[\"\'](.*?)[\"\']", html, re.I)
            if not canonical_m:
                canonical_m = re.search(r"href=[\"\'](.*?)[\"\'].*?rel=[\"\']canonical[\"\']", html, re.I)
            canonical = canonical_m.group(1) if canonical_m else "MISSING"
            
            h1_matches = re.findall(r"<h1[\s>](.*?)</h1>", html, re.I | re.S)
            h1_count = len(h1_matches)
            h1_text = re.sub(r"<[^>]+>", "", h1_matches[0]).strip() if h1_matches else "N/A"
            
            h2_count = len(re.findall(r"<h2[\s>]", html, re.I))
            
            og_title = "YES" if "og:title" in html else "NO"
            og_desc = "YES" if "og:description" in html else "NO"
            og_img = "YES" if "og:image" in html else "NO"
            json_ld = "YES" if "application/ld+json" in html else "NO"
            
            print(f"Page URL: https://lookzene.com{p}")
            print(f"  Title ({len(title)} chars): \"{title}\"")
            print(f"  Meta Description ({len(desc)} chars): \"{desc}\"")
            print(f"  Canonical Tag: {canonical}")
            print(f"  H1 Tag Count: {h1_count} (Text: \"{h1_text}\")")
            print(f"  H2 Heading Count: {h2_count}")
            print(f"  Open Graph Tags: Title={og_title}, Desc={og_desc}, Image={og_img}")
            print(f"  JSON-LD Schema: {json_ld}")
            print("-" * 65)
    except Exception as e:
        print(f"Error fetching {p}: {e}")
