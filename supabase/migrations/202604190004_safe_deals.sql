create or replace function public.deal_timeline_event(
  p_status public.deal_status,
  p_actor_id uuid
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', gen_random_uuid()::text,
    'status', p_status::text,
    'label', case p_status
      when 'created' then 'Safe deal создана'
      when 'payment_pending' then 'Ожидается подтверждение оплаты'
      when 'reserved' then 'Товар в резерве'
      when 'handoff_planned' then 'Передача запланирована'
      when 'in_transit' then 'Доставка в процессе'
      when 'inspection' then 'Проверка товара'
      when 'completed' then 'Сделка завершена'
      when 'cancelled' then 'Сделка отменена'
    end,
    'description', case p_status
      when 'created' then 'Покупатель и продавец перешли к безопасной сделке Pine.'
      when 'payment_pending' then 'Pine фиксирует намерение оплаты без реального платежного провайдера в MVP.'
      when 'reserved' then 'Объявление удерживается за покупателем.'
      when 'handoff_planned' then 'Стороны согласовали следующий шаг передачи.'
      when 'in_transit' then 'Курьерский или проверочный сценарий находится в движении.'
      when 'inspection' then 'Проверяется состояние товара перед финальным подтверждением.'
      when 'completed' then 'Сделка закрыта как успешная.'
      when 'cancelled' then 'Lifecycle остановлен до завершения.'
    end,
    'actorId', p_actor_id,
    'createdAt', now()
  );
$$;

create or replace function public.create_safe_deal(
  p_conversation_id uuid,
  p_type public.deal_type
)
returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation public.conversations;
  v_listing public.listings;
  v_offer public.offers;
  v_deal public.deals;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'auth_required';
  end if;

  select *
  into v_conversation
  from public.conversations
  where id = p_conversation_id
  for update;

  if not found then
    raise exception 'conversation_not_found';
  end if;

  if v_actor not in (v_conversation.buyer_id, v_conversation.seller_id) then
    raise exception 'not_allowed';
  end if;

  select *
  into v_deal
  from public.deals
  where conversation_id = p_conversation_id
    and status <> 'cancelled'
  order by created_at desc
  limit 1;

  if found then
    return v_deal;
  end if;

  select *
  into v_listing
  from public.listings
  where id = v_conversation.listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  select *
  into v_offer
  from public.offers
  where conversation_id = p_conversation_id
    and status = 'accepted'
  order by updated_at desc
  limit 1;

  if not found then
    raise exception 'accepted_offer_required';
  end if;

  insert into public.deals (
    listing_id,
    conversation_id,
    buyer_id,
    seller_id,
    accepted_offer_id,
    type,
    status,
    amount,
    currency,
    timeline
  )
  values (
    v_conversation.listing_id,
    v_conversation.id,
    v_conversation.buyer_id,
    v_conversation.seller_id,
    v_offer.id,
    p_type,
    'created',
    v_offer.amount,
    v_offer.currency,
    jsonb_build_array(public.deal_timeline_event('created', v_actor))
  )
  returning * into v_deal;

  update public.listings
  set status = 'reserved',
      updated_at = now()
  where id = v_conversation.listing_id;

  update public.conversations
  set status = 'deal_started',
      last_message_at = now()
  where id = p_conversation_id;

  insert into public.messages (conversation_id, sender_id, type, text, status)
  values (
    p_conversation_id,
    null,
    'system',
    'Safe deal создана. Тип: ' || p_type::text || '.',
    'sent'
  );

  insert into public.notifications (user_id, type, title, body, href)
  values
    (v_conversation.buyer_id, 'deal_status', 'Safe deal создана', 'Сделка появилась в вашем кабинете Pine.', '/deals'),
    (v_conversation.seller_id, 'deal_status', 'Safe deal создана', 'Сделка появилась в вашем кабинете Pine.', '/deals');

  insert into public.analytics_events (name, actor_id, listing_id, conversation_id, deal_id, metadata)
  values (
    'deal_created',
    v_actor,
    v_deal.listing_id,
    v_deal.conversation_id,
    v_deal.id,
    jsonb_build_object('type', p_type::text, 'amount', v_deal.amount)
  );

  return v_deal;
end;
$$;

create or replace function public.advance_deal(
  p_deal_id uuid,
  p_status public.deal_status
)
returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deal public.deals;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'auth_required';
  end if;

  select *
  into v_deal
  from public.deals
  where id = p_deal_id
  for update;

  if not found then
    raise exception 'deal_not_found';
  end if;

  if v_actor not in (v_deal.buyer_id, v_deal.seller_id) and not public.is_trust_staff(v_actor) then
    raise exception 'not_allowed';
  end if;

  update public.deals
  set status = p_status,
      timeline = coalesce(timeline, '[]'::jsonb) || jsonb_build_array(public.deal_timeline_event(p_status, v_actor)),
      updated_at = now()
  where id = p_deal_id
  returning * into v_deal;

  if p_status = 'completed' then
    update public.listings
    set status = 'sold',
        updated_at = now()
    where id = v_deal.listing_id;

    update public.conversations
    set status = 'completed',
        last_message_at = now()
    where id = v_deal.conversation_id;

    insert into public.analytics_events (name, actor_id, listing_id, conversation_id, deal_id, metadata)
    values (
      'deal_completed',
      v_actor,
      v_deal.listing_id,
      v_deal.conversation_id,
      v_deal.id,
      jsonb_build_object('amount', v_deal.amount, 'type', v_deal.type::text)
    );
  elsif p_status = 'cancelled' then
    update public.conversations
    set status = 'active',
        last_message_at = now()
    where id = v_deal.conversation_id;
  end if;

  insert into public.messages (conversation_id, sender_id, type, text, status)
  values (
    v_deal.conversation_id,
    null,
    'system',
    'Статус safe deal: ' || p_status::text || '.',
    'sent'
  );

  insert into public.notifications (user_id, type, title, body, href)
  values
    (v_deal.buyer_id, 'deal_status', 'Статус сделки обновлен', p_status::text, '/deals'),
    (v_deal.seller_id, 'deal_status', 'Статус сделки обновлен', p_status::text, '/deals');

  return v_deal;
end;
$$;
