create or replace function public.create_counter_offer(
  p_offer_id uuid,
  p_amount numeric,
  p_message text default null
)
returns public.offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_source public.offers;
  v_offer public.offers;
begin
  select *
  into v_source
  from public.offers
  where id = p_offer_id
  for update;

  if v_source.id is null then
    raise exception 'offer_not_found';
  end if;

  if v_source.seller_id is distinct from v_user_id then
    raise exception 'seller_only';
  end if;

  if v_source.status <> 'sent' then
    raise exception 'offer_not_open';
  end if;

  update public.offers
  set status = 'declined',
      updated_at = now()
  where conversation_id = v_source.conversation_id
    and status in ('sent', 'countered');

  insert into public.offers (
    conversation_id,
    listing_id,
    buyer_id,
    seller_id,
    amount,
    currency,
    status,
    message
  )
  values (
    v_source.conversation_id,
    v_source.listing_id,
    v_source.buyer_id,
    v_source.seller_id,
    p_amount,
    'RUB',
    'countered',
    p_message
  )
  returning * into v_offer;

  insert into public.messages (
    conversation_id,
    sender_id,
    type,
    text,
    status
  )
  values (
    v_source.conversation_id,
    v_user_id,
    'system',
    format('Продавец отправил контр-оффер на %s руб.', p_amount::integer),
    'sent'
  );

  update public.conversations
  set last_message_at = now()
  where id = v_source.conversation_id;

  return v_offer;
end;
$$;

grant execute on function public.create_counter_offer(uuid, numeric, text) to authenticated;
