create or replace function public.insert_analytics_event(
  p_name public.analytics_event_name,
  p_actor_id uuid default null,
  p_listing_id uuid default null,
  p_conversation_id uuid default null,
  p_deal_id uuid default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_events (name, actor_id, listing_id, conversation_id, deal_id, metadata)
  values (p_name, p_actor_id, p_listing_id, p_conversation_id, p_deal_id, p_metadata);
end;
$$;

create or replace function public.track_listing_view(
  p_listing_id uuid,
  p_session_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  insert into public.listing_views (listing_id, viewer_id, session_id)
  values (p_listing_id, v_actor, p_session_id);

  update public.listings
  set views_count = views_count + 1,
      updated_at = now()
  where id = p_listing_id;

  perform public.insert_analytics_event(
    'listing_viewed',
    v_actor,
    p_listing_id,
    null,
    null,
    jsonb_build_object('sessionId', p_session_id)
  );
end;
$$;

create or replace function public.track_analytics_event(
  p_name public.analytics_event_name,
  p_listing_id uuid default null,
  p_conversation_id uuid default null,
  p_deal_id uuid default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_analytics_event(
    p_name,
    auth.uid(),
    p_listing_id,
    p_conversation_id,
    p_deal_id,
    p_metadata
  );
end;
$$;

create or replace function public.on_conversation_insert_analytics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_analytics_event(
    'chat_started',
    new.buyer_id,
    new.listing_id,
    new.id,
    null,
    jsonb_build_object('sellerId', new.seller_id)
  );
  return new;
end;
$$;

drop trigger if exists conversations_insert_analytics on public.conversations;
create trigger conversations_insert_analytics
after insert on public.conversations
for each row execute function public.on_conversation_insert_analytics();

create or replace function public.on_offer_insert_analytics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_analytics_event(
    'offer_sent',
    new.buyer_id,
    new.listing_id,
    new.conversation_id,
    null,
    jsonb_build_object('amount', new.amount)
  );
  return new;
end;
$$;

drop trigger if exists offers_insert_analytics on public.offers;
create trigger offers_insert_analytics
after insert on public.offers
for each row execute function public.on_offer_insert_analytics();

create or replace function public.on_offer_accept_analytics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status and new.status = 'accepted' then
    perform public.insert_analytics_event(
      'offer_accepted',
      new.seller_id,
      new.listing_id,
      new.conversation_id,
      null,
      jsonb_build_object('amount', new.amount)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists offers_accept_analytics on public.offers;
create trigger offers_accept_analytics
after update of status on public.offers
for each row execute function public.on_offer_accept_analytics();

create or replace function public.on_favorite_insert_analytics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_analytics_event(
    'favorite_added',
    new.user_id,
    new.listing_id,
    null,
    null,
    null
  );
  return new;
end;
$$;

drop trigger if exists favorites_insert_analytics on public.favorites;
create trigger favorites_insert_analytics
after insert on public.favorites
for each row execute function public.on_favorite_insert_analytics();

create or replace function public.on_message_insert_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation public.conversations;
  v_recipient uuid;
begin
  if new.sender_id is null or new.type = 'system' then
    return new;
  end if;

  select *
  into v_conversation
  from public.conversations
  where id = new.conversation_id;

  if not found then
    return new;
  end if;

  v_recipient := case
    when new.sender_id = v_conversation.buyer_id then v_conversation.seller_id
    else v_conversation.buyer_id
  end;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    v_recipient,
    'message',
    'Новое сообщение',
    coalesce(nullif(new.text, ''), 'В диалоге появилось вложение.'),
    '/chat/' || new.conversation_id
  );

  return new;
end;
$$;

drop trigger if exists messages_insert_notification on public.messages;
create trigger messages_insert_notification
after insert on public.messages
for each row execute function public.on_message_insert_notification();

create or replace function public.on_listing_update_favorite_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.price_amount is distinct from new.price_amount then
    insert into public.notifications (user_id, type, title, body, href)
    select
      favorites.user_id,
      'favorite_price_changed',
      'Цена изменилась',
      new.title || ': ' || old.price_amount::text || ' → ' || new.price_amount::text || ' ' || new.currency,
      '/listings/' || new.id
    from public.favorites
    where favorites.listing_id = new.id
      and favorites.archived_at is null;

    update public.favorites
    set price_changed_at = now()
    where listing_id = new.id
      and archived_at is null;
  end if;

  if old.status is distinct from new.status and new.status = 'sold' then
    insert into public.notifications (user_id, type, title, body, href)
    select
      favorites.user_id,
      'favorite_sold',
      'Товар из избранного продан',
      new.title || ' больше недоступен.',
      '/listings/' || new.id
    from public.favorites
    where favorites.listing_id = new.id
      and favorites.archived_at is null
      and favorites.user_id <> new.seller_id;

    update public.favorites
    set sold_notified_at = now()
    where listing_id = new.id
      and archived_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists listings_update_favorite_notifications on public.listings;
create trigger listings_update_favorite_notifications
after update of price_amount, status on public.listings
for each row execute function public.on_listing_update_favorite_notifications();

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
  select count(*)::integer into v_completed_deals from public.deals where status = 'completed';

  select round(avg(extract(epoch from c.created_at - l.created_at) / 60)::numeric, 1)
  into v_first_reaction_minutes
  from public.conversations c
  join public.listings l on l.id = c.listing_id
  where c.created_at >= l.created_at;

  select round(
    (
      count(*) filter (where status = 'approved')::numeric
      / nullif(count(*) filter (where status in ('approved', 'needs_changes', 'rejected')), 0)
    ) * 100,
    1
  )
  into v_first_pass_moderation
  from public.moderation_cases;

  return jsonb_build_object(
    'completedDealsCount', v_completed_deals,
    'startedConversationsCount', v_started_conversations,
    'listingViewsCount', v_listing_views,
    'offersCount', v_offers,
    'acceptedOffersCount', v_accepted_offers,
    'viewToChatConversion', coalesce(round((v_started_conversations::numeric / nullif(v_listing_views, 0)) * 100, 1), 0),
    'chatToOfferConversion', coalesce(round((v_offers::numeric / nullif(v_started_conversations, 0)) * 100, 1), 0),
    'offerToDealConversion', coalesce(round((v_completed_deals::numeric / nullif(v_accepted_offers, 0)) * 100, 1), 0),
    'offerAcceptanceRate', coalesce(round((v_accepted_offers::numeric / nullif(v_offers, 0)) * 100, 1), 0),
    'timeToFirstReactionMinutes', coalesce(v_first_reaction_minutes, 0),
    'firstPassModerationApprovalRate', coalesce(v_first_pass_moderation, 0)
  );
end;
$$;
