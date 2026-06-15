import React, { useEffect, useState } from "react";
import { getAllTenants, createTenant, updateTenant, createUser, getTenantAdmin, updateUser, sendPasswordReset, deleteTenant, logAudit } from "../../services/dataService";
import { Tenant, UserProfile, UserRole } from "../../types";
import { Button } from "../../components/ui/Button";
import { Plus, Building, X, Save, Edit, User, Lock, Mail, Tag, UserCog, Send, Phone, Shield, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, AlertTriangle, RotateCcw, AlertCircle } from "lucide-react";
import { useLoading } from "../../lib/LoadingContext";
import { useNotification } from "../../lib/NotificationContext";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Tenant | null;
  defaultCode?: string; // New prop for auto-incremented code
}

const TenantFormModal: React.FC<TenantFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, defaultCode }) => {
  const [formData, setFormData] = useState<{ name: string; plan: Tenant["plan"]; code: string }>({ name: "", plan: "basic", code: "" });

  const [adminData, setAdminData] = useState({
    full_name: "",
    email: "",
    password: "",
    whatsapp_number: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, plan: "basic", code: initialData.code || "" });
    } else {
      setFormData({ name: "", plan: "basic", code: defaultCode || "" });
      setAdminData({ full_name: "", email: "", password: "", whatsapp_number: "" });
    }
  }, [initialData, isOpen, defaultCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        tenant: { ...formData, id: initialData?.id },
        admin: initialData ? null : adminData,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border-2 border-slate-300 transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] sm:max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-2 sm:px-6 sm:py-3 border-b-2 border-slate-300 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-jade-50 flex items-center justify-center text-jade-600 border-2 border-jade-100 shadow-none shrink-0">
              <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-tight leading-none">{initialData ? "Perbarui Institusi" : "Registrasi Sekolah Baru"}</h3>
              <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2 opacity-70">
                <Shield className="w-2.5 h-2.5 text-jade-400" />
                Multi-Tenant System
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 sm:p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group">
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-2.5 sm:px-6 sm:py-4 flex-1 custom-scrollbar">
          <form id="tenantForm" onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-4">
            {/* Section 1: Basic Info */}
            <div className="space-y-1.5 sm:space-y-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                <h4 className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Profil Institusi</h4>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="col-span-2 group">
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 ml-1 group-focus-within:text-jade-600">Nama Lengkap Sekolah</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] sm:text-[13px] focus:bg-white focus:border-jade-400 focus:ring-4 focus:ring-jade-50/20 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="Nama resmi..."
                  />
                </div>
                <div className="group opacity-70">
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 ml-1">Kode / ID</label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-300" />
                    <input
                      disabled
                      type="text"
                      value={formData.code}
                      className="w-full pl-7 sm:pl-8 pr-2 py-1.5 sm:py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-500 font-black text-[11px] sm:text-[13px] outline-none font-mono cursor-not-allowed"
                      placeholder="0001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Admin Details */}
            {!initialData && (
              <div className="space-y-1.5 sm:space-y-3 relative pt-1 sm:pt-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-jade-400" />
                  <h4 className="text-[8px] sm:text-[9px] font-black text-jade-500 uppercase tracking-[0.2em]">Otoritas Admin</h4>
                </div>

                <div className="bg-linear-to-br from-jade-50/30 to-slate-50/30 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-jade-100/50 space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="group/field">
                      <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 ml-1 group-focus-within/field:text-jade-600">Administrator</label>
                      <div className="relative">
                        <User className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                        <input
                          required
                          type="text"
                          value={adminData.full_name}
                          onChange={(e) => setAdminData({ ...adminData, full_name: e.target.value })}
                          className="w-full pl-8 pr-2.5 py-1.5 sm:pl-9 sm:pr-4 sm:py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[11px] sm:text-[13px] focus:border-jade-400 focus:ring-4 focus:ring-jade-50/20 outline-none transition-all"
                          placeholder="Nama Admin"
                        />
                      </div>
                    </div>
                    <div className="group/field">
                      <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 ml-1 group-focus-within/field:text-jade-600">WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                        <input
                          required
                          type="tel"
                          value={adminData.whatsapp_number}
                          onChange={(e) => setAdminData({ ...adminData, whatsapp_number: e.target.value })}
                          className="w-full pl-8 pr-2.5 py-1.5 sm:pl-9 sm:pr-4 sm:py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[11px] sm:text-[13px] focus:border-jade-400 focus:ring-4 focus:ring-jade-50/20 outline-none transition-all placeholder:text-slate-300"
                          placeholder="08123456789"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="group/field">
                      <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 ml-1 group-focus-within/field:text-jade-600">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                        <input
                          required
                          type="email"
                          value={adminData.email}
                          onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                          className="w-full pl-8 pr-2.5 py-1.5 sm:pl-9 sm:pr-4 sm:py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[11px] sm:text-[13px] focus:border-jade-400 outline-none transition-all"
                          placeholder="email@gmail.com"
                        />
                      </div>
                    </div>
                    <div className="group/field">
                      <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 ml-1 group-focus-within/field:text-jade-600">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                        <input
                          required
                          minLength={6}
                          type="text"
                          value={adminData.password}
                          onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                          className="w-full pl-8 pr-2.5 py-1.5 sm:pl-9 sm:pr-4 sm:py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-black text-[11px] sm:text-[13px] outline-none font-mono"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 sm:px-6 sm:py-3 border-t-2 border-slate-300 bg-slate-50/50 flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-2 sm:px-6 py-2 sm:py-2.5 font-black text-[8px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest rounded-xl border-2 border-slate-300 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex-1 shadow-none whitespace-nowrap active:scale-95"
          >
            Batalkan
          </button>
          <button
            form="tenantForm"
            type="submit"
            disabled={isSubmitting}
            className="px-2 sm:px-8 py-2 sm:py-2.5 font-black text-[8px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest rounded-xl bg-jade-600 text-white hover:bg-jade-700 shadow-none transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 flex-1 border-2 border-jade-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
            {initialData ? "PERBARUI DATA" : "BUAT SEKOLAH"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  currentUser: UserProfile;
}

const AdminManagerModal: React.FC<AdminManagerModalProps> = ({ isOpen, onClose, tenant, currentUser }) => {
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ full_name: "", whatsapp_number: "", email: "", password: "" });
  const { addNotification } = useNotification();

  useEffect(() => {
    if (isOpen && tenant) {
      setIsLoading(true);
      getTenantAdmin(tenant.id).then((admin) => {
        setAdminProfile(admin);
        if (admin) {
          setForm({
            full_name: admin.full_name,
            whatsapp_number: admin.whatsapp_number || "",
            email: admin.email || "",
            password: "", // Keep empty for security
          });
        }
        setIsLoading(false);
      });
    }
  }, [isOpen, tenant]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (adminProfile) {
        // Update Existing
        await updateUser({ id: adminProfile.id, full_name: form.full_name, whatsapp_number: form.whatsapp_number }, currentUser);
        addNotification({ type: "success", title: "Berhasil", message: "Profil admin telah diperbarui." });
      } else {
        // Create New for this Tenant
        if (!tenant) return;
        await createUser(
          {
            email: form.email,
            password: form.password,
            full_name: form.full_name,
            role: UserRole.ADMIN,
            tenant_id: tenant.id,
            whatsapp_number: form.whatsapp_number,
          },
          currentUser,
        );
        addNotification({ type: "success", title: "Berhasil", message: `Admin baru untuk ${tenant.name} telah dibuat.` });
      }
      onClose();
    } catch (error: any) {
      addNotification({ type: "error", title: "Gagal", message: error.message || "Gagal menyimpan data admin." });
    } finally {
      setIsLoading(false);
    }
  };

  const [showInitialPass, setShowInitialPass] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const handleActualForceReset = async () => {
    if (!adminProfile) return;
    const initialPass = (adminProfile as any).initial_password;

    setIsLoading(true);
    try {
      const { forceResetPassword } = await import("../../services/data/userService");
      await forceResetPassword(adminProfile.id, initialPass!, currentUser);
      addNotification({ type: "success", title: "Berhasil Reset", message: `Password ${adminProfile.email} dipaksa kembali ke default.` });
      setShowInitialPass(false);
      setIsConfirmResetOpen(false);
    } catch (error) {
      console.error(error);
      addNotification({ type: "error", title: "Gagal", message: "Gagal melakukan reset paksa." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreDefaultPassword = async () => {
    if (!adminProfile) return;

    // Visual feedback only - since we can't force the Auth password back
    // without Service Role Key, we "expose" the initial password to the Superadmin
    setShowInitialPass(true);
    addNotification({
      type: "info",
      title: "Password Ditemukan",
      message: "Gunakan password awal ini untuk login kembali.",
    });

    await logAudit(currentUser, "UPDATE", `Reset Password: ${adminProfile.email}`, `Melihat password awal untuk reset manual.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border-2 border-slate-300 transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] relative text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-3 border-b-2 border-slate-300 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-jade-50 flex items-center justify-center text-jade-600 border-2 border-jade-100 shadow-none">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none">Otoritas Admin</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                <Building className="w-2.5 h-2.5 text-jade-400" />
                {tenant?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group">
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-jade-500 rounded-full animate-spin mb-6 shadow-sm"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sinkronisasi Data...</p>
            </div>
          ) : adminProfile ? (
            <div className="px-6 py-4 space-y-6">
              {/* Profile Section */}
              <form id="adminForm" onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-jade-600" />
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Profil Administrator</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-jade-600">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-jade-600" />
                      <input
                        type="text"
                        required
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[13px] focus:border-jade-400 focus:ring-4 focus:ring-jade-50/20 outline-none transition-all shadow-none"
                        placeholder="Nama Admin"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-jade-600">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-jade-600" />
                      <input
                        type="tel"
                        value={form.whatsapp_number}
                        onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[13px] focus:border-jade-400 outline-none transition-all shadow-none"
                        placeholder="0812..."
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email Kredensial (Locked)</label>
                    <input type="email" disabled value={adminProfile.email} className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 text-slate-400 rounded-xl cursor-not-allowed text-[13px] font-bold outline-none opacity-80" />
                  </div>
                </div>
              </form>

              {/* Security Section - Reset to Initial Flow */}
              <div className="pt-3 border-t border-slate-100">
                <div className="bg-linear-to-r from-emerald-50/50 to-slate-50/30 p-4 rounded-xl border-2 border-slate-300 flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-500 shadow-none border-2 border-emerald-100 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10.5px] sm:text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight">Cek Password Awal</p>
                      <p className="text-[8.5px] sm:text-[9.5px] text-slate-400 font-bold leading-normal mt-0.5 uppercase tracking-tight">Gunakan jika admin lupa password</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto shrink-0 flex justify-end">
                    {showInitialPass ? (
                      <div className="w-full sm:w-auto bg-white px-2 py-1.5 border-2 border-emerald-400 rounded-xl flex items-center justify-between sm:justify-start gap-2 animate-in zoom-in-95 duration-200">
                        <div className="px-2 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                          <span className="text-[10px] font-black text-emerald-600 font-mono tracking-[0.2em]">{(adminProfile as any).initial_password || "********"}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setIsConfirmResetOpen(true)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                          >
                            RESET SEKARANG
                          </button>

                          <button onClick={() => setShowInitialPass(false)} className="p-1 hover:bg-slate-100 rounded-md transition-all">
                            <X className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>

                        <ConfirmModal
                          isOpen={isConfirmResetOpen}
                          onClose={() => setIsConfirmResetOpen(false)}
                          onConfirm={handleActualForceReset}
                          title="Konfirmasi Reset Paksa"
                          message={
                            <p>
                              RESET PAKSA? Akun akan dikembalikan ke password awal: <span className="font-mono font-black text-emerald-600">{(adminProfile as any)?.initial_password}</span>. Password saat ini tidak akan bisa digunakan lagi.
                            </p>
                          }
                          confirmLabel="YA, RESET SEKARANG"
                          cancelLabel="BATAL"
                          variant="warning"
                          centerOnScreen={true}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRestoreDefaultPassword}
                        className="w-full sm:w-auto px-4 py-2 font-black text-[9px] uppercase tracking-widest rounded-xl border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <RotateCcw className="w-3 h-3" />
                        CEK PASSWORD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6 space-y-6">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-tight leading-none">Admin Belum Ada</h4>
                  <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase tracking-tighter">Sekolah ini belum memiliki akun administrator aktif.</p>
                </div>
              </div>

              <form id="adminForm" onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-3 h-3 text-jade-600" />
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Daftarkan Admin Baru</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-jade-600">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] outline-none transition-all focus:bg-white"
                      placeholder="Nama Admin"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-jade-600">WhatsApp</label>
                    <input
                      type="tel"
                      value={form.whatsapp_number}
                      onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] outline-none transition-all focus:bg-white"
                      placeholder="0812..."
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-jade-600">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] outline-none transition-all focus:bg-white"
                      placeholder="email@gmail.com"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-jade-600">Password</label>
                    <input
                      type="text"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-black text-[13px] font-mono outline-none transition-all focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t-2 border-slate-300 bg-slate-50/50 flex gap-2 md:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-2 md:px-6 py-2.5 font-black text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest rounded-xl border-2 border-slate-300 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex-1 shadow-none whitespace-nowrap"
          >
            TUTUP
          </button>
          <button
            form="adminForm"
            type="submit"
            disabled={isLoading}
            className="px-2 md:px-8 py-2.5 font-black text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest rounded-xl bg-jade-600 text-white hover:bg-jade-700 shadow-none transition-all active:scale-95 flex items-center justify-center gap-1.5 md:gap-3 flex-1 disabled:opacity-50 border-2 border-jade-700 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {adminProfile ? "SIMPAN PROFIL" : "BUAT ADMIN BARU"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TenantManagement: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [nextTenantCode, setNextTenantCode] = useState("0001");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  const fetchTenants = () => {
    setLoading(true);
    getAllTenants().then((data) => {
      setTenants(data);
      if (data.length > 0) {
        const lastCode = Math.max(...data.map((t) => parseInt(t.code || "0", 10)).filter((n) => !isNaN(n)));
        const nextCode = String(lastCode + 1).padStart(4, "0");
        setNextTenantCode(nextCode);
      } else {
        setNextTenantCode("0001");
      }
      setLoading(false);
    });
  };

  useEffect(fetchTenants, []);

  const filteredTenants = React.useMemo(() => {
    return tenants.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.code || "").toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tenants, searchQuery]);

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const paginatedTenants = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenants.slice(start, start + itemsPerPage);
  }, [filteredTenants, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const getVisiblePages = () => {
    const delta = 1;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  const handleSave = async (data: { tenant: Partial<Tenant>; admin: any }) => {
    // Client-side uniqueness check
    const isCodeTaken = tenants.some((t) => t.code === data.tenant.code && (!selectedTenant || t.id !== selectedTenant.id));

    if (isCodeTaken) {
      addNotification({
        type: "error",
        title: "Kode Sudah Digunakan",
        message: `ID Sekolah "${data.tenant.code}" sudah terdaftar untuk sekolah lain. Gunakan kode yang berbeda.`,
      });
      return;
    }

    try {
      if (selectedTenant) {
        // Edit Mode: Only update tenant
        await updateTenant(selectedTenant.id, { name: data.tenant.name, plan: "basic", code: data.tenant.code }, user);
        addNotification({ type: "success", title: "Berhasil", message: "Data sekolah telah diperbarui." });
      } else {
        // Create Mode: Create Tenant THEN Create Admin
        const newTenant = await createTenant({ name: data.tenant.name!, plan: "basic", code: data.tenant.code }, user);

        // Wait a small moment to ensure the tenant record is committed before auth trigger runs
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Create the Admin User linked to this new tenant
        if (data.admin && data.admin.email && data.admin.password) {
          try {
            // Ensure password is at least 6 characters
            const safeAdminPassword = data.admin.password.length >= 6 ? data.admin.password : `pass_${data.admin.password}`;

            await createUser(
              {
                email: data.admin.email,
                password: safeAdminPassword,
                full_name: data.admin.full_name,
                role: UserRole.ADMIN,
                tenant_id: newTenant.id,
                whatsapp_number: data.admin.whatsapp_number,
              },
              user,
            );
            addNotification({ type: "success", title: "Berhasil", message: `Sekolah "${newTenant.name}" dan adminnya telah dibuat.` });
          } catch (adminError: any) {
            console.error("Failed to create admin user:", adminError);
            addNotification({ type: "error", title: "Admin Gagal Dibuat", message: `Sekolah berhasil dibuat, tetapi gagal membuat user admin: ${adminError.message}` });
          }
        }
      }
      fetchTenants();
    } catch (error: any) {
      console.error("Tenant save error:", error);
      let msg = error.message || "Gagal menyimpan data sekolah.";

      // Map to friendly messages
      if (msg.toLowerCase().includes("duplicate key") && msg.includes("code")) {
        msg = "Kode / ID Sekolah ini sudah digunakan. Mohon gunakan kode lain.";
      } else if (msg.toLowerCase().includes("already registered")) {
        msg = "Email admin sudah terdaftar di sistem. Gunakan email berbeda.";
      } else if (error.code === "42501") {
        msg = "Izin ditolak (Sistem Keamanan). Mohon refresh halaman.";
      }

      addNotification({
        type: "error",
        title: "Gagal Menyimpan",
        message: msg,
      });
    } finally {
      // Loading state is now handled locally in the modal
    }
  };

  const handleDelete = async () => {
    if (!tenantToDelete) return;
    try {
      await deleteTenant(tenantToDelete.id, user, tenantToDelete.name);
      addNotification({ type: "success", title: "Berhasil", message: "Sekolah telah dihapus." });
      fetchTenants();
    } catch (error: any) {
      addNotification({ type: "error", title: "Gagal", message: error.message || "Gagal menghapus sekolah." });
    } finally {
      setIsDeleteModalOpen(false);
      setTenantToDelete(null);
    }
  };

  const openCreateModal = () => {
    setSelectedTenant(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const openAdminManager = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsAdminModalOpen(true);
  };

  const confirmDelete = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Action Bar - Standardized Size */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-1.5 md:gap-2">
        {/* Search */}
        <div className="relative group h-10 w-full xl:flex-1 xl:min-w-50">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-jade-600 transition-colors" />
          <input
            type="text"
            placeholder="Cari sekolah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full pl-10 pr-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-500 transition-all text-[10px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto flex-none">
          <button
            onClick={openCreateModal}
            className="h-10 px-4 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-700 bg-jade-600 text-white hover:bg-jade-700 shadow-none transition-all active:scale-95 flex items-center justify-center w-full xl:w-auto shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="leading-none mt-0.5">Tambah Sekolah</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-none border-2 border-slate-300 overflow-hidden flex flex-col rounded-b-xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="min-w-full divide-y divide-slate-100 border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-300">
                <th className="hidden lg:table-cell w-10 min-10 lg:w-11.25 lg:min-11.25 sticky left-0 bg-slate-300 z-10 px-3 py-4 text-center text-slate-800 font-black uppercase text-[9.5px] tracking-widest border-t border-l border-b border-slate-400">
                  NO
                </th>

                <th className="hidden lg:table-cell w-20 min-20 lg:w-37.5 lg:min-37.5 lg:sticky lg:left-11.25 bg-slate-300 z-10 px-4 py-4 text-left text-slate-800 font-black uppercase text-[9.5px] tracking-widest border-t border-b border-l border-slate-400">
                  KODE
                </th>

                <th className="w-30 min-30 lg:w-auto lg:min-75 sticky left-0 lg:left-48.75 bg-slate-300 z-10 px-4 py-4 text-left text-slate-800 font-black uppercase text-[9.5px] tracking-widest border-t border-b border-r border-l border-slate-400 shadow-none transition-all">
                  NAMA SEKOLAH
                </th>
                <th className="px-2 md:px-6 py-4 text-center text-slate-800 font-black uppercase text-[9.5px] tracking-widest border-t border-b border-r border-slate-400 bg-slate-300 w-24 min-w-24 md:w-auto md:min-w-30">REGISTRASI</th>
                <th className="px-2 md:px-6 py-4 text-center text-slate-800 font-black uppercase text-[9.5px] tracking-widest border-t border-b border-r border-slate-400 bg-slate-300">AKSI</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50" key={currentPage}>
              {paginatedTenants.map((tenant, index) => (
                <tr key={tenant.id} className="group transition-colors hover:bg-slate-50/30">
                  <td className="hidden lg:table-cell sticky left-0 bg-white px-2 py-4 text-[10.5px] font-black text-slate-400 text-center border-r border-b border-slate-100 z-10 transition-colors uppercase">
                    {String((currentPage - 1) * itemsPerPage + index + 1)}
                  </td>

                  <td className="hidden lg:table-cell lg:sticky lg:left-11.25 bg-white px-4 py-4 border-r border-b border-slate-100 z-10 transition-colors">
                    <span className="px-2 py-1 bg-slate-100/50 border border-slate-100 rounded-lg font-mono text-[10px] text-slate-500 font-bold group-hover:bg-white transition-colors">{tenant.code || "-"}</span>
                  </td>

                  <td className="sticky left-0 lg:left-48.75 bg-white px-4 py-4 border-r border-b border-slate-100 z-10 transition-all">
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-jade-600 transition-colors block wrap-break-words leading-tight">{tenant.name}</span>
                  </td>
                  <td className="px-2 md:px-6 py-4 border-r border-b border-slate-100">
                    <span className="text-[9px] md:text-[11px] font-black text-slate-700 tracking-tight text-center block whitespace-normal md:whitespace-nowrap">
                      {new Date(tenant.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-1 md:px-6 py-4 border-b border-slate-100">
                    <div className="flex flex-row justify-center items-center gap-1 md:gap-2">
                      <button
                        onClick={() => openAdminManager(tenant)}
                        title="Kelola Admin Sekolah"
                        className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white border-2 border-slate-300 text-slate-400 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-90 shadow-none"
                      >
                        <UserCog className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(tenant)}
                        title="Edit Sekolah"
                        className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white border-2 border-slate-300 text-slate-400 hover:text-jade-600 hover:border-jade-300 hover:bg-jade-50 transition-all active:scale-90 shadow-none"
                      >
                        <Edit className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(tenant)}
                        title="Hapus Sekolah"
                        className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white border-2 border-slate-300 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all active:scale-90 shadow-none"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTenants.length === 0 && !loading && (
            <div className="p-16 text-center">
              <div className="flex flex-col items-center">
                <Building className="w-12 h-12 text-slate-100 mb-4" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Data sekolah tidak ditemukan</p>
                <p className="text-[10px] text-slate-300 font-bold mt-2">Coba gunakan kata kunci pencarian lain</p>
              </div>
            </div>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && filteredTenants.length > 0 && (
          <div className="bg-slate-100 border-t-2 border-slate-300 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-2 lg:gap-4">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border-2 border-slate-300 rounded-xl px-2 md:px-3 py-1.5 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-jade-50/50 cursor-pointer shadow-none transition-all h-8"
              >
                {[10, 25, 50, 100].map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
              <div className="hidden lg:block w-px h-6 bg-slate-200" />
              <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-tight leading-none whitespace-nowrap">
                <span className="hidden sm:inline">DATA</span>
                <span className="text-slate-600 ml-1">
                  {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredTenants.length)}
                </span>
                <span className="hidden sm:inline text-slate-300 mx-1">/</span>
                <span className="text-jade-600 font-bold ml-0.5">{filteredTenants.length}</span>
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl border-2 transition-all active:scale-90 ${currentPage === 1 ? "text-slate-200 border-slate-200 cursor-not-allowed" : "text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none"}`}
              >
                <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 rotate-180" />
              </button>

              <div className="flex items-center gap-0.5 lg:gap-1 px-1 lg:px-2">
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  if (totalPages > 5) {
                    if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                      if (pNum === 2 || pNum === totalPages - 1)
                        return (
                          <span key={pNum} className="text-slate-300 text-[10px] font-black">
                            ..
                          </span>
                        );
                      return null;
                    }
                  }

                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? "bg-jade-600 text-white shadow-lg shadow-primary-100 border-2 border-jade-600" : "text-slate-400 hover:bg-slate-50 border-2 border-transparent"}`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl border-2 transition-all active:scale-90 ${currentPage === totalPages ? "text-slate-200 border-slate-50 cursor-not-allowed" : "text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm"}`}
              >
                <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <TenantFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSave} initialData={selectedTenant} defaultCode={nextTenantCode} />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Sekolah Permanen?"
        confirmLabel="YA, HAPUS SEKOLAH"
        variant="danger"
        message={
          <div className="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus <strong>{tenantToDelete?.name}</strong> dari platform secara permanen?
            </p>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex gap-3">
              <p className="text-[8px] font-bold text-rose-600 leading-relaxed uppercase tracking-tight">
                <span className="text-[10px] font-bold">Peringatan:</span> Seluruh data santri, guru, ustadz, dan rekaman hafalan yang berkaitan dengan sekolah ini akan ikut terpengaruh atau tidak dapat diakses.
              </p>
            </div>
          </div>
        }
      />

      <AdminManagerModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} tenant={selectedTenant} currentUser={user} />
    </div>
  );
};
