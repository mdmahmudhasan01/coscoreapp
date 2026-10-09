import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const getLocalUser = (): User | null => {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem("lookzene_user_session");
        if (raw) return JSON.parse(raw) as User;
      } catch (e) {}
      return null;
    };

    const localUser = getLocalUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setState({ session, user: session.user, loading: false });
      } else {
        const u = getLocalUser();
        setState({ session: null, user: u, loading: false });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data?.session?.user) {
        setState({
          session: data.session,
          user: data.session.user,
          loading: false,
        });
      } else {
        setState({ session: null, user: localUser, loading: false });
      }
    }).catch(() => {
      if (mounted) setState({ session: null, user: localUser, loading: false });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Returns the signed-in customer's Glow Rewards points balance (0 for guests). */
export function useRewardsBalance(userId: string | null | undefined): {
  balance: number;
  refresh: () => void;
} {
  const [balance, setBalance] = useState(0);

  const load = useCallback(async () => {
    if (!userId) {
      setBalance(0);
      return;
    }
    const { data, error } = await supabase.rpc("get_my_rewards_balance");
    if (!error && typeof data === "number") setBalance(data);
    else if (!error && data != null) setBalance(Number(data) || 0);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { balance, refresh: load };
}
