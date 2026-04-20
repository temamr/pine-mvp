create extension if not exists pgcrypto;

create type public.user_role as enum ('buyer', 'seller', 'moderator', 'admin');
create type public.verification_status as enum ('none', 'phone', 'document', 'trusted');
create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair', 'for_parts');
create type public.listing_status as enum ('draft', 'pending', 'published', 'needs_changes', 'rejected', 'reserved', 'sold');
create type public.conversation_status as enum ('active', 'archived', 'deal_started', 'completed');
create type public.message_type as enum ('text', 'attachment', 'system');
create type public.message_status as enum ('sending', 'sent', 'delivered', 'read', 'failed');
create type public.offer_status as enum ('draft', 'sent', 'accepted', 'declined', 'countered', 'expired');
create type public.deal_type as enum ('meetup', 'courier', 'pine_check');
create type public.deal_status as enum ('created', 'payment_pending', 'reserved', 'handoff_planned', 'in_transit', 'inspection', 'completed', 'cancelled');
create type public.moderation_status as enum ('open', 'approved', 'needs_changes', 'rejected');
create type public.complaint_target as enum ('listing', 'user', 'conversation');
create type public.complaint_status as enum ('submitted', 'reviewing', 'resolved', 'dismissed');
create type public.complaint_reason as enum ('spam', 'fraud', 'prohibited_item', 'abuse', 'other');
create type public.notification_type as enum ('message', 'offer_response', 'moderation', 'favorite_price_changed', 'favorite_sold', 'deal_status');
create type public.analytics_event_name as enum (
  'listing_viewed',
  'chat_started',
  'offer_sent',
  'offer_accepted',
  'deal_created',
  'deal_completed',
  'moderation_approved',
  'moderation_rejected',
  'favorite_added',
  'search_used',
  'filters_applied'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  phone text,
  avatar_url text,
  bio text,
  role public.user_role not null default 'buyer',
  verification_status public.verification_status not null default 'none',
  rating numeric(2,1) not null default 0,
  reviews_count integer not null default 0,
  completed_deals_count integer not null default 0,
  location jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null,
  description text not null,
  price_amount integer not null check (price_amount > 0),
  currency text not null default 'USD',
  original_price_amount integer,
  condition public.listing_condition not null,
  status public.listing_status not null default 'draft',
  attributes jsonb not null default '[]'::jsonb,
  location jsonb not null,
  moderation_note text,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text,
  url text not null,
  alt text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  archived_at timestamptz,
  price_changed_at timestamptz,
  sold_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  status public.conversation_status not null default 'active',
  unread_count integer not null default 0,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id, seller_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  type public.message_type not null,
  text text,
  attachment jsonb,
  status public.message_status not null default 'sent',
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  currency text not null default 'USD',
  status public.offer_status not null default 'sent',
  message text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  accepted_offer_id uuid references public.offers(id) on delete set null,
  type public.deal_type not null,
  status public.deal_status not null default 'created',
  amount integer not null check (amount > 0),
  currency text not null default 'USD',
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  status public.moderation_status not null default 'open',
  moderator_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  target_type public.complaint_target not null,
  target_id uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason public.complaint_reason not null,
  details text not null,
  status public.complaint_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name public.analytics_event_name not null,
  actor_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  session_id text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger listings_set_updated_at before update on public.listings
for each row execute function public.set_updated_at();

create trigger offers_set_updated_at before update on public.offers
for each row execute function public.set_updated_at();

create trigger deals_set_updated_at before update on public.deals
for each row execute function public.set_updated_at();

create trigger moderation_cases_set_updated_at before update on public.moderation_cases
for each row execute function public.set_updated_at();

create trigger complaints_set_updated_at before update on public.complaints
for each row execute function public.set_updated_at();

create index listings_status_created_at_idx on public.listings(status, created_at desc);
create index listings_category_idx on public.listings(category_id);
create index listing_images_listing_position_idx on public.listing_images(listing_id, position);
create index conversations_participants_idx on public.conversations(buyer_id, seller_id);
create index messages_conversation_created_at_idx on public.messages(conversation_id, created_at);
create index offers_conversation_idx on public.offers(conversation_id);
create index notifications_user_created_at_idx on public.notifications(user_id, created_at desc);
create index analytics_events_name_created_at_idx on public.analytics_events(name, created_at desc);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.offers enable row level security;
alter table public.deals enable row level security;
alter table public.moderation_cases enable row level security;
alter table public.complaints enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics_events enable row level security;
alter table public.listing_views enable row level security;

create policy "Profiles are readable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Categories are public" on public.categories for select using (true);

create policy "Published listings are public" on public.listings for select using (status in ('published', 'reserved', 'sold') or seller_id = auth.uid());
create policy "Users insert own listings" on public.listings for insert with check (seller_id = auth.uid());
create policy "Sellers update own listings" on public.listings for update using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create policy "Listing images follow listing visibility" on public.listing_images for select using (
  exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id
      and (listings.status in ('published', 'reserved', 'sold') or listings.seller_id = auth.uid())
  )
);
create policy "Sellers manage own listing images" on public.listing_images for all using (
  exists (select 1 from public.listings where listings.id = listing_images.listing_id and listings.seller_id = auth.uid())
) with check (
  exists (select 1 from public.listings where listings.id = listing_images.listing_id and listings.seller_id = auth.uid())
);

create policy "Users manage own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Conversation participants can read" on public.conversations for select using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Buyers can start conversations" on public.conversations for insert with check (buyer_id = auth.uid());
create policy "Participants can update conversation" on public.conversations for update using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Participants can read messages" on public.messages for select using (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
  )
);
create policy "Participants can send messages" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
  )
);

create policy "Participants can read offers" on public.offers for select using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Buyers can create offers" on public.offers for insert with check (buyer_id = auth.uid());
create policy "Participants can update offers" on public.offers for update using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Deal participants can read" on public.deals for select using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Deal participants can create" on public.deals for insert with check (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Deal participants can update" on public.deals for update using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Sellers can read own moderation cases" on public.moderation_cases for select using (
  exists (select 1 from public.listings where listings.id = moderation_cases.listing_id and listings.seller_id = auth.uid())
);
create policy "Sellers can create moderation cases for own listings" on public.moderation_cases for insert with check (
  exists (select 1 from public.listings where listings.id = moderation_cases.listing_id and listings.seller_id = auth.uid())
);

create policy "Users create complaints" on public.complaints for insert with check (reporter_id = auth.uid());
create policy "Users read own complaints" on public.complaints for select using (reporter_id = auth.uid());

create policy "Reviews are public" on public.reviews for select using (true);
create policy "Deal participants create reviews" on public.reviews for insert with check (author_id = auth.uid());

create policy "Users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications for update using (user_id = auth.uid());

create policy "Users create analytics events" on public.analytics_events for insert with check (actor_id is null or actor_id = auth.uid());
create policy "Users create listing views" on public.listing_views for insert with check (viewer_id is null or viewer_id = auth.uid());

insert into storage.buckets (id, name, public) values
  ('listing-images', 'listing-images', true),
  ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

create policy "Public media is readable" on storage.objects
for select using (bucket_id in ('listing-images', 'avatars'));

create policy "Authenticated users upload media" on storage.objects
for insert to authenticated with check (bucket_id in ('listing-images', 'avatars'));

create policy "Users update own media" on storage.objects
for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

create policy "Users delete own media" on storage.objects
for delete to authenticated using (owner = auth.uid());

alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.offers;
alter publication supabase_realtime add table public.deals;
alter publication supabase_realtime add table public.notifications;
