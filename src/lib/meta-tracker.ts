/**
 * Lookzene Meta Conversions API (CAPI) & Pixel Dual-Tracking Client
 * 
 * Automatically sends both:
 * 1. Browser Meta Pixel with eventID
 * 2. Server CAPI relay via Frappe endpoint (coscore.api.meta_capi.track_event)
 * Deduplicates automatically at Meta with maximum Event Match Quality (EMQ).
 */

export function generateMetaEventId(prefix = "evt"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export interface MetaTrackOptions {
  eventName: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Lead" | "CompleteRegistration" | "Contact" | "Search";
  eventId?: string;
  userData?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    city?: string;
  };
  customData?: Record<string, any>;
  appSource?: "coscore" | "nella";
}

export function getMetaTrackingCookies(): {
  fbp: string | null;
  fbc: string | null;
  clientIp: string | null;
  referrerUrl: string | null;
  eventSourceUrl: string | null;
} {
  if (typeof document === "undefined") return { fbp: null, fbc: null, clientIp: null, referrerUrl: null, eventSourceUrl: null };
  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  };
  const cpBuilder = typeof window !== "undefined" ? (window as any).clientParamBuilder : null;
  const fbp = (cpBuilder && cpBuilder.getFbp ? cpBuilder.getFbp() : null) || getCookie('_fbp');
  let fbc = (cpBuilder && cpBuilder.getFbc ? cpBuilder.getFbc() : null) || getCookie('_fbc') || (typeof window !== "undefined" ? sessionStorage.getItem('_fbc_exact') : null);
  if (!fbc && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }
  }
  const clientIp = (cpBuilder && cpBuilder.getClientIpAddress ? cpBuilder.getClientIpAddress() : null) || getCookie('_fbi') || null;
  const referrerUrl = document.referrer || null;
  const eventSourceUrl = typeof window !== "undefined" ? window.location.href : null;
  return { fbp, fbc, clientIp, referrerUrl, eventSourceUrl };
}

export function trackMetaEvent({
  eventName,
  eventId = generateMetaEventId(eventName.toLowerCase()),
  userData = {},
  customData = {},
  appSource = "coscore"
}: MetaTrackOptions): string {
  // 1. Browser Pixel fire (with eventID for deduplication)
  if (typeof window !== "undefined" && (window as any).fbq) {
    try {
      (window as any).fbq("track", eventName, customData, { eventID: eventId });
    } catch (e) {
      console.debug("[Meta Pixel Error]", e);
    }
  }

  // 2. Server-side CAPI relay via ERPNext backend
  if (typeof window !== "undefined") {
    try {
      const { fbp, fbc, clientIp, referrerUrl, eventSourceUrl } = getMetaTrackingCookies();
      const enrichedUserData = {
        ...userData,
        client_ip_address: clientIp || undefined,
        fbp: fbp || undefined,
        fbc: fbc || undefined,
        referrer_url: referrerUrl || undefined
      };

      const apiEndpoint = "https://cp.lookzene.com/api/method/coscore.api.meta_capi.track_event";
      fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          event_name: eventName,
          event_id: eventId,
          user_data: enrichedUserData,
          custom_data: customData,
          app_source: appSource,
          event_source_url: eventSourceUrl || window.location.href
        }),
        keepalive: true
      }).catch((err) => console.debug("[Meta CAPI Relay Error]", err));
    } catch (err) {
      console.debug("[Meta CAPI Dispatch Error]", err);
    }
  }

  return eventId;
}

// Convenience Helpers:

export function trackMetaViewContent(product: { id: string; name: string; price: number; category?: string }) {
  return trackMetaEvent({
    eventName: "ViewContent",
    customData: {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      content_category: product.category,
      value: product.price,
      currency: "BDT"
    }
  });
}

export function trackMetaAddToCart(item: { id: string; name: string; price: number; qty?: number }) {
  const quantity = item.qty || 1;
  return trackMetaEvent({
    eventName: "AddToCart",
    customData: {
      content_name: item.name,
      content_ids: [item.id],
      content_type: "product",
      value: item.price * quantity,
      currency: "BDT",
      num_items: quantity
    }
  });
}

export function trackMetaInitiateCheckout(items: Array<{ id: string; name: string; price: number; qty: number }>, total: number) {
  return trackMetaEvent({
    eventName: "InitiateCheckout",
    customData: {
      contents: items.map((it) => ({
        id: it.id,
        name: it.name,
        quantity: it.qty,
        item_price: it.price
      })),
      content_type: "product",
      value: total,
      currency: "BDT",
      num_items: items.reduce((acc, it) => acc + it.qty, 0)
    }
  });
}
