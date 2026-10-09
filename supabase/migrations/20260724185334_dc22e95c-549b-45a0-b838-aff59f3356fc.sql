
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  eligible_amount INTEGER NOT NULL CHECK (eligible_amount >= 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','failed','refunded')),
  points_awarded BOOLEAN NOT NULL DEFAULT false,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Only owner can read their orders
CREATE POLICY "orders_own_select" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Signed-in users can create orders linked to themselves
CREATE POLICY "orders_auth_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'confirmed');
-- Guests can create orders (user_id NULL only)
CREATE POLICY "orders_guest_insert" ON public.orders FOR INSERT TO anon WITH CHECK (user_id IS NULL AND status = 'confirmed');

-- REWARD TRANSACTIONS (append-only, written by trigger only)
CREATE TABLE public.reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('earn','redeem','adjust','refund')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, kind)
);
GRANT SELECT ON public.reward_transactions TO authenticated;
GRANT ALL ON public.reward_transactions TO service_role;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_own_select" ON public.reward_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policies → only service_role / SECURITY DEFINER trigger can write.

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Award points when a linked order reaches confirmed status
CREATE OR REPLACE FUNCTION public.award_order_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pts INTEGER;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status <> 'confirmed' THEN RETURN NEW; END IF;
  IF NEW.points_awarded THEN RETURN NEW; END IF;

  pts := FLOOR(NEW.eligible_amount / 150.0)::INTEGER;
  IF pts > 0 THEN
    INSERT INTO public.reward_transactions (user_id, order_id, points, kind)
    VALUES (NEW.user_id, NEW.id, pts, 'earn')
    ON CONFLICT (order_id, kind) DO NOTHING;
  END IF;
  NEW.points_awarded := true;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_order_award_points
  BEFORE INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.award_order_points();

-- Handle refund / cancel → reverse points
CREATE OR REPLACE FUNCTION public.reverse_order_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE original INTEGER;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('cancelled','refunded','failed') THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT points INTO original FROM public.reward_transactions
    WHERE order_id = NEW.id AND kind = 'earn';
  IF original IS NOT NULL AND original > 0 THEN
    INSERT INTO public.reward_transactions (user_id, order_id, points, kind)
    VALUES (NEW.user_id, NEW.id, -original, 'refund')
    ON CONFLICT (order_id, kind) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_order_reverse_points
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.reverse_order_points();

-- Convenience: user points balance
CREATE OR REPLACE FUNCTION public.get_my_rewards_balance()
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.reward_transactions
  WHERE user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_rewards_balance() TO authenticated;
