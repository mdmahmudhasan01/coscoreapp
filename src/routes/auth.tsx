import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lookzene" },
      { name: "description", content: "Sign in to your Lookzene account to track orders and earn Glow Rewards." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Sign in — Lookzene" },
      { property: "og:description", content: "Sign in to your Lookzene account to earn Glow Rewards." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account/rewards" });
  }, [user, navigate]);

  const handleSendOtp = async () => {
    if (!phone) {
      setErr("Phone number is required for OTP verification.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const res = await sendOtp(phone);
      if (res && res.status === "success") {
        setOtpSent(true);
      } else {
        setErr(res?.message || "Failed to send OTP SMS.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setErr("Please enter the 6-digit OTP code.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const res = await verifyOtp(phone, otp);
      if (res && res.status === "success") {
        setOtpVerified(true);
        // Complete registration
        await completeRegistration();
      } else {
        setErr(res?.message || "Incorrect OTP code.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "OTP Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const completeRegistration = async () => {
    const endpoint = "https://cp.lookzene.com/api/method/coscore.api.auth.register_customer";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, phone }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Registration failed");
    }

    const json = await res.json();
    const resData = json.message || json;
    if (resData.status === "error") throw new Error(resData.message || "Failed");

    const userObj = resData.user || {
      id: email,
      email,
      user_metadata: { full_name: fullName, phone }
    };

    localStorage.setItem("lookzene_user_session", JSON.stringify(userObj));
    window.location.href = "/account/rewards";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (mode === "signup") {
      if (!otpSent) {
        await handleSendOtp();
        return;
      }
      if (!otpVerified) {
        await handleVerifyOtp();
        return;
      }
    }

    setBusy(true);
    try {
      // Sign in for existing customer
      const endpoint = "https://cp.lookzene.com/api/method/coscore.api.auth.login_customer";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Authentication failed");
      }

      const json = await res.json();
      const resData = json.message || json;
      if (resData.status === "error") throw new Error(resData.message || "Failed");

      const userObj = resData.user || {
        id: email,
        email,
        user_metadata: { full_name: fullName, phone }
      };

      localStorage.setItem("lookzene_user_session", JSON.stringify(userObj));
      window.location.href = "/account/rewards";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <SiteHeader />
      <main className="container-luxe py-12 md:py-20">
        <div className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
          <h1 className="text-serif text-3xl md:text-4xl">
            {mode === "signin" ? "Welcome back" : "Join Lookzene"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to view your Glow Rewards and orders."
              : "Create an account to start earning Glow Rewards."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <Field label="Full name" value={fullName} onChange={setFullName} required />
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" />
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required icon={<Mail className="h-4 w-4" />} />
            <Field label="Password" type="password" value={password} onChange={setPassword} required icon={<Lock className="h-4 w-4" />} />

            {err && (
              <div className="flex items-start gap-2 rounded-lg bg-burgundy/5 border border-burgundy/30 px-3 py-2 text-xs text-burgundy">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-burgundy text-primary-foreground rounded-full px-6 py-3.5 text-sm font-semibold hover:shadow-luxury transition disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-xs text-muted-foreground hover:text-burgundy"
          >
            {mode === "signin"
              ? "New to Lookzene? Create an account →"
              : "Already have an account? Sign in →"}
          </button>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-burgundy">
              ← Continue shopping
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
        {label}
      </span>
      <div className="relative mt-1">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-border bg-background py-2.5 text-sm focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy/30 ${
            icon ? "pl-9 pr-3" : "px-3"
          }`}
        />
      </div>
    </label>
  );
}
