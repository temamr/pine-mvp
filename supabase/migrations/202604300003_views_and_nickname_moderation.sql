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
  v_listing public.listings;
  v_already_seen boolean := false;
begin
  select *
  into v_listing
  from public.listings
  where id = p_listing_id;

  if v_listing.id is null then
    return;
  end if;

  if v_listing.status not in ('published', 'reserved', 'sold') then
    return;
  end if;

  if v_actor is not null and v_actor = v_listing.seller_id then
    return;
  end if;

  if v_actor is not null then
    select exists(
      select 1
      from public.listing_views
      where listing_id = p_listing_id
        and viewer_id = v_actor
    )
    into v_already_seen;
  elsif p_session_id is not null then
    select exists(
      select 1
      from public.listing_views
      where listing_id = p_listing_id
        and session_id = p_session_id
    )
    into v_already_seen;
  end if;

  if v_already_seen then
    return;
  end if;

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

create or replace function public.validate_profile_display_name()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_normalized text;
  v_bad_words text[] := array[
    'admin',
    'administrator',
    'moderator',
    'support',
    'supabase',
    'vercel',
    'pine support',
    'pine admin',
    'pine moderator',
    'ебан',
    'ебл',
    'хуй',
    'пизд',
    'бляд',
    'шлюх',
    'гандон',
    'пидор',
    'нигер',
    'nigger',
    'nigga',
    'faggot',
    'retard',
    'whore',
    'slut',
    'bitch',
    'cunt',
    'motherfucker',
    'fuck',
    'shit',
    'suicide',
    'kill yourself',
    'terror',
    'isis',
    'hitler',
    'nazi'
  ];
  v_item text;
begin
  if new.display_name is null or length(trim(new.display_name)) < 2 then
    raise exception 'invalid_display_name';
  end if;

  v_normalized := lower(regexp_replace(new.display_name, '[^a-zA-Zа-яА-Я0-9]+', ' ', 'g'));
  v_normalized := regexp_replace(v_normalized, '\s+', ' ', 'g');
  v_normalized := trim(v_normalized);

  foreach v_item in array v_bad_words loop
    if position(v_item in v_normalized) > 0 then
      raise exception 'display_name_blocked';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists profiles_validate_display_name on public.profiles;
create trigger profiles_validate_display_name
before insert or update of display_name on public.profiles
for each row execute function public.validate_profile_display_name();
