import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn&apos;t load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// Google & Meta SEO Schema JSON-LD Data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Lookzene",
  "legalName": "Lookzene Timeless Beauty",
  "url": "https://lookzene.com",
  "logo": "https://lookzene.com/favicon-32x32.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+8801915930000",
    "contactType": "customer service",
    "areaServed": "BD",
    "availableLanguage": ["English", "Bengali"]
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Dhaka Cantonment",
    "addressLocality": "Dhaka",
    "addressCountry": "BD"
  },
  "sameAs": [
    "https://www.facebook.com/lookzene",
    "https://www.instagram.com/lookzene"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Lookzene",
  "url": "https://lookzene.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://lookzene.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const onlineStoreSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "name": "Lookzene Bangladesh",
  "description": "Premier destination for 100% authentic Korean skincare and luxury cosmetics in Bangladesh.",
  "url": "https://lookzene.com",
  "priceRange": "৳৳",
  "currenciesAccepted": "BDT"
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" },
      { name: "theme-color", content: "#581C25" },
      { name: "facebook-domain-verification", content: "aggq0n7ziwxip3rplmrjkiej3ewhbk" },
      { title: "Lookzene — Timeless Beauty | Premium Skincare Bangladesh" },
      {
        name: "description",
        content:
          "Curated Korean skincare, international beauty, makeup and grooming. 100% authentic products. Free delivery over ৳2,000 across Bangladesh.",
      },
      { name: "keywords", content: "K-beauty Bangladesh, Korean skincare Dhaka, authentic skincare BD, Cosrx Bangladesh, Anua Sunscreen, Beauty of Joseon, Lookzene" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:site_name", content: "Lookzene" },
      { property: "og:title", content: "Lookzene — Timeless Beauty | Premium Skincare Bangladesh" },
      {
        property: "og:description",
        content: "Curated Korean skincare, international beauty, makeup and grooming. 100% authentic products. Free delivery over ৳2,000 across Bangladesh.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lookzene.com/" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8cd156bd-7445-4486-acd6-d6828e3e7a86/id-preview-3ede5e71--6c264ec6-7adb-4404-b290-cb51d287e9be.lovable.app-1784790094269.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@lookzene" },
      { name: "twitter:title", content: "Lookzene — Timeless Beauty | Premium Skincare Bangladesh" },
      { name: "twitter:description", content: "Curated Korean skincare, international beauty, makeup and grooming. 100% authentic products. Free delivery over ৳2,000 across Bangladesh." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8cd156bd-7445-4486-acd6-d6828e3e7a86/id-preview-3ede5e71--6c264ec6-7adb-4404-b290-cb51d287e9be.lovable.app-1784790094269.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Google Analytics GA4 & Live Action Tracking */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LOOKZENE"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LOOKZENE', { send_page_view: true });
            `,
          }}
        />
        {/* Meta Pixel (Facebook Ads) Tracking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '949950030799781');
              fbq('track', 'PageView');
            `,
          }}
        />
        {/* Meta Conversions API Parameter Builder (Official Client-Side SDK) */}
        <script src="/meta-param-builder.js"></script>
        {/* Google Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(onlineStoreSchema) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // 1. Early capture of fbclid from URL (preserve exact case)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get('fbclid');
      if (fbclid) {
        const fbcVal = `fb.1.${Date.now()}.${fbclid}`;
        document.cookie = `_fbc=${encodeURIComponent(fbcVal)};path=/;max-age=7776000;SameSite=Lax`;
        sessionStorage.setItem('_fbc_exact', fbcVal);
      }
    } catch (e) {
      console.debug('[Meta Param Builder URL]', e);
    }

    // 2. Execute Meta official Client-Side Parameter Builder SDK with IPv6 prioritization
    const runParamBuilder = async () => {
      try {
        const cpBuilder = (window as any).clientParamBuilder;
        if (cpBuilder && typeof cpBuilder.processAndCollectAllParams === 'function') {
          await cpBuilder.processAndCollectAllParams(window.location.href, async () => {
            try {
              const res = await fetch('https://api64.ipify.org?format=json', { signal: AbortSignal.timeout(2500) });
              if (res.ok) {
                const data = await res.json();
                return data.ip;
              }
            } catch {
              try {
                const res4 = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
                if (res4.ok) {
                  const data4 = await res4.json();
                  return data4.ip;
                }
              } catch {}
            }
            return '';
          });
        }
      } catch (err) {
        console.debug('[Meta Param Builder Init Error]', err);
      }
    };
    runParamBuilder();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
