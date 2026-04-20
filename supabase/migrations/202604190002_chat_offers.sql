create or replace function public.accept_offer(p_offer_id uuid)
returns public.offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
begin
  select *
  into v_offer
  from public.offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if auth.uid() is null or auth.uid() <> v_offer.seller_id then
    raise exception 'not_allowed';
  end if;

  update public.offers
  set status = 'declined',
      updated_at = now()
  where conversation_id = v_offer.conversation_id
    and id <> v_offer.id
    and status = 'sent';

  update public.offers
  set status = 'accepted',
      updated_at = now()
  where id = v_offer.id
  returning * into v_offer;

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
    v_offer.buyer_id,
    'offer_response',
    'Оффер принят',
    'Продавец принял ваше предложение, товар зарезервирован.',
    '/chat/' || v_offer.conversation_id
  );

  return v_offer;
end;
$$;

create or replace function public.decline_offer(p_offer_id uuid)
returns public.offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
begin
  select *
  into v_offer
  from public.offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if auth.uid() is null or auth.uid() not in (v_offer.buyer_id, v_offer.seller_id) then
    raise exception 'not_allowed';
  end if;

  update public.offers
  set status = 'declined',
      updated_at = now()
  where id = v_offer.id
  returning * into v_offer;

  update public.conversations
  set last_message_at = now()
  where id = v_offer.conversation_id;

  insert into public.messages (conversation_id, sender_id, type, text, status)
  values (v_offer.conversation_id, null, 'system', 'Оффер отклонен.', 'sent');

  insert into public.notifications (user_id, type, title, body, href)
  values (
    case when auth.uid() = v_offer.seller_id then v_offer.buyer_id else v_offer.seller_id end,
    'offer_response',
    'Оффер отклонен',
    'По предложению появился ответ в диалоге.',
    '/chat/' || v_offer.conversation_id
  );

  return v_offer;
end;
$$;

create policy "Participants can create system messages through RPC" on public.messages
for insert with check (
  sender_id is null
  and type = 'system'
  and exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
  )
);
