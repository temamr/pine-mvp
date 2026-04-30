create or replace function public.accept_offer(p_offer_id uuid)
returns public.offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_actor_id uuid := auth.uid();
  v_notify_user_id uuid;
begin
  select *
  into v_offer
  from public.offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if v_actor_id is null then
    raise exception 'not_allowed';
  end if;

  if v_offer.status = 'sent' and v_actor_id <> v_offer.seller_id then
    raise exception 'not_allowed';
  end if;

  if v_offer.status = 'countered' and v_actor_id <> v_offer.buyer_id then
    raise exception 'not_allowed';
  end if;

  if v_offer.status not in ('sent', 'countered') then
    raise exception 'offer_not_open';
  end if;

  update public.offers
  set status = 'declined',
      updated_at = now()
  where conversation_id = v_offer.conversation_id
    and id <> v_offer.id
    and status in ('sent', 'countered');

  update public.offers
  set status = 'accepted',
      updated_at = now()
  where id = v_offer.id
  returning * into v_offer;

  v_notify_user_id := case
    when v_actor_id = v_offer.buyer_id then v_offer.seller_id
    else v_offer.buyer_id
  end;

  update public.listings
  set status = 'reserved',
      updated_at = now()
  where id = v_offer.listing_id;

  update public.conversations
  set status = 'deal_started',
      last_message_at = now()
  where id = v_offer.conversation_id;

  insert into public.messages (conversation_id, sender_id, type, text, status)
  values (v_offer.conversation_id, null, 'system', 'Оффер принят. Товар ушел в резерв.', 'sent');

  insert into public.notifications (user_id, type, title, body, href)
  values (
    v_notify_user_id,
    'offer_response',
    'Оффер принят',
    'По предложению появился новый статус в диалоге, товар зарезервирован.',
    '/chat/' || v_offer.conversation_id
  );

  return v_offer;
end;
$$;

grant execute on function public.accept_offer(uuid) to authenticated;
