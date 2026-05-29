export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type MembershipType = 'starter' | 'creator' | 'pro' | 'team';
export type VerificationStatus = 'none' | 'pending' | 'verified';
export type PermissionLevel = 'viewer' | 'editor';
export type OutputType = 'text' | 'image' | 'video' | 'audio' | 'file';
export type OrderStatus = 'pending' | 'completed' | 'refunded';
export type CustomOrderStatus = 'pending' | 'accepted' | 'delivered' | 'completed' | 'declined';
export type NotificationType =
  | 'like' | 'comment' | 'sale' | 'invite_collaborator'
  | 'commission_request' | 'commission_accepted' | 'commission_delivered' | 'commission_declined';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          membership: MembershipType;
          verification_status: VerificationStatus;
          referral_code: string | null;
          referred_by: string | null;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          following: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };

      prompts: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          content: string;
          description: string | null;
          tags: string[];
          output_type: OutputType;
          output_files: Json[];
          variables: Json[];
          is_public: boolean;
          is_archived: boolean;
          use_count: number;
          collaborators: Json[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prompts']['Row'], 'id' | 'use_count' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['prompts']['Insert']>;
      };

      marketplace_items: {
        Row: {
          id: string;
          seller_id: string;
          prompt_ids: string[];
          title: string;
          description: string;
          price: number;
          cover_image: string | null;
          tags: string[];
          type: 'single' | 'collection';
          prompt_count: number;
          sales_count: number;
          views: number;
          rating: number;
          review_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['marketplace_items']['Row'], 'id' | 'sales_count' | 'views' | 'rating' | 'review_count' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['marketplace_items']['Insert']>;
      };

      orders: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          item_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          commission_rate: number;
          net_amount: number;
          status: OrderStatus;
          review_rating: number | null;
          review_text: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };

      posts: {
        Row: {
          id: string;
          author_id: string;
          caption: string;
          image_url: string | null;
          video_url: string | null;
          tags: string[];
          likes: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'likes' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
      };

      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          text: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['post_comments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['post_comments']['Insert']>;
      };

      conversations: {
        Row: {
          id: string;
          participant_ids: string[];
          last_message: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };

      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          text: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'is_read' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };

      custom_orders: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          title: string;
          description: string;
          budget: number;
          agreed_price: number | null;
          status: CustomOrderStatus;
          delivery_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['custom_orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['custom_orders']['Insert']>;
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: NotificationType;
          target_type: string;
          target_id: string;
          target_preview: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'is_read' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };

      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_user_id: string;
          status: 'pending' | 'converted';
          earned_amount: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['referrals']['Insert']>;
      };

      campaigns: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          description: string;
          creative_url: string;
          creative_type: 'image' | 'video';
          prompt_ids: string[];
          budget: number;
          spent: number;
          impressions: number;
          clicks: number;
          is_active: boolean;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'spent' | 'impressions' | 'clicks' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };
    };
  };
}
