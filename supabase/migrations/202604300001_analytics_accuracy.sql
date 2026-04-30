create or replace function public.analytics_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_views integer;
  v_started_conversations integer;
  v_offers integer;
  v_accepted_offers integer;
  v_created_deals integer;
  v_completed_deals integer;
  v_first_reaction_minutes numeric;
  v_first_pass_moderation numeric;
begin
  if not public.is_trust_staff(auth.uid()) then
    raise exception 'not_allowed';
  end if;

  select count(*)::integer into v_listing_views from public.listing_views;
  select count(*)::integer into v_started_conversations from public.conversations;
  select count(*)::integer into v_offers from public.offers;
  select count(*)::integer into v_accepted_offers from public.offers where status = 'accepted';
  select count(*)::integer into v_created_deals from public.deals;
  select count(*)::integer into v_completed_deals from public.deals where status = 'completed';

  with first_reactions as (
    select
      l.id,
      min(c.created_at) as first_conversation_at,
      l.created_at as listing_created_at
    from public.listings l
    join public.conversations c on c.listing_id = l.id
    group by l.id, l.created_at
  )
  select round(avg(extract(epoch from first_conversation_at - listing_created_at) / 60)::numeric, 1)
  into v_first_reaction_minutes
  from first_reactions
  where first_conversation_at >= listing_created_at;

  with ranked_cases as (
    select
      listing_id,
      status,
      row_number() over (partition by listing_id order by created_at asc) as rn
    from public.moderation_cases
    where status in ('approved', 'needs_changes', 'rejected')
  )
  select round(
    (
      count(*) filter (where status = 'approved')::numeric
      / nullif(count(*), 0)
    ) * 100,
    1
  )
  into v_first_pass_moderation
  from ranked_cases
  where rn = 1;

  return jsonb_build_object(
    'completedDealsCount', v_completed_deals,
    'startedConversationsCount', v_started_conversations,
    'listingViewsCount', v_listing_views,
    'offersCount', v_offers,
    'acceptedOffersCount', v_accepted_offers,
    'viewToChatConversion', coalesce(round((v_started_conversations::numeric / nullif(v_listing_views, 0)) * 100, 1), 0),
    'chatToOfferConversion', coalesce(round((v_offers::numeric / nullif(v_started_conversations, 0)) * 100, 1), 0),
    'offerToDealConversion', coalesce(round((v_created_deals::numeric / nullif(v_offers, 0)) * 100, 1), 0),
    'offerAcceptanceRate', coalesce(round((v_accepted_offers::numeric / nullif(v_offers, 0)) * 100, 1), 0),
    'timeToFirstReactionMinutes', coalesce(v_first_reaction_minutes, 0),
    'firstPassModerationApprovalRate', coalesce(v_first_pass_moderation, 0)
  );
end;
$$;
