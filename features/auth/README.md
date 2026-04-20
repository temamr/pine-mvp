# Auth

Stage 4 adds Supabase Auth surfaces:

- Email/password sign in and sign up.
- Phone OTP send/verify abstraction.
- Session-aware header state.
- Middleware route protection when Supabase env is configured.
- Profile onboarding with avatar upload to Storage.

The app keeps mock behavior when Supabase env is missing, so local UI work can continue without a backend.
