import { supabase } from '../../lib/supabase';
import { UserProfile, AuditLogEntry } from '../../types';

export const logAudit = async (actor: UserProfile, action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SAVE', entity: string, details: string) => {
    if (!actor) return;
    try {
        await supabase.from('audit_logs').insert({
            tenant_id: actor.tenant_id,
            actor_name: actor.full_name,
            actor_role: actor.role.toUpperCase(),
            action,
            entity,
            details,
            ip_address: '0.0.0.0'
        });
    } catch (error) {
        console.error("Failed to log audit:", error);
    }
};

export const getAuditLogs = async (tenantId: string): Promise<AuditLogEntry[]> => {
    const { data, error } = await supabase.from('audit_logs').select('*').eq('tenant_id', tenantId).order('timestamp', { ascending: false });
    if (error || !data) return [];
    return data as AuditLogEntry[];
};

export const getGlobalAuditLogs = async (): Promise<AuditLogEntry[]> => {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*, tenants(name)')
        .order('timestamp', { ascending: false })
        .limit(200);
    
    if (error || !data) return [];
    
    return data.map((log: any) => ({
        ...log,
        tenant_name: log.tenants?.name || (log.tenant_id === null ? 'Superadmin/System' : 'Unknown School')
    }));
};
