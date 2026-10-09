
-- Trigger-only functions: no one should call them directly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_order_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_order_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Balance function: convert to SECURITY INVOKER (RLS already restricts to own rows).
CREATE OR REPLACE FUNCTION public.get_my_rewards_balance()
RETURNS INTEGER LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.reward_transactions
  WHERE user_id = auth.uid();
$$;
