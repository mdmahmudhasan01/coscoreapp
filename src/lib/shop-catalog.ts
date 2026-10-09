import catSkin from "@/assets/cat-skincare.jpg";
import catMakeup from "@/assets/cat-makeup.jpg";
import catHair from "@/assets/cat-hair.jpg";
import catSun from "@/assets/cat-sun.jpg";
import catBody from "@/assets/cat-body.jpg";
import catKbeauty from "@/assets/cat-kbeauty.jpg";
import pSerum from "@/assets/product-serum.jpg";
import pMoist from "@/assets/product-moisturizer.jpg";
import pCleanser from "@/assets/product-cleanser.jpg";
import pToner from "@/assets/product-toner.jpg";

export type Product = {
  id: string;
  name: string;
  brand: string;
  img: string;
  images?: string[];
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  category: string;
  subcategory: string;
  concerns: string[];
  skinType: string[];
  inStock: boolean;
  isNew?: boolean;
  badge?: { label: string; tone: "burgundy" | "emerald" | "gold" | "blush" };
  // Rich content fields from Coscore Product DocType
  shortDescription?: string;
  description?: string;
  benefits?: string;
  howToUse?: string;
  keyIngredients?: string;
  skinTypeText?: string;  // DB skin type as free text (separate from skinType array)
  seoTitle?: string;
  seoDescription?: string;
};

export type CategoryDef = {
  slug: string;
  name: string;
  tagline: string;
  hero: string;
  columns: { title: string; items: { label: string; slug: string }[] }[];
  featuredBrands: string[];
};

export const categories: CategoryDef[] = [
  {
    slug: "skincare",
    name: "Skincare",
    tagline: "Cleansers, serums, moisturizers & masks for every ritual.",
    hero: catSkin,
    columns: [
      {
        title: "Cleanse",
        items: [
          { label: "Cleansers", slug: "cleansers" },
          { label: "Oil Cleansers", slug: "oil-cleansers" },
          { label: "Exfoliators", slug: "exfoliators" },
          { label: "Toners", slug: "toners" },
        ],
      },
      {
        title: "Treat",
        items: [
          { label: "Serums", slug: "serums" },
          { label: "Essences", slug: "essences" },
          { label: "Ampoules", slug: "ampoules" },
          { label: "Face Masks", slug: "masks" },
        ],
      },
      {
        title: "Moisturize",
        items: [
          { label: "Moisturizers", slug: "moisturizers" },
          { label: "Eye Cream", slug: "eye-cream" },
          { label: "Face Oils", slug: "oils" },
          { label: "Lip Care", slug: "lip-care" },
        ],
      },
    ],
    featuredBrands: ["COSRX", "Beauty of Joseon", "Anua", "CeraVe", "The Ordinary"],
  },
  {
    slug: "sun-protection",
    name: "Sun Protection",
    tagline: "Daily SPF essentials for healthy, protected skin.",
    hero: catSun,
    columns: [
      {
        title: "Face",
        items: [
          { label: "Face Sunscreen", slug: "face-sunscreen" },
          { label: "Tinted SPF", slug: "tinted-spf" },
          { label: "Mineral SPF", slug: "mineral-spf" },
        ],
      },
      {
        title: "Body",
        items: [
          { label: "Body Sunscreen", slug: "body-sunscreen" },
          { label: "Sun Sprays", slug: "sun-sprays" },
          { label: "After Sun", slug: "after-sun" },
        ],
      },
    ],
    featuredBrands: ["Beauty of Joseon", "Round Lab", "Isntree", "La Roche-Posay"],
  },
  {
    slug: "makeup",
    name: "Makeup",
    tagline: "Lips, eyes, complexion — beauty for every mood.",
    hero: catMakeup,
    columns: [
      {
        title: "Face",
        items: [
          { label: "Foundation", slug: "foundation" },
          { label: "Concealer", slug: "concealer" },
          { label: "Powder", slug: "powder" },
          { label: "Blush", slug: "blush" },
        ],
      },
      {
        title: "Eyes",
        items: [
          { label: "Mascara", slug: "mascara" },
          { label: "Eyeliner", slug: "eyeliner" },
          { label: "Eyeshadow", slug: "eyeshadow" },
          { label: "Brows", slug: "brows" },
        ],
      },
      {
        title: "Lips",
        items: [
          { label: "Lipstick", slug: "lipstick" },
          { label: "Lip Tint", slug: "lip-tint" },
          { label: "Lip Gloss", slug: "lip-gloss" },
          { label: "Lip Balm", slug: "lip-balm" },
        ],
      },
    ],
    featuredBrands: ["Maybelline", "Rare Beauty", "Rom&nd", "Peripera", "Clio"],
  },
  {
    slug: "hair-care",
    name: "Hair Care",
    tagline: "Shampoo, conditioner and treatments for every hair type.",
    hero: catHair,
    columns: [
      {
        title: "Wash",
        items: [
          { label: "Shampoo", slug: "shampoo" },
          { label: "Conditioner", slug: "conditioner" },
          { label: "Scalp Care", slug: "scalp-care" },
        ],
      },
      {
        title: "Treat",
        items: [
          { label: "Hair Masks", slug: "hair-masks" },
          { label: "Hair Oils", slug: "hair-oils" },
          { label: "Serums", slug: "hair-serums" },
        ],
      },
    ],
    featuredBrands: ["Mise en Scène", "Ryo", "TS", "Kerastase"],
  },
  {
    slug: "body-care",
    name: "Body Care",
    tagline: "Lotions, scrubs and cleansers for silky, cared-for skin.",
    hero: catBody,
    columns: [
      {
        title: "Cleanse",
        items: [
          { label: "Body Wash", slug: "body-wash" },
          { label: "Body Scrubs", slug: "body-scrubs" },
          { label: "Hand Wash", slug: "hand-wash" },
        ],
      },
      {
        title: "Moisturize",
        items: [
          { label: "Body Lotion", slug: "body-lotion" },
          { label: "Body Butter", slug: "body-butter" },
          { label: "Hand Cream", slug: "hand-cream" },
        ],
      },
    ],
    featuredBrands: ["CeraVe", "Aveeno", "Nivea", "The Body Shop"],
  },
  {
    slug: "k-beauty",
    name: "K-Beauty",
    tagline: "Direct from Korea — the best of glass-skin rituals.",
    hero: catKbeauty,
    columns: [
      {
        title: "Bestsellers",
        items: [
          { label: "Snail Mucin", slug: "snail-mucin" },
          { label: "Propolis", slug: "propolis" },
          { label: "Centella", slug: "centella" },
          { label: "Rice Toners", slug: "rice-toners" },
        ],
      },
      {
        title: "Brands",
        items: [
          { label: "COSRX", slug: "cosrx" },
          { label: "Beauty of Joseon", slug: "beauty-of-joseon" },
          { label: "Anua", slug: "anua" },
          { label: "Round Lab", slug: "round-lab" },
        ],
      },
    ],
    featuredBrands: ["COSRX", "Beauty of Joseon", "Anua", "Round Lab", "Isntree", "Some By Mi"],
  },
];

export const allConcerns = [
  "Acne & Blemish",
  "Brightening",
  "Anti-Aging",
  "Hydration",
  "Oil Control",
  "Sensitive Skin",
  "Pores",
  "Dark Spots",
];

export const allSkinTypes = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];

export const allBrands = [
  "COSRX",
  "Beauty of Joseon",
  "Anua",
  "CeraVe",
  "The Ordinary",
  "Round Lab",
  "Isntree",
  "Some By Mi",
  "Maybelline",
  "Rom&nd",
  "Peripera",
];

const imgs = [pSerum, pMoist, pCleanser, pToner];
const brands = ["COSRX", "Beauty of Joseon", "Anua", "CeraVe", "The Ordinary", "Round Lab", "Isntree", "Some By Mi"];
const namesBySubcat: Record<string, string[]> = {
  serums: ["Snail Mucin Power Essence", "Niacinamide 10% Serum", "Propolis Glow Serum", "Vitamin C Brightening Serum"],
  moisturizers: ["Ceramide Barrier Cream", "Hyaluronic Water Cream", "Centella Soothing Gel", "Rice Glow Moisturizer"],
  cleansers: ["Low pH Gel Cleanser", "Rice Foaming Cleanser", "Heartleaf Quiet Cleanser", "Salicylic Daily Cleanser"],
  toners: ["Heartleaf 77% Toner", "Birch Juice Moisturizing Toner", "AHA/BHA Clarifying Toner", "Rice Toner"],
};

function seedProducts(): Product[] {
  return [
    {
      id: "anua-heartleaf-77-soothing-toner",
      name: "Anua Heartleaf 77% Soothing Toner",
      brand: "Anua",
      img: pToner,
      price: 1450,
      rating: 4.9,
      reviews: 2140,
      category: "skincare",
      subcategory: "toners",
      concerns: ["Sensitive Skin", "Acne & Blemish"],
      skinType: ["Sensitive", "Oily", "Combination"],
      inStock: true,
      badge: { label: "Best Seller", tone: "burgundy" }
    },
    {
      id: "glow-serum-propolis-niacinamide",
      name: "Beauty of Joseon Glow Serum : Propolis + Niacinamide",
      brand: "Beauty of Joseon",
      img: pSerum,
      price: 1450,
      rating: 4.8,
      reviews: 942,
      category: "skincare",
      subcategory: "serums",
      concerns: ["Brightening", "Hydration"],
      skinType: ["All"],
      inStock: true,
      badge: { label: "Editor's Pick", tone: "gold" }
    },
    {
      id: "beauty-of-joseon-sunscreen",
      name: "Beauty of Joseon Sunscreen",
      brand: "Beauty of Joseon",
      img: catSun,
      price: 1350,
      rating: 4.9,
      reviews: 3200,
      category: "sun-protection",
      subcategory: "face-sunscreen",
      concerns: ["Brightening", "Hydration"],
      skinType: ["All"],
      inStock: true,
      badge: { label: "Best Seller", tone: "burgundy" }
    },
    {
      id: "advanced-snail-96-mucin-power-essence",
      name: "COSRX Advanced Snail 96 Mucin Power Essence",
      brand: "COSRX",
      img: pMoist,
      price: 1250,
      compareAt: 1850,
      rating: 4.9,
      reviews: 2890,
      category: "skincare",
      subcategory: "serums",
      concerns: ["Hydration", "Brightening"],
      skinType: ["All", "Sensitive"],
      inStock: true,
      badge: { label: "Best Seller", tone: "burgundy" }
    },
    {
      id: "cosrx-low-ph-good-morning-gel-cleanser-150ml",
      name: "Cosrx Low pH Good Morning Gel Cleanser 150ml",
      brand: "COSRX",
      img: pCleanser,
      price: 1500,
      rating: 4.8,
      reviews: 850,
      category: "skincare",
      subcategory: "cleansers",
      concerns: ["Acne & Blemish"],
      skinType: ["Oily", "Combination"],
      inStock: true,
      badge: { label: "Trending", tone: "blush" }
    },
    {
      id: "cosrx-salicylic-acid-daily-gentle-cleanser-150ml",
      name: "Cosrx Salicylic Acid Daily Gentle Cleanser 150 ml",
      brand: "COSRX",
      img: pCleanser,
      price: 1500,
      rating: 4.7,
      reviews: 651,
      category: "skincare",
      subcategory: "cleansers",
      concerns: ["Acne & Blemish", "Oil Control"],
      skinType: ["Oily", "Combination"],
      inStock: true,
      badge: { label: "Best Seller", tone: "burgundy" }
    },
    {
      id: "cosrx-salicylic-acid-daily-gentle-cleanser",
      name: "COSRX Salicylic Acid Daily Gentle Cleanser",
      brand: "COSRX",
      img: pCleanser,
      price: 1290,
      compareAt: 1590,
      rating: 4.9,
      reviews: 1420,
      category: "skincare",
      subcategory: "cleansers",
      concerns: ["Acne & Blemish", "Oil Control"],
      skinType: ["Oily", "Combination", "Sensitive"],
      inStock: true,
      badge: { label: "Best Seller", tone: "burgundy" }
    },
    {
      id: "rice-foaming-cleanser",
      name: "Rice Foaming Cleanser",
      brand: "Beauty of Joseon",
      img: pCleanser,
      price: 1190,
      rating: 4.6,
      reviews: 320,
      category: "skincare",
      subcategory: "cleansers",
      concerns: ["Brightening"],
      skinType: ["All"],
      inStock: true,
      badge: { label: "New", tone: "emerald" }
    }
  ];
}

export const products: Product[] = seedProducts();

export function getCategory(slug: string): CategoryDef | undefined {
  return categories.find((c) => c.slug === slug);
}
