import { categories, products, type Product } from "./shop-catalog";

export type SuggestionBucket = {
  products: Product[];
  brands: string[];
  categories: { label: string; category: string; sub?: string }[];
  concerns: string[];
};

const norm = (s: string) => s.toLowerCase().trim();

/** Case-insensitive, partial, multi-token AND match across searchable fields. */
export function matchesQuery(p: Product, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const cat = categories.find((c) => c.slug === p.category);
  const subLabel =
    cat?.columns
      .flatMap((c) => c.items)
      .find((i) => i.slug === p.subcategory)?.label ?? p.subcategory;
  const hay = [
    p.name,
    p.brand,
    p.category,
    cat?.name ?? "",
    p.subcategory,
    subLabel,
    ...p.concerns,
    ...p.skinType,
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

export function searchProducts(query: string): Product[] {
  const q = norm(query);
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return products.filter((p) => matchesQuery(p, tokens));
}

export function getSuggestions(query: string): SuggestionBucket {
  const q = norm(query);
  const empty: SuggestionBucket = { products: [], brands: [], categories: [], concerns: [] };
  if (!q) return empty;
  const tokens = q.split(/\s+/).filter(Boolean);
  const matched = products.filter((p) => matchesQuery(p, tokens));

  const brandSet = new Set<string>();
  matched.forEach((p) => brandSet.add(p.brand));
  const brands = Array.from(brandSet).slice(0, 4);

  const concernSet = new Set<string>();
  matched.forEach((p) => p.concerns.forEach((c) => {
    if (c.toLowerCase().includes(q)) concernSet.add(c);
  }));
  const concerns = Array.from(concernSet).slice(0, 3);

  const catHits: SuggestionBucket["categories"] = [];
  const seen = new Set<string>();
  for (const c of categories) {
    if (c.name.toLowerCase().includes(q) && !seen.has(c.slug)) {
      catHits.push({ label: c.name, category: c.slug });
      seen.add(c.slug);
    }
    for (const col of c.columns) {
      for (const it of col.items) {
        const key = `${c.slug}/${it.slug}`;
        if (
          !seen.has(key) &&
          (it.label.toLowerCase().includes(q) || it.slug.includes(q))
        ) {
          catHits.push({ label: `${it.label} · ${c.name}`, category: c.slug, sub: it.slug });
          seen.add(key);
        }
      }
    }
    if (catHits.length >= 4) break;
  }

  return {
    products: matched.slice(0, 6),
    brands,
    categories: catHits.slice(0, 4),
    concerns,
  };
}

export const popularSearches = [
  "Serum",
  "Sunscreen",
  "Snail Mucin",
  "COSRX",
  "Beauty of Joseon",
  "Lip Tint",
  "Moisturizer",
  "Toner",
];
