-- Create RPC function to get user push subscription (bypasses RLS)
-- Run this in Supabase SQL editor

CREATE OR REPLACE FUNCTION public.get_user_push_subscription(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Get the most recent active subscription for the user
  SELECT *
  INTO subscription_record
  FROM public.push_subscriptions
  WHERE user_id = target_user_id
    AND active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Return as JSON
  IF subscription_record IS NOT NULL THEN
    RETURN row_to_json(subscription_record);
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Grant access to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.get_user_push_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_push_subscription(UUID) TO service_role;
