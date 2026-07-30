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
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    avatar_url: string | null
                    wallet_address: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    avatar_url?: string | null
                    wallet_address?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    avatar_url?: string | null
                    wallet_address?: string | null
                    created_at?: string
                }
            }
            videos: {
                Row: {
                    id: string
                    created_at: string
                    creator_id: string
                    url: string
                    rarity_score: number
                    is_unique: boolean
                    title: string | null
                    description: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    creator_id: string
                    url: string
                    rarity_score: number
                    is_unique: boolean
                    title?: string | null
                    description?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    creator_id?: string
                    url?: string
                    rarity_score?: number
                    is_unique?: boolean
                    title?: string | null
                    description?: string | null
                }
            }
            likes: {
                Row: {
                    id: number
                    created_at: string
                    user_id: string
                    video_id: string
                }
                Insert: {
                    id?: number
                    created_at?: string
                    user_id: string
                    video_id: string
                }
                Update: {
                    id?: number
                    created_at?: string
                    user_id?: string
                    video_id?: string
                }
            }
            comments: {
                Row: {
                    id: number
                    created_at: string
                    user_id: string
                    video_id: string
                    content: string
                }
                Insert: {
                    id?: number
                    created_at?: string
                    user_id: string
                    video_id: string
                    content: string
                }
                Update: {
                    id?: number
                    created_at?: string
                    user_id?: string
                    video_id?: string
                    content?: string
                }
            }
        }
    }
}
