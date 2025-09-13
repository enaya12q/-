export type UserProfile = {
    id: string;
    email: string;
    wallet_address: string | null;
    balance: number;
    referral_code: string;
    referral_earnings: number;
    referrer_id: string | null;
    created_at: string;
};

export type AdView = {
    id: string;
    user_id: string;
    date: string;
    count: number;
    created_at: string;
};

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: UserProfile;
                Insert: Omit<UserProfile, 'id' | 'created_at'>;
                Update: Partial<Omit<UserProfile, 'id'>>;
            };
            ad_views: {
                Row: AdView;
                Insert: Omit<AdView, 'id' | 'created_at'>;
                Update: Partial<Omit<AdView, 'id'>>;
            };
        };
    };
}