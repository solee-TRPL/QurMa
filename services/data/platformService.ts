import { supabase } from '../../lib/supabase';
import { PlatformSettings, UserProfile } from '../../types';
import { logAudit } from './auditService';

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
    try {
        const { data, error } = await supabase.from('platform_settings').select('key, value');
        if (error || !data || data.length === 0) {
            return {
                platform_name: 'QurMa',
                public_registration_enabled: false,
                default_tenant_id: null,
                welcome_email_subject: 'Selamat Datang',
                welcome_email_body: '',
                reset_password_subject: 'Reset Password',
                reset_password_body: ''
            } as PlatformSettings;
        }
        return data.reduce((acc, { key, value }) => { acc[key] = value; return acc; }, {} as any);
    } catch (e) {
        return { platform_name: 'QurMa' } as PlatformSettings;
    }
};

export const updatePlatformSettings = async (settingsToUpdate: Partial<PlatformSettings>, actor: UserProfile): Promise<void> => {
    const updates = Object.entries(settingsToUpdate).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('platform_settings').upsert(updates, { onConflict: 'key' });
    if (error) throw error;
    await logAudit(actor, 'UPDATE', 'Platform Settings', `Memperbarui: ${Object.keys(settingsToUpdate).join(', ')}`);
};

export const uploadLogo = async (tenantId: string, file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenantId}.${fileExt}`;
    const filePath = `logos/${fileName}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data ? `${data.publicUrl}?t=${new Date().getTime()}` : null;
};
