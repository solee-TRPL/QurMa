import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';

export interface AppNotification {
    id: string;
    user_id: string; // Recipient ID (auth.users)
    tenant_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    created_at: string;
    metadata?: any;
}

export const createNotification = async (notif: Partial<AppNotification>) => {
    // For non-persisted environments, we can log to console
    // In a real Supabase env, we'd insert into 'notifications' table
    try {
        const { error } = await supabase.from('notifications').insert([{
            ...notif,
            is_read: false,
            created_at: new Date().toISOString()
        }]);
        if (error) {
            if (error.code === '42P01') { // Relation does not exist
                console.warn("Table 'notifications' does not exist yet. Please create it in Supabase.");
            } else {
                console.error("Failed to create notification:", error);
            }
        }
    } catch (err) {
        console.error("Critical error in createNotification:", err);
    }
};

export const getMyNotifications = async (userId: string): Promise<AppNotification[]> => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30);
        
        if (error) {
            if (error.code === '42P01') return [];
            throw error;
        }
        return data as AppNotification[] || [];
    } catch (err) {
        return [];
    }
};

export const markNotificationsAsRead = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error && error.code !== '42P01') throw error;
    } catch (err) {}
};

export const deleteOldNotifications = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)
            .eq('is_read', true);
        if (error && error.code !== '42P01') throw error;
    } catch (err) {}
};
