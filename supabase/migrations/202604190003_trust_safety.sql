alter table public.profiles
add column if not exists blocked_at timestamptz,
add column if not exists blocked_reason text;

create or replace function public.is_trust_staff(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role in ('moderator', 'admin')
  );
$$;

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'admin'
  );
$$;

create policy "Trust staff can read all listings" on public.listings
for select using (public.is_trust_staff());

create policy "Trust staff can update listings" on public.listings
for update using (public.is_trust_staff()) with check (public.is_trust_staff());

create policy "Trust staff can read moderation cases" on public.moderation_cases
for select using (public.is_trust_staff());

create policy "Trust staff can update moderation cases" on public.moderation_cases
for update using (public.is_trust_staff()) with check (public.is_trust_staff());

create policy "Trust staff can read complaints" on public.complaints
for select using (public.is_trust_staff());

create policy "Trust staff can update complaints" on public.complaints
for update using (public.is_trust_staff()) with check (public.is_trust_staff());

create policy "Trust staff can read deals" on public.deals
for select using (public.is_trust_staff());

create unique index if not exists reviews_unique_author_deal_recipient_idx
on public.reviews(deal_id, author_id, recipient_id);

create or replace function public.refresh_profile_review_stats(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set rating = coalesce((
        select round(avg(rating)::numeric, 1)
        from public.reviews
        where recipient_id = p_profile_id
      ), 0),
      reviews_count = (
        select count(*)::integer
        from public.reviews
        where recipient_id = p_profile_id
      ),
      updated_at = now()
  where id = p_profile_id;
end;
$$;

create or replace function public.refresh_profile_completed_deals(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set completed_deals_count = (
        select count(*)::integer
        from public.deals
        where status = 'completed'
          and (buyer_id = p_profile_id or seller_id = p_profile_id)
      ),
      updated_at = now()
  where id = p_profile_id;
end;
$$;

create or replace function public.on_review_insert_refresh_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_profile_review_stats(old.recipient_id);
    return old;
  end if;

  perform public.refresh_profile_review_stats(new.recipient_id);

  if tg_op = 'UPDATE' and old.recipient_id <> new.recipient_id then
    perform public.refresh_profile_review_stats(old.recipient_id);
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_refresh_profile_stats on public.reviews;
create trigger reviews_refresh_profile_stats
after insert or update or delete on public.reviews
for each row execute function public.on_review_insert_refresh_profile();

create or replace function public.on_deal_status_refresh_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_profile_completed_deals(new.buyer_id);
  perform public.refresh_profile_completed_deals(new.seller_id);
  return new;
end;
$$;

drop trigger if exists deals_refresh_completed_counts on public.deals;
create trigger deals_refresh_completed_counts
after insert or update of status on public.deals
for each row execute function public.on_deal_status_refresh_profiles();

create or replace function public.moderate_listing(
  p_listing_id uuid,
  p_decision public.moderation_status,
  p_note text default null
)
returns public.moderation_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings;
  v_case public.moderation_cases;
  v_note text;
  v_listing_status public.listing_status;
begin
  if not public.is_trust_staff(auth.uid()) then
    raise exception 'not_allowed';
  end if;

  if p_decision not in ('approved', 'needs_changes', 'rejected') then
    raise exception 'invalid_moderation_decision';
  end if;

  select *
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  v_note := coalesce(
    nullif(trim(p_note), ''),
    case
      when p_decision = 'approved' then 'Объявление опубликовано в каталоге.'
      when p_decision = 'needs_changes' then 'Нужны правки перед публикацией.'
      else 'Объявление отклонено и скрыто из публикации.'
    end
  );

  v_listing_status := case
    when p_decision = 'approved' then 'published'::public.listing_status
    when p_decision = 'needs_changes' then 'needs_changes'::public.listing_status
    else 'rejected'::public.listing_status
  end;

  update public.listings
  set status = v_listing_status,
      moderation_note = v_note,
      updated_at = now()
  where id = p_listing_id
  returning * into v_listing;

  select *
  into v_case
  from public.moderation_cases
  where listing_id = p_listing_id
  order by created_at desc
  limit 1
  for update;

  if found then
    update public.moderation_cases
    set status = p_decision,
        moderator_id = auth.uid(),
        note = v_note,
        updated_at = now()
    where id = v_case.id
    returning * into v_case;
  else
    insert into public.moderation_cases (listing_id, status, moderator_id, note)
    values (p_listing_id, p_decision, auth.uid(), v_note)
    returning * into v_case;
  end if;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    v_listing.seller_id,
    'moderation',
    case when p_decision = 'approved' then 'Объявление опубликовано' else 'Результат модерации' end,
    v_listing.title || ': ' || v_note,
    '/listings/' || v_listing.id
  );

  if p_decision in ('approved', 'rejected') then
    insert into public.analytics_events (name, actor_id, listing_id, metadata)
    values (
      case
        when p_decision = 'approved' then 'moderation_approved'::public.analytics_event_name
        else 'moderation_rejected'::public.analytics_event_name
      end,
      auth.uid(),
      v_listing.id,
      jsonb_build_object('note', v_note)
    );
  end if;

  return v_case;
end;
$$;

create or replace function public.resolve_complaint(
  p_complaint_id uuid,
  p_status public.complaint_status
)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_complaint public.complaints;
begin
  if not public.is_trust_staff(auth.uid()) then
    raise exception 'not_allowed';
  end if;

  if p_status not in ('reviewing', 'resolved', 'dismissed') then
    raise exception 'invalid_complaint_status';
  end if;

  update public.complaints
  set status = p_status,
      updated_at = now()
  where id = p_complaint_id
  returning * into v_complaint;

  if not found then
    raise exception 'complaint_not_found';
  end if;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    v_complaint.reporter_id,
    'moderation',
    'Статус жалобы обновлен',
    'Trust & Safety: ' || p_status::text,
    '/moderation'
  );

  return v_complaint;
end;
$$;

create or replace function public.block_profile(
  p_profile_id uuid,
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_required';
  end if;

  if p_profile_id = auth.uid() then
    raise exception 'cannot_block_self';
  end if;

  update public.profiles
  set blocked_at = now(),
      blocked_reason = nullif(trim(p_reason), ''),
      updated_at = now()
  where id = p_profile_id
  returning * into v_profile;

  if not found then
    raise exception 'profile_not_found';
  end if;

  return v_profile;
end;
$$;

create or replace function public.verify_profile(
  p_profile_id uuid,
  p_status public.verification_status
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if not public.is_trust_staff(auth.uid()) then
    raise exception 'not_allowed';
  end if;

  update public.profiles
  set verification_status = p_status,
      updated_at = now()
  where id = p_profile_id
  returning * into v_profile;

  if not found then
    raise exception 'profile_not_found';
  end if;

  return v_profile;
end;
$$;
