import { getSupabase } from "../../lib/supabase";
import { PlatformSettings, UserProfile } from "../../types";
import { logAudit } from "./auditService";

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.from("platform_settings").select("key, value");
    if (error || !data || data.length === 0) {
      return {
        platform_name: "QurMa",
        public_registration_enabled: false,
        default_tenant_id: null,
        welcome_email_subject: "Selamat Datang di Platform QurMa",
        welcome_email_body: `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nAhlan wa sahlan! Selamat datang {{user_name}} di platform QurMa.\n\nAkun Anda telah berhasil terdaftar sebagai santri. Anda sekarang dapat mengakses dashboard untuk mengelola program tahfidz, memantau riwayat hafalan santri, serta melihat laporan capaian harian.\n\nSemoga Allah Subhanahu Wa Ta'ala memberikan kemudahan dan keberkahan dalam perjalanan menghafal Al-Qur'an ini.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\nTim Administrasi QurMa`,
        reset_password_subject: "Atur Ulang Kata Sandi Akun QurMa Anda",
        reset_password_body: `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nYth. {{user_name}},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun QurMa Anda. Silakan klik tautan di bawah ini untuk melanjutkan proses pemulihan akses akun:\n\n{{reset_link}}\n\nTautan di atas hanya berlaku selama 24 jam demi keamanan akun Anda. Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini dan kata sandi Anda akan tetap aman.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\nTim Keamanan QurMa`,
      } as PlatformSettings;
    }
    return data.reduce((acc, { key, value }) => {
      if (value === "true") acc[key] = true;
      else if (value === "false") acc[key] = false;
      else acc[key] = value;
      return acc;
    }, {} as any);
  } catch (e) {
    return { platform_name: "QurMa" } as PlatformSettings;
  }
};

export const updatePlatformSettings = async (settingsToUpdate: Partial<PlatformSettings>, actor: UserProfile): Promise<void> => {
  const supabase = getSupabase();
  const updates = Object.entries(settingsToUpdate).map(([key, value]) => ({
    key,
    value: typeof value === "boolean" ? String(value) : value === null ? "" : String(value),
  }));
  const { error } = await supabase.from("platform_settings").upsert(updates, { onConflict: "key" });
  if (error) throw error;
  await logAudit(actor, "UPDATE", "Platform Settings", `Memperbarui: ${Object.keys(settingsToUpdate).join(", ")}`);
};

export const uploadLogo = async (tenantId: string, file: File): Promise<string | null> => {
  const supabase = getSupabase();
  const fileExt = file.name.split(".").pop();
  const fileName = `${tenantId}.${fileExt}`;
  const filePath = `public/logo_${fileName}`;
  const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data ? `${data.publicUrl}?t=${new Date().getTime()}` : null;
};
