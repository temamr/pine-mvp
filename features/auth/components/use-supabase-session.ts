"use client";

import * as React from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Tables } from "@/lib/supabase/database.types";

type SessionState = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: SupabaseUser | null;
  profile: Tables<"profiles"> | null;
};

export function useSupabaseSession() {
  const configured = isSupabaseConfigured();
  const [state, setState] = React.useState<SessionState>({
    configured,
    loading: configured,
    session: null,
    user: null,
    profile: null
  });

  React.useEffect(() => {
    if (!configured) {
      setState({
        configured: false,
        loading: false,
        session: null,
        user: null,
        profile: null
      });
      return;
    }

    let active = true;
    const supabase = createSupabaseBrowserClient();

    async function load(session: Session | null) {
      const user = session?.user ?? null;
      let profile: Tables<"profiles"> | null = null;

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        profile = data ?? null;
      }

      if (active) {
        setState({
          configured: true,
          loading: false,
          session,
          user,
          profile
        });
      }
    }

    supabase.auth.getSession().then(({ data }) => load(data.session));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  return state;
}
