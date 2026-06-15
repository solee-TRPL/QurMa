import { getSupabase } from "../../lib/supabase";
import { UserProfile } from "../../types";

export interface AppNotification {
  id: string;
  user_id: string; // Recipient ID (auth.users)
  tenant_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export const createNotification = async (notif: Partial<AppNotification>) => {
  const supabase = getSupabase();
  // For non-persisted environments, we can log to console
  // In a real Supabase env, we'd insert into 'notifications' table
  try {
    const { error } = await supabase.from("notifications").insert([
      {
        ...notif,
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      if (error.code === "42P01") {
        // Relation does not exist
        console.warn("Table 'notifications' does not exist yet. Please create it in Supabase.");
      } else if (error.code === "23503") {
        // Foreign key violation
        // This happens when the user_id (recipient) does not exist in auth.users
        // Common when trying to notify a student who hasn't been given a user account yet
        console.info(`[Notification] Recipient ${notif.user_id} is not a registered user. Skipping notification.`);
      } else {
        console.error("Failed to create notification:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          recipient: notif.user_id,
        });
      }
    }
  } catch (err) {
    console.error("Critical error in createNotification:", err);
  }
};

export const getMyNotifications = async (userId: string): Promise<AppNotification[]> => {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);

    if (error) {
      if (error.code === "42P01") return [];
      throw error;
    }
    return (data as AppNotification[]) || [];
  } catch (err) {
    return [];
  }
};

export const markNotificationsAsRead = async (userId: string) => {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    if (error && error.code !== "42P01") throw error;
  } catch (err) {}
};

export const deleteOldNotifications = async (userId: string) => {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from("notifications").delete().eq("user_id", userId).eq("is_read", true);
    if (error && error.code !== "42P01") throw error;
  } catch (err) {}
};
