export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamp = string;
type UUID = string;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: UUID;
          display_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: Database["public"]["Enums"]["user_role"];
          verification_status: Database["public"]["Enums"]["verification_status"];
          rating: number;
          reviews_count: number;
          completed_deals_count: number;
          location: Json | null;
          blocked_at: Timestamp | null;
          blocked_reason: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: UUID;
          name: string;
          slug: string;
          icon: string;
          parent_id: UUID | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & Pick<Database["public"]["Tables"]["categories"]["Row"], "name" | "slug" | "icon">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      listings: {
        Row: {
          id: UUID;
          seller_id: UUID;
          category_id: UUID;
          title: string;
          description: string;
          price_amount: number;
          currency: "USD" | "EUR" | "RUB";
          original_price_amount: number | null;
          condition: Database["public"]["Enums"]["listing_condition"];
          status: Database["public"]["Enums"]["listing_status"];
          attributes: Json;
          location: Json;
          moderation_note: string | null;
          views_count: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["listings"]["Row"]> &
          Pick<Database["public"]["Tables"]["listings"]["Row"], "seller_id" | "category_id" | "title" | "description" | "price_amount" | "condition" | "location">;
        Update: Partial<Database["public"]["Tables"]["listings"]["Row"]>;
        Relationships: [];
      };
      listing_images: {
        Row: {
          id: UUID;
          listing_id: UUID;
          storage_path: string | null;
          url: string;
          alt: string;
          position: number;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["listing_images"]["Row"]> & Pick<Database["public"]["Tables"]["listing_images"]["Row"], "listing_id" | "url" | "alt">;
        Update: Partial<Database["public"]["Tables"]["listing_images"]["Row"]>;
        Relationships: [];
      };
      favorites: {
        Row: {
          id: UUID;
          user_id: UUID;
          listing_id: UUID;
          archived_at: Timestamp | null;
          price_changed_at: Timestamp | null;
          sold_notified_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["favorites"]["Row"]> & Pick<Database["public"]["Tables"]["favorites"]["Row"], "user_id" | "listing_id">;
        Update: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: UUID;
          listing_id: UUID;
          buyer_id: UUID;
          seller_id: UUID;
          status: Database["public"]["Enums"]["conversation_status"];
          unread_count: number;
          last_message_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["conversations"]["Row"]> & Pick<Database["public"]["Tables"]["conversations"]["Row"], "listing_id" | "buyer_id" | "seller_id">;
        Update: Partial<Database["public"]["Tables"]["conversations"]["Row"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: UUID;
          conversation_id: UUID;
          sender_id: UUID | null;
          type: Database["public"]["Enums"]["message_type"];
          text: string | null;
          attachment: Json | null;
          status: Database["public"]["Enums"]["message_status"];
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & Pick<Database["public"]["Tables"]["messages"]["Row"], "conversation_id" | "type">;
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [];
      };
      offers: {
        Row: {
          id: UUID;
          conversation_id: UUID;
          listing_id: UUID;
          buyer_id: UUID;
          seller_id: UUID;
          amount: number;
          currency: "USD" | "EUR" | "RUB";
          status: Database["public"]["Enums"]["offer_status"];
          message: string | null;
          expires_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["offers"]["Row"]> & Pick<Database["public"]["Tables"]["offers"]["Row"], "conversation_id" | "listing_id" | "buyer_id" | "seller_id" | "amount">;
        Update: Partial<Database["public"]["Tables"]["offers"]["Row"]>;
        Relationships: [];
      };
      deals: {
        Row: {
          id: UUID;
          listing_id: UUID;
          conversation_id: UUID;
          buyer_id: UUID;
          seller_id: UUID;
          accepted_offer_id: UUID | null;
          type: Database["public"]["Enums"]["deal_type"];
          status: Database["public"]["Enums"]["deal_status"];
          amount: number;
          currency: "USD" | "EUR" | "RUB";
          timeline: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["deals"]["Row"]> & Pick<Database["public"]["Tables"]["deals"]["Row"], "listing_id" | "conversation_id" | "buyer_id" | "seller_id" | "type" | "amount">;
        Update: Partial<Database["public"]["Tables"]["deals"]["Row"]>;
        Relationships: [];
      };
      moderation_cases: {
        Row: {
          id: UUID;
          listing_id: UUID;
          status: Database["public"]["Enums"]["moderation_status"];
          moderator_id: UUID | null;
          note: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["moderation_cases"]["Row"]> & Pick<Database["public"]["Tables"]["moderation_cases"]["Row"], "listing_id">;
        Update: Partial<Database["public"]["Tables"]["moderation_cases"]["Row"]>;
        Relationships: [];
      };
      complaints: {
        Row: {
          id: UUID;
          target_type: Database["public"]["Enums"]["complaint_target"];
          target_id: UUID;
          reporter_id: UUID;
          reason: Database["public"]["Enums"]["complaint_reason"];
          details: string;
          status: Database["public"]["Enums"]["complaint_status"];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["complaints"]["Row"]> & Pick<Database["public"]["Tables"]["complaints"]["Row"], "target_type" | "target_id" | "reporter_id" | "reason" | "details">;
        Update: Partial<Database["public"]["Tables"]["complaints"]["Row"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: UUID;
          deal_id: UUID;
          author_id: UUID;
          recipient_id: UUID;
          rating: number;
          text: string;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & Pick<Database["public"]["Tables"]["reviews"]["Row"], "deal_id" | "author_id" | "recipient_id" | "rating" | "text">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: UUID;
          user_id: UUID;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string;
          href: string | null;
          read_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & Pick<Database["public"]["Tables"]["notifications"]["Row"], "user_id" | "type" | "title" | "body">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: UUID;
          name: Database["public"]["Enums"]["analytics_event_name"];
          actor_id: UUID | null;
          listing_id: UUID | null;
          conversation_id: UUID | null;
          deal_id: UUID | null;
          metadata: Json | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]> & Pick<Database["public"]["Tables"]["analytics_events"]["Row"], "name">;
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]>;
        Relationships: [];
      };
      listing_views: {
        Row: {
          id: UUID;
          listing_id: UUID;
          viewer_id: UUID | null;
          session_id: string | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["listing_views"]["Row"]> & Pick<Database["public"]["Tables"]["listing_views"]["Row"], "listing_id">;
        Update: Partial<Database["public"]["Tables"]["listing_views"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_offer: {
        Args: { p_offer_id: UUID };
        Returns: Database["public"]["Tables"]["offers"]["Row"];
      };
      decline_offer: {
        Args: { p_offer_id: UUID };
        Returns: Database["public"]["Tables"]["offers"]["Row"];
      };
      moderate_listing: {
        Args: {
          p_listing_id: UUID;
          p_decision: Database["public"]["Enums"]["moderation_status"];
          p_note?: string | null;
        };
        Returns: Database["public"]["Tables"]["moderation_cases"]["Row"];
      };
      resolve_complaint: {
        Args: {
          p_complaint_id: UUID;
          p_status: Database["public"]["Enums"]["complaint_status"];
        };
        Returns: Database["public"]["Tables"]["complaints"]["Row"];
      };
      block_profile: {
        Args: {
          p_profile_id: UUID;
          p_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      verify_profile: {
        Args: {
          p_profile_id: UUID;
          p_status: Database["public"]["Enums"]["verification_status"];
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      is_trust_staff: {
        Args: { p_user_id?: UUID };
        Returns: boolean;
      };
      is_admin: {
        Args: { p_user_id?: UUID };
        Returns: boolean;
      };
      create_safe_deal: {
        Args: {
          p_conversation_id: UUID;
          p_type: Database["public"]["Enums"]["deal_type"];
        };
        Returns: Database["public"]["Tables"]["deals"]["Row"];
      };
      advance_deal: {
        Args: {
          p_deal_id: UUID;
          p_status: Database["public"]["Enums"]["deal_status"];
        };
        Returns: Database["public"]["Tables"]["deals"]["Row"];
      };
      deal_timeline_event: {
        Args: {
          p_status: Database["public"]["Enums"]["deal_status"];
          p_actor_id: UUID;
        };
        Returns: Json;
      };
      track_listing_view: {
        Args: {
          p_listing_id: UUID;
          p_session_id?: string | null;
        };
        Returns: void;
      };
      track_analytics_event: {
        Args: {
          p_name: Database["public"]["Enums"]["analytics_event_name"];
          p_listing_id?: UUID | null;
          p_conversation_id?: UUID | null;
          p_deal_id?: UUID | null;
          p_metadata?: Json | null;
        };
        Returns: void;
      };
      analytics_dashboard: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
    Enums: {
      user_role: "buyer" | "seller" | "moderator" | "admin";
      verification_status: "none" | "phone" | "document" | "trusted";
      listing_condition: "new" | "like_new" | "good" | "fair" | "for_parts";
      listing_status: "draft" | "pending" | "published" | "needs_changes" | "rejected" | "reserved" | "sold";
      conversation_status: "active" | "archived" | "deal_started" | "completed";
      message_type: "text" | "attachment" | "system";
      message_status: "sending" | "sent" | "delivered" | "read" | "failed";
      offer_status: "draft" | "sent" | "accepted" | "declined" | "countered" | "expired";
      deal_type: "meetup" | "courier" | "pine_check";
      deal_status: "created" | "payment_pending" | "reserved" | "handoff_planned" | "in_transit" | "inspection" | "completed" | "cancelled";
      moderation_status: "open" | "approved" | "needs_changes" | "rejected";
      complaint_target: "listing" | "user" | "conversation";
      complaint_status: "submitted" | "reviewing" | "resolved" | "dismissed";
      complaint_reason: "spam" | "fraud" | "prohibited_item" | "abuse" | "other";
      notification_type: "message" | "offer_response" | "moderation" | "favorite_price_changed" | "favorite_sold" | "deal_status";
      analytics_event_name:
        | "listing_viewed"
        | "chat_started"
        | "offer_sent"
        | "offer_accepted"
        | "deal_created"
        | "deal_completed"
        | "moderation_approved"
        | "moderation_rejected"
        | "favorite_added"
        | "search_used"
        | "filters_applied";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
