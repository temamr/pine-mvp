alter table public.listings alter column currency set default 'AED';
alter table public.offers alter column currency set default 'AED';
alter table public.deals alter column currency set default 'AED';

update public.listings
set currency = 'AED',
    location = jsonb_set(
      jsonb_set(
        jsonb_set(location, '{country}', '"United Arab Emirates"', true),
        '{region}',
        '"Dubai"',
        true
      ),
      '{label}',
      coalesce(location->'label', '"Dubai"'),
      true
    ),
    updated_at = now()
where currency <> 'AED'
   or location->>'country' is distinct from 'United Arab Emirates'
   or location->>'region' is distinct from 'Dubai';

update public.offers
set currency = 'AED'
where currency <> 'AED';

update public.deals
set currency = 'AED'
where currency <> 'AED';

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
    'AED',
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
    format('Seller sent a counter-offer for %s AED.', p_amount::integer),
    'sent'
  );

  update public.conversations
  set last_message_at = now()
  where id = v_source.conversation_id;

  return v_offer;
end;
$$;

grant execute on function public.create_counter_offer(uuid, numeric, text) to authenticated;

drop policy if exists "Trust staff can read all listing images" on public.listing_images;
create policy "Trust staff can read all listing images" on public.listing_images
for select using (public.is_trust_staff(auth.uid()));

drop policy if exists "Trust staff can manage listing images" on public.listing_images;
create policy "Trust staff can manage listing images" on public.listing_images
for all
using (public.is_trust_staff(auth.uid()))
with check (public.is_trust_staff(auth.uid()));

drop policy if exists "Trust staff can create moderation cases" on public.moderation_cases;
create policy "Trust staff can create moderation cases" on public.moderation_cases
for insert with check (public.is_trust_staff(auth.uid()));
