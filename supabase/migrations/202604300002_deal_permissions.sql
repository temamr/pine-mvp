create or replace function public.accept_offer_and_create_deal(
  p_offer_id uuid,
  p_type public.deal_type default 'courier'
)
returns public.offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
begin
  select * into v_offer
  from public.accept_offer(p_offer_id);

  perform public.create_safe_deal(v_offer.conversation_id, p_type);

  return v_offer;
end;
$$;

create or replace function public.mark_deal_shipped_by_seller(
  p_conversation_id uuid
)
returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deal public.deals;
begin
  select *
  into v_deal
  from public.deals
  where conversation_id = p_conversation_id
  order by created_at desc
  limit 1;

  if v_deal.id is null then
    raise exception 'deal_not_found';
  end if;

  if v_user_id is distinct from v_deal.seller_id then
    raise exception 'seller_only';
  end if;

  if v_deal.status in ('completed', 'cancelled') then
    return v_deal;
  end if;

  select *
  into v_deal
  from public.advance_deal(v_deal.id, 'in_transit');

  return v_deal;
end;
$$;

create or replace function public.confirm_deal_completed_by_buyer(
  p_conversation_id uuid
)
returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deal public.deals;
begin
  select *
  into v_deal
  from public.deals
  where conversation_id = p_conversation_id
  order by created_at desc
  limit 1;

  if v_deal.id is null then
    raise exception 'deal_not_found';
  end if;

  if v_user_id is distinct from v_deal.buyer_id then
    raise exception 'buyer_only';
  end if;

  if v_deal.status in ('completed', 'cancelled') then
    return v_deal;
  end if;

  select *
  into v_deal
  from public.advance_deal(v_deal.id, 'completed');

  return v_deal;
end;
$$;

grant execute on function public.accept_offer_and_create_deal(uuid, public.deal_type) to authenticated;
grant execute on function public.mark_deal_shipped_by_seller(uuid) to authenticated;
grant execute on function public.confirm_deal_completed_by_buyer(uuid) to authenticated;
