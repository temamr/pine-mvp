# Profile

Profile, verification, reviews, settings and onboarding live here.

## Stage 8

- Supabase profile now reads received reviews from `reviews`.
- Completed deals that have not been reviewed become reviewable in the profile reviews tab.
- Review inserts refresh `profiles.rating` and `profiles.reviews_count` through database triggers.
- `profiles.verification_status` can be changed from the moderation Trust tools tab by moderator/admin users.
- `profiles.blocked_at` and `profiles.blocked_reason` are ready for admin block workflows.
