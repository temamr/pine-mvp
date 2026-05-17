create table if not exists public.hidden_conversations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

alter table public.hidden_conversations enable row level security;

drop policy if exists "Users manage own hidden conversations" on public.hidden_conversations;
create policy "Users manage own hidden conversations" on public.hidden_conversations
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

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
  where id = p_offer_id;

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
  set status = 'countered',
      updated_at = now()
  where id = p_offer_id;

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
    format('Продавец отправил контр-оффер на %s AED.', p_amount::integer),
    'sent'
  );

  update public.conversations
  set last_message_at = now()
  where id = v_source.conversation_id;

  return v_offer;
end;
$$;

create or replace function public.hide_conversation(
  p_conversation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations;
  v_has_active_deal boolean := false;
begin
  select *
  into v_conversation
  from public.conversations
  where id = p_conversation_id;

  if v_conversation.id is null then
    raise exception 'conversation_not_found';
  end if;

  if v_conversation.buyer_id is distinct from v_user_id and v_conversation.seller_id is distinct from v_user_id then
    raise exception 'conversation_forbidden';
  end if;

  select exists(
    select 1
    from public.deals
    where conversation_id = p_conversation_id
      and status not in ('completed', 'cancelled')
  )
  into v_has_active_deal;

  if v_has_active_deal then
    raise exception 'active_deal_exists';
  end if;

  insert into public.hidden_conversations (user_id, conversation_id)
  values (v_user_id, p_conversation_id)
  on conflict (user_id, conversation_id) do nothing;
end;
$$;

grant execute on function public.create_counter_offer(uuid, numeric, text) to authenticated;
grant execute on function public.hide_conversation(uuid) to authenticated;
