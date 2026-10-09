import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Truck,
  Lock,
  CheckCircle2,
  ChevronRight,
  Tag,
  Banknote,
  Smartphone,
  Trash2,
  Plus,
  Minus,
  AlertCircle, CreditCardIcon,
} from "lucide-react";

import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";
import { LoyaltyPanel } from "@/components/site/loyalty-panel";
import { cart as cartStore, useCart } from "@/lib/cart-store";
import {
  DISTRICT_NAMES,
  areasFor,
  divisionFor,
  type Division,
} from "@/lib/bd-districts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { submitOrderToCoscore, calculateShippingCharge, validatePhone as apiValidatePhone, initiateGatewayPayment, fetchActiveGateways, fetchDistricts, fetchThanas, fetchPostalCodes, sendOtp, verifyOtp, checkCustomerStatus, resolveMediaUrl } from "@/lib/coscore-api";
import { getMetaTrackingCookies } from "@/lib/meta-tracker";
import { PaymentGatewaySelect } from "@/components/PaymentGatewaySelect";
import pSerum from "@/assets/product-serum.jpg";




const SITE_URL = "https://lookzene.lovable.app";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Lookzene" },
      { name: "robots", content: "noindex, follow" },
      {
        name: "description",
        content:
          "Complete your Lookzene order securely with cash on delivery or bKash. Free delivery over BDT 2,000 across Bangladesh.",
      },
      { property: "og:title", content: "Secure Checkout — Lookzene" },
      {
        property: "og:description",
        content:
          "Fast, secure checkout for authentic beauty & skincare in Bangladesh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { rel: "canonical", href: `${SITE_URL}/checkout` } as never,
    ],
  }),
  component: CheckoutPage,
});

type CartLine = {
  id: string;
  name: string;
  brand: string;
  img: string;
  price: number;
  compareAt?: number;
  qty: number;
};

/** Delivery zones map division + city hints to fees and ETAs. */
type ZoneId =
  | "dhaka-metro"
  | "dhaka-suburb"
  | "chattogram"
  | "nearby"
  | "far"
  | "remote";

const ZONES: Record<
  ZoneId,
  {
    label: string;
    baseFee: number;
    perItemFee: number;
    etaMinDays: number;
    etaMaxDays: number;
    expressAvailable: boolean;
  }
> = {
  "dhaka-metro": { label: "Dhaka Metro", baseFee: 70, perItemFee: 10, etaMinDays: 1, etaMaxDays: 2, expressAvailable: true },
  "dhaka-suburb": { label: "Dhaka Suburb", baseFee: 100, perItemFee: 15, etaMinDays: 2, etaMaxDays: 3, expressAvailable: false },
  chattogram: { label: "Chattogram", baseFee: 130, perItemFee: 20, etaMinDays: 3, etaMaxDays: 4, expressAvailable: false },
  nearby: { label: "Nearby Division", baseFee: 140, perItemFee: 20, etaMinDays: 3, etaMaxDays: 5, expressAvailable: false },
  far: { label: "Distant Division", baseFee: 160, perItemFee: 25, etaMinDays: 4, etaMaxDays: 6, expressAvailable: false },
  remote: { label: "Remote Area", baseFee: 190, perItemFee: 30, etaMinDays: 5, etaMaxDays: 8, expressAvailable: false },
};

/** Map a Bangladesh division → base shipping zone. */
const DIVISION_ZONE: Record<Division, ZoneId> = {
  Dhaka: "dhaka-suburb",
  Chattogram: "chattogram",
  Mymensingh: "nearby",
  Sylhet: "nearby",
  Khulna: "far",
  Rajshahi: "far",
  Barishal: "far",
  Rangpur: "remote",
};

/**
 * Area-level zone overrides.
 * Keys are lowercased area/thana names — matched against the selected Area.
 * These refine the district-based zone (e.g. inner-Dhaka thanas → metro,
 * outer-Dhaka upazilas → suburb, hill-tract upazilas → remote).
 */
const METRO_AREAS = new Set([
  "gulshan", "banani", "baridhara", "dhanmondi", "mohammadpur", "mirpur",
  "uttara", "tejgaon", "ramna", "motijheel", "paltan", "shahbagh",
  "new market", "hazaribagh", "lalbagh", "kotwali", "sutrapur", "wari",
  "khilgaon", "badda", "rampura", "kafrul", "cantonment", "shah ali",
  "pallabi", "kalabagan", "hatirjheel", "gendaria", "bangshal", "chawkbazar",
  "adabor", "darus salam", "sher-e-bangla nagar", "kadamtali", "demra",
  "jatrabari", "khilkhet", "vatara", "shyampur", "turag", "uttar khan",
  "dakshin khan", "bimanbandar",
]);
const SUBURB_AREAS = new Set([
  "savar", "dhamrai", "keraniganj", "nawabganj", "dohar",
]);
const CTG_METRO_AREAS = new Set([
  "kotwali", "panchlaish", "khulshi", "double mooring", "halishahar",
  "pahartali", "bandar", "bayazid", "chandgaon", "chawkbazar", "akbarshah",
  "epz", "karnaphuli", "patenga", "sadarghat",
]);
const REMOTE_AREAS = new Set([
  "thanchi", "ruma", "alikadam", "lama", "naikhongchhari",
  "barkal", "juraichhari", "bilaichhari", "belaichhari",
  "sajek", "baghaichhari", "dighinala", "manikchhari", "matiranga",
  "kutubdia", "moheshkhali", "sandwip", "hatiya", "bhola sadar", "monpura",
  "tazumuddin", "char fasson", "lalmohan", "burhanuddin",
]);

function resolveZone(district: string, area?: string): ZoneId {
  const div = divisionFor(district);
  if (!div) return "far";
  const a = (area ?? "").trim().toLowerCase();

  // Remote upazilas dominate — override anything else.
  if (a && REMOTE_AREAS.has(a)) return "remote";

  if (district === "Dhaka") {
    if (!a) return "dhaka-metro";
    if (METRO_AREAS.has(a)) return "dhaka-metro";
    if (SUBURB_AREAS.has(a)) return "dhaka-suburb";
    return "dhaka-metro";
  }

  if (district === "Chattogram") {
    if (a && CTG_METRO_AREAS.has(a)) return "chattogram";
    // Outlying Chattogram upazilas cost a bit more.
    return a ? "nearby" : "chattogram";
  }

  return DIVISION_ZONE[div];
}

function formatEta(minD: number, maxD: number) {
  const add = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  return `${add(minD)} – ${add(maxD)}`;
}

/* ───────── validators ───────── */
const NOTES_MAX = 300;

/**
 * Bangladesh mobile: exactly 11 numeric digits, must begin with "01".
 * (Only digits accepted; input strips non-digits before validation.)
 */
function validatePhone(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 11 || !digits.startsWith("01")) {
    return "Please enter a valid 11-digit Bangladeshi mobile number.";
  }
  return "";
}
function validateName(v: string, label: string): string {
  const t = v.trim();
  if (!t) return `${label} is required.`;
  if (t.length < 2) return `${label} is too short.`;
  if (t.length > 60) return `${label} is too long.`;
  return "";
}
function validateAddress1(v: string): string {
  const t = v.trim();
  if (!t) return "Address is required.";
  if (t.length < 5) return "Please enter a full street address.";
  if (t.length > 120) return "Address is too long.";
  return "";
}
function validateDistrict(v: string): string {
  if (!v) return "Please select a district.";
  if (!v) return "Please choose a valid district.";
  return "";
}
function validateArea(v: string, district: string): string {
  if (!district) return "Select a district first.";
  if (!v) return "Please select an area / thana.";
  if (!v) return "Please select an area / thana.";
  return "";
}
function validatePostal(v: string): string {
  const t = v.trim();
  if (!t) return "Postal code is required.";
  if (!/^\d{4}$/.test(t)) return "Postal code must be 4 digits.";
  return "";
}
function validateNotes(v: string): string {
  if (v && v.length > NOTES_MAX) return `Keep notes under ${NOTES_MAX} characters.`;
  return "";
}
function validateEmail(v: string): string {
  const t = v.trim();
  if (!t) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "Please enter a valid email.";
  return "";
}
function validatePassword(v: string): string {
  if (!v) return "Password is required.";
  if (v.length < 8) return "Password must be at least 8 characters.";
  return "";
}
function validateConfirmPassword(pw: string, confirm: string): string {
  if (!confirm) return "Please confirm your password.";
  if (pw !== confirm) return "Passwords do not match.";
  return "";
}

type Address = {
  fullName: string;
  address1: string;
  address2: string;
  district: string;
  area: string;
  postal: string;
};
const EMPTY_ADDRESS: Address = {
  fullName: "",
  address1: "",
  address2: "",
  district: "",
  area: "",
  postal: "",
};

/** Full validation of an address; keys are prefixed e.g. "billing.firstName". */
function validateAddress(a: Address, prefix: "billing" | "shipping"): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (k: string, msg: string) => {
    if (msg) out[`${prefix}.${k}`] = msg;
  };
  put("fullName", validateName(a.fullName, "Full name"));
  put("address1", validateAddress1(a.address1));
  put("district", validateDistrict(a.district));
  put("area", validateArea(a.area, a.district));
  put("postal", validatePostal(a.postal));
  return out;
}

const PAYMENT_METHODS: {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}[] = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay in cash when your order arrives.", icon: Banknote, badge: "Most popular" },
  { id: "bkash", label: "bKash", desc: "Instant mobile payment via bKash.", icon: Smartphone }
];

function CheckoutPage() {
  const { items: cart } = useCart();
  const [selectedGateway, setSelectedGateway] = useState<string>('cod');

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [altPhone, setAltPhone] = useState("");
  const [altPhoneErr, setAltPhoneErr] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (otpCooldown > 0) {
      const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCooldown]);

  const handleSendOtp = async () => {
    if (phoneErr || !phone) return;
    setOtpLoading(true);
    setOtpError("");
    const res = await sendOtp(phone);
    setOtpLoading(false);
    if (res && res.status === "success") {
      setOtpSent(true);
      setOtpCooldown(60);
    } else {
      setOtpError(res?.message || "Failed to send OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setOtpLoading(true);
    setOtpError("");
    const res = await verifyOtp(phone, otp);
    setOtpLoading(false);
    if (res && res.status === "success") {
      setIsPhoneVerified(true);
      setOtpError("");
    } else {
      setOtpError(res?.message || "Invalid OTP.");
    }
  };

  const [notes, setNotes] = useState("");
  const [notesErr, setNotesErr] = useState("");

  const [billing, setBilling] = useState<Address>(EMPTY_ADDRESS);
  const [shipping, setShipping] = useState<Address>(EMPTY_ADDRESS);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // errors + touched keyed by "billing.firstName" | "shipping.area" | "phone" | "notes"
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // callback-ref map so we can focus the first invalid field on submit
  const fieldRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const bindRef = (key: string) => (el: HTMLElement | null) => {
    fieldRefs.current[key] = el;
  };

  const [tier, setTier] = useState<"standard" | "express">("standard");
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; pct: number } | null>(null);
  const [promoError, setPromoError] = useState<string>("");
  const [placed, setPlaced] = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);

  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;

  // Guest → optional account creation at checkout
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dbShippingFee, setDbShippingFee] = useState<number | null>(null);

  // Pre-fill contact details from logged-in user session
  useEffect(() => {
    if (!user) return;
    const meta = (user as any).user_metadata || {};
    if (meta.phone && !phone) {
      const digits = String(meta.phone).replace(/\D/g, "").slice(0, 11);
      setPhone(digits);
    }
    if ((user.email || meta.email) && !email) {
      setEmail(user.email || meta.email || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Automatically bypass OTP for already registered / verified customers
  useEffect(() => {
    if (user) {
      // Logged-in user: always verified, phone stays editable
      setIsPhoneVerified(true);
      return;
    }
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (cleanPhone.length === 11) {
      checkCustomerStatus({ phone: cleanPhone, email }).then((res) => {
        if (res && res.is_registered) {
          setIsPhoneVerified(true);
        } else {
          setIsPhoneVerified(false);
        }
      });
    } else if (email && email.includes("@")) {
      checkCustomerStatus({ email }).then((res) => {
        if (res && res.is_registered) {
          setIsPhoneVerified(true);
        }
      });
    }
  }, [user, phone, email]);


  /** Keep shipping mirrored to billing while the checkbox is on. */
  useEffect(() => {
    if (sameAsBilling) setShipping(billing);
  }, [sameAsBilling, billing]);

  const updateAddress = (which: "billing" | "shipping", patch: Partial<Address>) => {
    if (which === "billing") {
      setBilling((prev) => {
        const next = { ...prev, ...patch };
        // Changing district resets the dependent area for that address.
        if ("district" in patch && patch.district !== prev.district) next.area = "";
        return next;
      });
    } else {
      setShipping((prev) => {
        const next = { ...prev, ...patch };
        if ("district" in patch && patch.district !== prev.district) next.area = "";
        return next;
      });
    }
    // clear error while the user is typing after they've touched the field
    Object.keys(patch).forEach((k) => {
      const key = `${which}.${k}`;
      if (touched[key]) {
        setErrors((prev) => {
          const nxt = { ...prev };
          delete nxt[key];
          return nxt;
        });
      }
    });
  };

  const markTouched = (key: string) => setTouched((p) => ({ ...p, [key]: true }));

  const runAllValidation = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const pErr = validatePhone(phone);
    if (pErr) errs.phone = pErr;
    const nErr = validateNotes(notes);
    if (nErr) errs.notes = nErr;
    Object.assign(errs, validateAddress(billing, "billing"));
    if (!sameAsBilling) Object.assign(errs, validateAddress(shipping, "shipping"));
    return errs;
  };

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const compareTotal = useMemo(
    () => cart.reduce((s, l) => s + (l.compareAt ?? l.price) * l.qty, 0),
    [cart],
  );
  const productSavings = Math.max(0, compareTotal - subtotal);
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  // Shipping fee is calculated from the *shipping* address (or billing when same).
  const deliverTo = sameAsBilling ? billing : shipping;

  useEffect(() => {
    if (deliverTo.area || deliverTo.district) {
      calculateShippingCharge({
        thana: deliverTo.area,
        district: deliverTo.district,
        is_cod: selectedGateway === "cod",
      }).then((res) => {
        if (res && res.status === "success") {
          setDbShippingFee(res.charge);
        } else {
          setDbShippingFee(null);
        }
      });
    } else {
      setDbShippingFee(null);
    }
  }, [deliverTo.area, deliverTo.district, selectedGateway]);

  const zoneId = useMemo(
    () => resolveZone(deliverTo.district, deliverTo.area),
    [deliverTo.district, deliverTo.area],
  );
  const zone = ZONES[zoneId];

  const standardFee = dbShippingFee !== null ? dbShippingFee : (zone.baseFee + Math.max(0, itemCount - 1) * zone.perItemFee);
  const expressFee = Math.round(standardFee * 2.2 + 120);

  const shippingOptions = useMemo(() => {
    const opts: { id: "standard" | "express"; label: string; eta: string; fee: number; note?: string }[] = [
      {
        id: "standard",
        label: `Standard — ${zone.label}`,
        eta: `${zone.etaMinDays}–${zone.etaMaxDays} business days · Arrives ${formatEta(zone.etaMinDays, zone.etaMaxDays)}`,
        fee: standardFee,
      },
    ];
    if (zone.expressAvailable) {
      opts.push({ id: "express", label: "Same-Day Express", eta: "Order before 1 PM · Delivered today", fee: expressFee, note: "Dhaka Metro only" });
    }
    return opts;
  }, [zone, standardFee, expressFee]);

  const activeTier = shippingOptions.some((o) => o.id === tier) ? tier : "standard";
  const shipping_ = shippingOptions.find((o) => o.id === activeTier)!;

  const freeShippingThreshold = 2000;
  const isFreeShipping = subtotal >= freeShippingThreshold && shipping_.id !== "express";
  const shippingFee = isFreeShipping ? 0 : shipping_.fee;
  const missingForFree = Math.max(0, freeShippingThreshold - subtotal);

  const promoDiscount = appliedPromo ? Math.round(subtotal * (appliedPromo.pct / 100)) : 0;
  const total = Math.max(0, subtotal - promoDiscount + shippingFee);

  const updateQty = (id: string, delta: number) => cartStore.increment(id, delta);
  const removeLine = (id: string) => cartStore.remove(id);

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    const map: Record<string, number> = { GLOW10: 10, BLUSH15: 15, LOOKZENE20: 20 };
    if (map[code]) {
      setAppliedPromo({ code, pct: map[code] });
      setPromoError("");
    } else {
      setAppliedPromo(null);
      setPromoError("That code isn't valid. Try GLOW10, BLUSH15 or LOOKZENE20.");
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");
    const next = runAllValidation();

    // Contact + optional account creation validations
    const emailErr = validateEmail(email);
    if (emailErr) next.email = emailErr;
    if (isGuest && createAccount) {
      const pwErr = validatePassword(password);
      if (pwErr) next.password = pwErr;
      const cpwErr = validateConfirmPassword(password, confirmPassword);
      if (cpwErr) next.confirmPassword = cpwErr;
    }

    setErrors(next);
    setPhoneTouched(true);
    setPhoneErr(next.phone ?? "");
    setNotesErr(next.notes ?? "");
    const touchAll: Record<string, boolean> = {
      phone: true,
      notes: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    (["fullName", "address1", "district", "area", "postal"] as const).forEach((k) => {
      touchAll[`billing.${k}`] = true;
      if (!sameAsBilling) touchAll[`shipping.${k}`] = true;
    });
    setTouched((prev) => ({ ...prev, ...touchAll }));

    const order = [
      "email", "phone", "password", "confirmPassword",
      "billing.fullName", "billing.address1",
      "billing.district", "billing.area", "billing.postal",
      "shipping.fullName", "shipping.address1",
      "shipping.district", "shipping.area", "shipping.postal",
      "notes",
    ];
    if (!isPhoneVerified) {
      setOtpError("Please verify your phone number to proceed.");
      const el = fieldRefs.current["phone"];
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const firstBad = order.find((k) => next[k]);
    if (firstBad) {
      const el = fieldRefs.current[firstBad];
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const fullName = billing.fullName.trim();
      const shippingAddress = sameAsBilling ? billing : shipping;
      let userId: string | null = user?.id ?? null;

      // Guest opting to create an account → sign them up first
      if (isGuest && createAccount) {
        console.warn("Account creation is bypassed (Supabase disabled). Relying on ERPNext backend.");
      }

      // Generate a unique order identifier used for both ERPNext sync and payment gateway
      const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

      const eligibleAmount = Math.max(0, subtotal - promoDiscount);
      // Supabase order insertion bypassed. Syncing directly to Coscore ERPNext.

      const { fbp, fbc, clientIp, referrerUrl, eventSourceUrl } = getMetaTrackingCookies();

      // Sync order to Coscore ERPNext Engine
      await submitOrderToCoscore({
        order_id: orderId,
        email,
        phone,
        full_name: fullName,
        custom_alternative_phone: altPhone,
        user_id: userId ?? undefined,
        create_account: isGuest && createAccount,
        password: isGuest && createAccount ? password : undefined,
        total_amount: total,
        eligible_amount: eligibleAmount,
        shipping_charge: shippingFee,
        discount_amount: promoDiscount,
        client_ip: clientIp || undefined,
        fbp: fbp || undefined,
        fbc: fbc || undefined,
        referrer_url: referrerUrl || undefined,
        event_source_url: eventSourceUrl || window.location.href,
        order_source: "lookzene main",
        items: cart.map((l) => ({
          id: l.id,
          name: l.name,
          price: l.price,
          quantity: l.qty,
        })),
        shipping_address: {
          district: shippingAddress.district || "Dhaka",
          address: shippingAddress.address1 || "",
        },
      });

      // If payment method is not COD, initiate gateway payment and redirect
      if (selectedGateway !== 'cod') {
        const callbackUrl = `${window.location.origin}/checkout/result`;
        const paymentRes = await initiateGatewayPayment({
          order_name: orderId,
          gateway_name: selectedGateway,
          callback_url: callbackUrl,
        });
        if (paymentRes && paymentRes.payment_url) {
          window.location.href = paymentRes.payment_url;
          return; // Prevent further UI update until payment flow completes
        }
      }

      setFinalTotal(total);
      setPlaced(true);
      cartStore.clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };


  if (placed) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <SiteHeader />
        <main className="container-luxe py-20 md:py-28">
          <div className="max-w-xl mx-auto text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald/15 text-emerald grid place-items-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-serif text-4xl md:text-5xl mt-6">Order confirmed</h1>
            <p className="mt-3 text-muted-foreground">
              Thank you — a confirmation has been sent to your email. Order total{" "}
              <span className="font-semibold text-foreground">BDT {finalTotal.toLocaleString()}</span>.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-8 bg-burgundy text-primary-foreground rounded-full px-7 py-4 text-sm font-semibold hover:shadow-luxury transition-all"
            >
              Continue shopping
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      <main className="container-luxe py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs text-muted-foreground">
            <li><Link to="/" className="hover:text-burgundy">Home</Link></li>
            <ChevronRight className="h-3 w-3" />
            <li className="text-foreground font-medium" aria-current="page">Checkout</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-serif text-3xl md:text-4xl lg:text-5xl">Secure Checkout</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete your order below. All information is encrypted and never shared.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 text-emerald" />
            256-bit SSL secured checkout
          </div>
        </div>

        {!isFreeShipping && shipping_.id !== "express" && (
          <div className="mb-8 rounded-2xl bg-blush/25 border border-blush/60 px-4 md:px-5 py-4">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="font-semibold text-burgundy">
                {missingForFree > 0
                  ? `Add BDT ${missingForFree.toLocaleString()} more for FREE delivery`
                  : "You've unlocked free delivery!"}
              </span>
              <Truck className="h-4 w-4 text-burgundy" />
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-background overflow-hidden">
              <div className="h-full bg-burgundy transition-all" style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }} />
            </div>
          </div>
        )}

        <form onSubmit={submit} noValidate className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-10 items-start">
          <div className="space-y-8">
            {/* Contact */}
            <Section step={1} title="Contact information">
              <div className="grid sm:grid-cols-2 gap-4">                <div className="space-y-3">
                  <Input
                    ref={bindRef("phone")}
                    label="Phone"
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    value={phone}
                    disabled={false}
                    onChange={(e) => {
                      let digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                      if (digits.length >= 1 && digits[0] !== '0') digits = '';
                      if (digits.length >= 2 && digits[1] !== '1') digits = '0';
                      setPhone(digits);
                      setOtpSent(false);
                      setIsPhoneVerified(false);
                      if (phoneTouched) setPhoneErr(validatePhone(digits));
                    }}
                    onBlur={() => {
                      setPhoneTouched(true);
                      const localErr = validatePhone(phone);
                      setPhoneErr(localErr);
                    }}
                    error={phoneTouched ? phoneErr : ""}
                    hint="Enter your 11-digit Bangladesh mobile starting with 01."
                  />
                  {/* OTP Verification UI */}
                  {phone.length === 11 && !phoneErr && !isPhoneVerified && (
                    <div className="rounded-lg border border-border bg-blush/10 p-3 text-sm">
                      {!otpSent ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground text-xs">Verify your number to secure your order.</span>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpLoading}
                            className="bg-burgundy text-white rounded py-2 px-4 text-xs font-semibold hover:bg-burgundy/90 transition disabled:opacity-50"
                          >
                            {otpLoading ? "Sending..." : "Send OTP via SMS"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-foreground">Enter 6-digit OTP</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                              className="border rounded px-3 py-2 w-full text-sm"
                              placeholder="123456"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={otpLoading || otp.length < 6}
                              className="bg-burgundy text-white rounded py-2 px-4 text-xs font-semibold hover:bg-burgundy/90 disabled:opacity-50 shrink-0"
                            >
                              Verify
                            </button>
                          </div>
                          <div className="flex justify-between items-center text-[11px] mt-1">
                            {otpCooldown > 0 ? (
                              <span className="text-muted-foreground">Resend in {otpCooldown}s</span>
                            ) : (
                              <button type="button" onClick={handleSendOtp} className="text-burgundy font-medium hover:underline">
                                Resend OTP
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {otpError && <div className="text-burgundy text-[11px] mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {otpError}</div>}
                    </div>
                  )}
                  {isPhoneVerified && (
                    <div className="text-emerald text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Number verified
                    </div>
                  )}
                </div>
                <Input
                  label="Alternative Phone (Optional)"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  inputMode="numeric"
                  maxLength={11}
                  value={altPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setAltPhone(digits);
                    setAltPhoneErr(digits.length > 0 ? validatePhone(digits) : "");
                  }}
                  error={altPhoneErr}
                />

              </div>

              {user ? (
                <div className="mt-4 rounded-lg bg-emerald/10 border border-emerald/30 px-3 py-2.5 text-xs text-foreground">
                  Signed in as{" "}
                  <span className="font-semibold">{user.email}</span> — this order will
                  earn Glow Rewards automatically.
                </div>
              ) : (
                <div className="mt-4">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="accent-burgundy mt-0.5 h-4 w-4"
                    />
                    <span className="text-sm text-foreground group-hover:text-burgundy transition-colors">
                      Create a Lookzene account for faster checkout and Glow Rewards
                    </span>
                  </label>

                  {createAccount && (
                    <div className="mt-4 grid sm:grid-cols-2 gap-4 rounded-xl bg-blush/20 border border-blush/60 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Input
                        ref={bindRef("password")}
                        label="Password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (touched.password) {
                            setErrors((prev) => ({
                              ...prev,
                              password: validatePassword(e.target.value),
                              confirmPassword: confirmPassword
                                ? validateConfirmPassword(e.target.value, confirmPassword)
                                : prev.confirmPassword,
                            }));
                          }
                        }}
                        onBlur={() => {
                          markTouched("password");
                          setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
                        }}
                        error={touched.password ? errors.password : ""}
                      />
                      <Input
                        ref={bindRef("confirmPassword")}
                        label="Confirm password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (touched.confirmPassword) {
                            setErrors((prev) => ({
                              ...prev,
                              confirmPassword: validateConfirmPassword(password, e.target.value),
                            }));
                          }
                        }}
                        onBlur={() => {
                          markTouched("confirmPassword");
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: validateConfirmPassword(password, confirmPassword),
                          }));
                        }}
                        error={touched.confirmPassword ? errors.confirmPassword : ""}
                      />
                      <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                        We'll use your name, phone, and email from this checkout to set up
                        your account.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" defaultChecked className="accent-burgundy" />
                Email me exclusive drops & 10% off my next order
              </label>
            </Section>

            {/* Billing address */}
            <Section step={2} title="Billing address">
              <AddressForm
                prefix="billing"
                value={billing}
                onChange={(patch) => updateAddress("billing", patch)}
                errors={errors}
                touched={touched}
                markTouched={markTouched}
                bindRef={bindRef}
                setErrors={setErrors}
              />

              <label className="mt-5 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="accent-burgundy"
                />
                <span className="font-medium">Shipping address is the same as billing address</span>
              </label>
            </Section>

            {/* Shipping address (only when different from billing) */}
            {!sameAsBilling && (
              <Section step={3} title="Shipping address">
                <AddressForm
                  prefix="shipping"
                  value={shipping}
                  onChange={(patch) => updateAddress("shipping", patch)}
                  errors={errors}
                  touched={touched}
                  markTouched={markTouched}
                  bindRef={bindRef}
                  setErrors={setErrors}
                />
              </Section>
            )}

            {/* Delivery notes */}
            <Section step={sameAsBilling ? 3 : 4} title="Delivery notes (optional)">
              <Textarea
                ref={bindRef("notes")}
                label="Notes for the courier"
                rows={3}
                maxLength={NOTES_MAX}
                placeholder="Landmarks, gate code, preferred delivery time…"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (touched.notes) setNotesErr(validateNotes(e.target.value));
                }}
                onBlur={() => {
                  markTouched("notes");
                  setNotesErr(validateNotes(notes));
                }}
                error={touched.notes ? notesErr : ""}
                hint={`${notes.length}/${NOTES_MAX} characters`}
              />

              <div className="mt-4 rounded-lg bg-ivory border border-border p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 text-burgundy mt-0.5 shrink-0" />
                  <span>
                    Delivering to{" "}
                    <span className="font-semibold text-foreground">
                      {deliverTo.area ? `${deliverTo.area}, ` : ""}
                      {deliverTo.district || "—"}
                    </span>{" "}
                    · Zone:{" "}
                    <span className="font-semibold text-burgundy">{zone.label}</span>
                  </span>
                </div>
                {deliverTo.district && deliverTo.area && (
                  <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between">
                    <span>
                      Standard shipping{" "}
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/80">
                        ({itemCount} {itemCount === 1 ? "item" : "items"} · BDT {zone.baseFee} + BDT {zone.perItemFee}/extra)
                      </span>
                    </span>
                    <span className="font-semibold text-foreground">
                      {isFreeShipping ? (
                        <>
                          <span className="text-emerald">FREE</span>
                          <span className="ml-1 text-[10px] line-through text-muted-foreground font-normal">
                            BDT {standardFee.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <>BDT {standardFee.toLocaleString()}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </Section>



            {/* Payment */}
            <Section step={sameAsBilling ? 4 : 5} title="Payment method">
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => {
                  const active = selectedGateway === m.id;
                  const Icon = m.icon;
                  return (
                    <label
                      key={m.id}
                      className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                        active ? "border-burgundy bg-blush/10 shadow-card" : "border-border hover:border-burgundy/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={active}
                        onChange={() => setSelectedGateway(m.id)}
                        className="accent-burgundy mt-1"
                      />
                      <div className="h-10 w-10 rounded-lg bg-ivory grid place-items-center text-burgundy shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{m.label}</span>
                          {m.badge && (
                            <span className="text-[10px] uppercase tracking-widest font-bold bg-burgundy text-primary-foreground px-2 py-0.5 rounded-full">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {selectedGateway === "bkash" && (
                <div className="mt-4 p-4 rounded-xl bg-ivory border border-border">
                  <Input label="bKash account number" placeholder="01XXXXXXXXX" required />
                </div>
              )}
            </Section>

            <div className="grid grid-cols-2 gap-3 text-center">
              <TrustBadge icon={ShieldCheck} label="100% Authentic" />
              <TrustBadge icon={Lock} label="Secure Payment" />
            </div>
          </div>

          {/* RIGHT — order summary */}
          <aside className="lg:sticky lg:top-24 self-start space-y-4">
            <LoyaltyPanel subtotal={subtotal} variant="inline" />
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-serif text-xl">Order summary</h2>
                  <span className="text-xs text-muted-foreground">
                    {cart.reduce((s, l) => s + l.qty, 0)} items
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-border max-h-[340px] overflow-y-auto">
                {cart.map((l) => (
                  <li key={l.id} className="p-4 flex gap-3">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-ivory shrink-0">
                      <img
                        src={resolveMediaUrl(l.img) || pSerum}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = pSerum;
                        }}
                        alt={l.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute -top-1 -right-1 h-5 w-5 grid place-items-center rounded-full bg-burgundy text-primary-foreground text-[10px] font-bold">
                        {l.qty}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        {l.brand}
                      </div>
                      <div className="text-sm font-medium line-clamp-2">{l.name}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="inline-flex items-center border border-border rounded-full">
                          <button type="button" aria-label="Decrease" onClick={() => updateQty(l.id, -1)} className="h-7 w-7 grid place-items-center hover:text-burgundy">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold w-6 text-center">{l.qty}</span>
                          <button type="button" aria-label="Increase" onClick={() => updateQty(l.id, 1)} className="h-7 w-7 grid place-items-center hover:text-burgundy">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-sm font-semibold">BDT {(l.price * l.qty).toLocaleString()}</div>
                      </div>
                    </div>
                    <button type="button" aria-label="Remove" onClick={() => removeLine(l.id)} className="text-muted-foreground hover:text-burgundy self-start">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                {cart.length === 0 && (
                  <li className="p-8 text-center text-sm text-muted-foreground">Your bag is empty.</li>
                )}
              </ul>

              <div className="p-5 border-t border-border bg-ivory/60">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Promo code
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-burgundy"
                  />
                  <button type="button" onClick={applyPromo} className="rounded-lg bg-foreground text-background text-xs font-semibold px-4 hover:opacity-90">
                    Apply
                  </button>
                </div>
                {appliedPromo && (
                  <div className="mt-2 text-xs text-emerald font-semibold">
                    {appliedPromo.code} applied — {appliedPromo.pct}% off
                  </div>
                )}
                {promoError && <div className="mt-2 text-xs text-burgundy">{promoError}</div>}
              </div>

              <div className="p-5 border-t border-border space-y-2 text-sm">
                <Row label="Subtotal" value={`BDT ${subtotal.toLocaleString()}`} />
                {productSavings > 0 && (
                  <Row label="Product savings" value={`- BDT ${productSavings.toLocaleString()}`} tone="emerald" />
                )}
                {promoDiscount > 0 && (
                  <Row label={`Promo (${appliedPromo?.code})`} value={`- BDT ${promoDiscount.toLocaleString()}`} tone="emerald" />
                )}
                <Row
                  label="Delivery"
                  value={shippingFee === 0 ? "FREE" : `BDT ${shippingFee.toLocaleString()}`}
                  tone={shippingFee === 0 ? "emerald" : undefined}
                />
                <div className="pt-3 mt-2 border-t border-border flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-serif text-2xl">BDT {total.toLocaleString()}</span>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0 || submitting}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-burgundy text-primary-foreground rounded-full px-6 py-4 text-sm font-semibold hover:shadow-luxury transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  {submitting
                    ? "Placing order…"
                    : `Place order · BDT ${total.toLocaleString()}`}
                </button>
                {submitError && (
                  <div className="mt-3 rounded-lg border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-xs text-burgundy flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
                <p className="mt-3 text-[11px] text-center text-muted-foreground leading-relaxed">
                  By placing your order you agree to our{" "}
                  <a href="#" className="underline hover:text-burgundy">Terms</a> and{" "}
                  <a href="#" className="underline hover:text-burgundy">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </aside>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ───────── helpers ───────── */
function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="h-7 w-7 grid place-items-center rounded-full bg-burgundy text-primary-foreground text-xs font-bold">
          {step}
        </span>
        <h2 className="text-serif text-xl md:text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};
const Input = (() => {
  const C = (
    { label, className = "", error, hint, id, ...rest }: InputProps,
    ref: React.Ref<HTMLInputElement>,
  ) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const errId = `${inputId}-err`;
    const hintId = `${inputId}-hint`;
    return (
      <label htmlFor={inputId} className={`block ${className}`}>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errId : hint ? hintId : undefined}
          {...rest}
          className={`mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 ${
            error
              ? "border-burgundy focus:border-burgundy focus:ring-burgundy/40"
              : "border-border focus:border-burgundy focus:ring-burgundy/30"
          }`}
        />
        {error ? (
          <span id={errId} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-burgundy">
            <AlertCircle className="h-3 w-3" /> {error}
          </span>
        ) : hint ? (
          <span id={hintId} className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>
        ) : null}
      </label>
    );
  };
  return React.forwardRef<HTMLInputElement, InputProps>(C);
})();

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};
const Select = (() => {
  const C = (
    { label, className = "", error, children, id, ...rest }: SelectProps,
    ref: React.Ref<HTMLSelectElement>,
  ) => {
    const autoId = React.useId();
    const selId = id ?? autoId;
    const errId = `${selId}-err`;
    return (
      <label htmlFor={selId} className={`block ${className}`}>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
        <select
          id={selId}
          ref={ref}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errId : undefined}
          {...rest}
          className={`mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 ${
            error
              ? "border-burgundy focus:border-burgundy focus:ring-burgundy/40"
              : "border-border focus:border-burgundy focus:ring-burgundy/30"
          }`}
        >
          {children}
        </select>
        {error && (
          <span id={errId} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-burgundy">
            <AlertCircle className="h-3 w-3" /> {error}
          </span>
        )}
      </label>
    );
  };
  return React.forwardRef<HTMLSelectElement, SelectProps>(C);
})();

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};
const Textarea = (() => {
  const C = (
    { label, className = "", error, hint, id, ...rest }: TextareaProps,
    ref: React.Ref<HTMLTextAreaElement>,
  ) => {
    const autoId = React.useId();
    const taId = id ?? autoId;
    const errId = `${taId}-err`;
    const hintId = `${taId}-hint`;
    return (
      <label htmlFor={taId} className={`block ${className}`}>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
        <textarea
          id={taId}
          ref={ref}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errId : hint ? hintId : undefined}
          {...rest}
          className={`mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 resize-y ${
            error
              ? "border-burgundy focus:border-burgundy focus:ring-burgundy/40"
              : "border-border focus:border-burgundy focus:ring-burgundy/30"
          }`}
        />
        {error ? (
          <span id={errId} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-burgundy">
            <AlertCircle className="h-3 w-3" /> {error}
          </span>
        ) : hint ? (
          <span id={hintId} className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>
        ) : null}
      </label>
    );
  };
  return React.forwardRef<HTMLTextAreaElement, TextareaProps>(C);
})();

function Row({ label, value, tone }: { label: string; value: string; tone?: "emerald" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${tone === "emerald" ? "text-emerald" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col items-center gap-1.5">
      <Icon className="h-5 w-5 text-burgundy" />
      <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
    </div>
  );
}

/* ───────── Address form (District → Area dependent selects) ───────── */
type AddressFormProps = {
  prefix: "billing" | "shipping";
  value: Address;
  onChange: (patch: Partial<Address>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  markTouched: (key: string) => void;
  bindRef: (key: string) => (el: HTMLElement | null) => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

function AddressForm({
  prefix,
  value,
  onChange,
  errors,
  touched,
  markTouched,
  bindRef,
  setErrors,
}: AddressFormProps) {
  const err = (k: string) => (touched[`${prefix}.${k}`] ? errors[`${prefix}.${k}`] || "" : "");
  
  const [districts, setDistricts] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [postalCodes, setPostalCodes] = useState<{ postal_code: string; post_office: string }[]>([]);

  useEffect(() => {
    fetchDistricts().then(res => setDistricts(res || []));
  }, []);

  useEffect(() => {
    if (value.district) {
      fetchThanas(value.district).then(res => setThanas(res || []));
    } else {
      setThanas([]);
    }
  }, [value.district]);

  useEffect(() => {
    if (value.area) {
      fetchPostalCodes(value.area, value.district).then(res => {
        setPostalCodes(res || []);
        if (res && res.length > 0) {
          if (!res.some(p => p.postal_code === value.postal)) {
            onChange({ postal: res[0].postal_code });
          }
        }
      });
    } else {
      setPostalCodes([]);
    }
  }, [value.area, value.district]);

  const validateAndSet = (k: keyof Address, v: string) => {
    let msg = "";
    switch (k) {
      case "fullName": msg = validateName(v, "Full name"); break;
      case "address1": msg = validateAddress1(v); break;
      case "district": msg = validateDistrict(v); break;
      case "area": msg = validateArea(v, value.district); break;
      case "postal": msg = validatePostal(v); break;
    }
    setErrors((prev) => ({ ...prev, [`${prefix}.${k}`]: msg }));
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Input
        ref={bindRef(`${prefix}.fullName`)}
        label="Full name"
        placeholder="সম্পূর্ণ নাম"
        required
        autoComplete={prefix === "billing" ? "billing name" : "shipping name"}
        value={value.fullName}
        onChange={(e) => onChange({ fullName: e.target.value })}
        onBlur={() => { markTouched(`${prefix}.fullName`); validateAndSet("fullName", value.fullName); }}
        error={err("fullName")}
        className="sm:col-span-2"
      />
      <Input
        ref={bindRef(`${prefix}.address1`)}
        label="Full Address"
        required
        className="sm:col-span-2"
        placeholder="বাসা, রোড, এলাকা"
        autoComplete={prefix === "billing" ? "billing address-line1" : "shipping address-line1"}
        value={value.address1}
        onChange={(e) => onChange({ address1: e.target.value })}
        onBlur={() => { markTouched(`${prefix}.address1`); validateAndSet("address1", value.address1); }}
        error={err("address1")}
      />
      <Select
        ref={bindRef(`${prefix}.district`)}
        label="District"
        required
        value={value.district}
        onChange={(e) => {
          onChange({ district: e.target.value, area: "", postal: "" });
          setErrors((prev) => {
            const nxt = { ...prev };
            delete nxt[`${prefix}.area`];
            delete nxt[`${prefix}.postal`];
            return nxt;
          });
        }}
        onBlur={() => { markTouched(`${prefix}.district`); }}
        error={err("district")}
      >
        <option value="">Select a district</option>
        {Array.from(new Set(districts)).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </Select>
      
      <Select
        ref={bindRef(`${prefix}.area`)}
        label="Area / Thana"
        required
        disabled={!value.district}
        value={value.area}
        onChange={(e) => {
          onChange({ area: e.target.value, postal: "" });
          setErrors((prev) => {
            const nxt = { ...prev };
            delete nxt[`${prefix}.postal`];
            return nxt;
          });
        }}
        onBlur={() => { markTouched(`${prefix}.area`); validateAndSet("area", value.area); }}
        error={err("area")}
      >
        <option value="">{value.district ? "Select a thana" : "Select a district first"}</option>
        {thanas.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </Select>

      <Select
        ref={bindRef(`${prefix}.postal`)}
        label="Postal code"
        required
        disabled={!value.area}
        value={value.postal}
        onChange={(e) => {
          onChange({ postal: e.target.value });
          validateAndSet("postal", e.target.value);
        }}
        onBlur={() => { markTouched(`${prefix}.postal`); validateAndSet("postal", value.postal); }}
        error={err("postal")}
        className="sm:col-span-2"
      >
        <option value="">{value.area ? "Select a postal code" : "Select a thana first"}</option>
        {postalCodes.map((p) => (
          <option key={`${p.postal_code}-${p.post_office}`} value={p.postal_code}>
            {p.postal_code}{p.post_office ? ` - ${p.post_office}` : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}

