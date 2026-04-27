
import React, { useEffect, useState, useMemo } from 'react';
import { getAllUsersWithTenant, updateUser, getAllTenants } from '../../services/dataService';
import { UserProfile, UserRole, Tenant } from '../../types';
import { Button } from '../../components/ui/Button';
import { Mail, Building, Edit, X, Save, ChevronDown, Filter, RefreshCcw, LogIn, Search, ChevronsLeft, ChevronsRight, ChevronRight, User, ShieldCheck, Lock } from 'lucide-react';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Partial<UserProfile>) => Promise<void>;
  userToEdit: UserProfile | null;
  tenants: Tenant[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSubmit, userToEdit, tenants }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    role: UserRole.SANTRI,
    tenant_id: '' as string | null,
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        full_name: userToEdit.full_name,
        role: userToEdit.role,
        tenant_id: userToEdit.tenant_id,
      });
    }
  }, [userToEdit, isOpen]);

  if (!isOpen || !userToEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...formData, id: userToEdit.id });
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                <Edit className="w-4 h-4" />
            </div>
            <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none">Perbarui Identitas</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-70 truncate max-w-[240px]">
                    {userToEdit.email}
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group">
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300"/>
          </button>
        </div>
        
        <div className="overflow-y-auto px-6 py-5 flex-1 custom-scrollbar">
            <form id="editUserForm" onSubmit={handleSubmit} className="space-y-5">


                <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within:text-indigo-600 transition-colors">Nama Lengkap Pengguna</label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600" />
                        <input 
                            required
                            type="text" 
                            value={formData.full_name}
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                            className="w-full pl-11 pr-5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/20 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Contoh: Abdullah bin Ahmad"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group opacity-60">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Level Otoritas (Role)</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <select
                                disabled
                                value={formData.role}
                                className="w-full pl-11 pr-10 py-2.5 bg-slate-100/50 border border-slate-200 rounded-xl text-slate-500 font-black text-[11px] uppercase tracking-wider outline-none appearance-none cursor-not-allowed"
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>
                                        {role === UserRole.ADMIN ? 'Admin Sekolah' : 
                                         role === UserRole.TEACHER ? 'Ustadz / Guru' :
                                         role === UserRole.SANTRI ? 'Santri' :
                                         role === UserRole.SUPERVISOR ? 'Supervisor' :
                                         role === UserRole.SUPERADMIN ? 'Superadmin' : (role as string).replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                        </div>
                    </div>
                    
                    <div className="group opacity-60">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Institusi Afiliasi</label>
                        <div className="relative">
                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <select
                                disabled
                                value={formData.tenant_id || ''}
                                className="w-full pl-11 pr-10 py-2.5 bg-slate-100/50 border border-slate-200 rounded-xl text-slate-500 font-bold text-[12px] outline-none appearance-none cursor-not-allowed"
                            >
                                <option value="">PLATFORM CENTRAL</option>
                                {tenants.map(tenant => (
                                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                                ))}
                            </select>
                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight text-center leading-relaxed">
                        Perubahan role dapat mempengaruhi hak akses pengguna secara langsung di seluruh platform.
                    </p>
                </div>
            </form>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex gap-3">
             <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 px-5 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
            >
                Batal
            </button>
            <button 
                form="editUserForm"
                type="submit" 
                className="flex-[2] px-5 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Save className="w-3.5 h-3.5" />
                Simpan Profil
            </button>
        </div>
      </div>
    </div>
  );
};


export const GlobalUserManagement: React.FC<{ user: UserProfile; onImpersonate?: (targetUser: UserProfile) => void }> = ({ user, onImpersonate }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filter States
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');

  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [usersData, tenantsData] = await Promise.all([
            getAllUsersWithTenant(),
            getAllTenants(),
        ]);
        setUsers(usersData);
        setTenants(tenantsData);
    } catch (error) {
        console.error("Failed to fetch global user data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle page reset on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRole, selectedTenant, itemsPerPage]);

  const handleEdit = (userToEdit: UserProfile) => {
    setSelectedUser(userToEdit);
    setIsModalOpen(true);
  };
  
  const handleSave = async (data: Partial<UserProfile>) => {
    setGlobalLoading(true);
    try {
        const updatedUser = await updateUser(data, user);
        
        // Update local state for immediate feedback
        const tenantName = tenants.find(t => t.id === updatedUser.tenant_id)?.name || 'Platform';
        setUsers(users.map(u => 
            u.id === updatedUser.id ? { ...u, ...updatedUser, tenant_name: tenantName } : u
        ));
        addNotification({ type: 'success', title: 'Berhasil', message: `Data pengguna ${updatedUser.full_name} telah diperbarui.` });

    } catch (error) {
        console.error("Failed to update user:", error);
        addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat memperbarui pengguna.' });
    } finally {
        setGlobalLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                              u.email.toLowerCase().includes(search.toLowerCase());
        
        const matchesRole = selectedRole === 'all' || u.role === selectedRole;
        
        const matchesTenant = selectedTenant === 'all' || 
                              (selectedTenant === 'platform' && !u.tenant_id) || 
                              u.tenant_id === selectedTenant;

        return matchesSearch && matchesRole && matchesTenant;
    });
  }, [users, search, selectedRole, selectedTenant]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const resetFilters = () => {
    setSearch('');
    setSelectedRole('all');
    setSelectedTenant('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Top Utility Strip - Optimized for Mobile Density */}
      <div className="flex flex-row items-center gap-1.5 lg:gap-4 bg-white/40 p-1.5 lg:p-2 rounded-2xl lg:rounded-[24px] border border-white/20 backdrop-blur-md">
          {/* Search Area */}
          <div className="relative flex-1 group">
              <Search className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 w-3.5 lg:w-4 h-3.5 lg:h-4 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
              <input 
                  type="text" 
                  placeholder="Cari..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 lg:pl-12 pr-2 lg:pr-5 py-1.5 lg:py-3 text-[10px] lg:text-[13px] font-bold border border-slate-100 lg:border-2 lg:border-slate-50 rounded-xl lg:rounded-2xl focus:border-emerald-400 bg-white transition-all outline-none h-8 lg:h-12 shadow-sm"
              />
          </div>
          
          <div className="flex items-center gap-1.5 lg:gap-3">
              {/* Role Filter */}
              <div className="relative group shrink-0">
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="pl-3 lg:pl-6 pr-6 lg:pr-10 py-1.5 lg:py-3 bg-white border border-slate-100 lg:border-2 lg:border-slate-50 rounded-xl lg:rounded-2xl text-[8.5px] lg:text-[10px] font-black uppercase tracking-tighter lg:tracking-widest text-slate-600 focus:border-emerald-400 outline-none transition-all cursor-pointer appearance-none min-w-[70px] lg:min-w-[120px] h-8 lg:h-12 shadow-sm"
                  >
                      <option value="all">SEMUA ROLE</option>
                      {Object.values(UserRole).map(role => (
                          <option key={role} value={role}>{role.toUpperCase().replace('_', ' ')}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
              </div>

              {/* Tenant Filter (Hidden on very small mobile, visible on lg or sm) */}
              <div className="relative group shrink-0 hidden sm:block">
                  <select 
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="pl-3 lg:pl-6 pr-6 lg:pr-10 py-1.5 lg:py-3 bg-white border border-slate-100 lg:border-2 lg:border-slate-50 rounded-xl lg:rounded-2xl text-[8.5px] lg:text-[10px] font-black uppercase tracking-tighter lg:tracking-widest text-slate-600 focus:border-emerald-400 outline-none transition-all cursor-pointer appearance-none min-w-[80px] lg:min-w-[180px] h-8 lg:h-12 shadow-sm max-w-[200px] truncate"
                  >
                      <option value="all">SEMUA SEKOLAH</option>
                      <option value="platform">SYSTEM</option>
                      {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
              </div>

              <button 
                onClick={resetFilters} 
                className="p-2 lg:p-3 rounded-xl border border-slate-100 lg:border-2 lg:border-slate-50 bg-white text-slate-400 hover:text-emerald-600 transition-all active:scale-95 shadow-sm h-8 lg:h-12 flex items-center justify-center shrink-0"
                title="Reset Filter"
              >
                  <RefreshCcw className="w-3.5 h-3.5" />
              </button>
          </div>
      </div>

      <div className="bg-white shadow-sm border-2 border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full table-fixed divide-y divide-slate-100 border-separate border-spacing-0">
            <thead>
                <tr className="bg-white">
                <th className="w-[35px] min-w-[35px] lg:w-[45px] lg:min-w-[45px] sticky left-0 bg-white z-[30] px-2 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100">NO</th>
                <th className="w-[150px] min-w-[150px] lg:w-[250px] lg:min-w-[250px] sticky left-[35px] lg:left-[45px] bg-white z-[30] px-4 py-4 text-left text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">PENGGUNA</th>
                <th className="w-[120px] min-w-[120px] px-4 py-4 text-left text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 bg-white">LEVEL / ROLE</th>
                <th className="w-[180px] min-w-[180px] px-4 py-4 text-left text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 bg-white">INSTITUSI</th>
                <th className="w-[200px] min-w-[200px] px-4 py-4 text-left text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 bg-white">EMAIL ADDRESS</th>
                <th className="w-[100px] min-w-[100px] px-4 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-100 bg-white">AKSI</th>
                </tr>
            </thead>
            <tbody key={currentPage} className="bg-white divide-y divide-slate-50 animate-fade-in">
                {paginatedUsers.map((u, index) => (
                <tr key={u.id} className="group transition-colors hover:bg-slate-50/30">
                    <td className="sticky left-0 bg-white px-2 py-4 text-[10.5px] font-black text-slate-400 text-center border-r-2 border-b border-slate-100 z-10 transition-colors uppercase">
                        {String(index + 1 + (currentPage - 1) * itemsPerPage)}
                    </td>
                    <td className="sticky left-[35px] lg:left-[45px] bg-white px-4 py-4 border-r-2 border-b border-slate-100 z-10 transition-colors">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate max-w-[120px] lg:max-w-none capitalize">{u.full_name}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[120px] lg:max-w-none opacity-60 sm:hidden">{u.email}</span>
                        </div>
                    </td>
                    <td className="px-4 py-4 border-r-2 border-b border-slate-100">
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-tight rounded-md border shadow-sm whitespace-nowrap
                            ${u.role === UserRole.SUPERADMIN ? 'bg-slate-50 text-slate-600 border-slate-100' :
                            u.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                            u.role === UserRole.TEACHER ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {u.role === UserRole.ADMIN ? 'Admin Sekolah' : 
                             u.role === UserRole.TEACHER ? 'Ustadz / Guru' :
                             u.role === UserRole.SANTRI ? 'Santri' :
                             u.role === UserRole.SUPERVISOR ? 'Supervisor' :
                             u.role === UserRole.SUPERADMIN ? 'Superadmin' : (u.role as string).replace('_', ' ')}
                        </span>
                    </td>
                    <td className="px-4 py-4 border-r-2 border-b border-slate-100">
                        <span className="text-[11px] font-black text-slate-700 tracking-tight truncate block">
                            {u.tenant_name || 'System Platform'}
                        </span>
                    </td>
                    <td className="px-4 py-4 border-r-2 border-b border-slate-100">
                        <div className="flex flex-col gap-0.5 truncate">
                            <span className="text-[11.5px] font-black text-slate-700 tracking-tight">{u.email}</span>
                        </div>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-100">
                        <div className="flex justify-center gap-2">
                             <button 
                                onClick={() => handleEdit(u)}
                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-100 transition-all bg-white shadow-sm"
                                title="Edit"
                            >
                                <Edit className="w-4 h-4"/>
                            </button>
                        </div>
                    </td>
                </tr>
              ))}
            </tbody>
            </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredUsers.length > 0 && (
            <div className="bg-[#F8FAFC] border-t border-slate-100 px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white border-2 border-slate-100 rounded-xl px-3 py-1.5 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-50/50 cursor-pointer shadow-sm transition-all"
                        >
                            {[10, 25, 50, 100].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-slate-200" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight leading-none whitespace-nowrap">
                        <span className="hidden sm:inline">DATA</span> {((currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} <span className="hidden sm:inline text-slate-300">/</span> <span className="text-emerald-600 ml-0.5">{filteredUsers.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={`p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-1 px-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const pNum = i + 1;
                            if (totalPages > 5) {
                                if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                                    if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-300 text-[10px] font-black">..</span>;
                                    return null;
                                }
                            }
                            
                            return (
                                <button 
                                    key={pNum}
                                    onClick={() => setCurrentPage(pNum)}
                                    className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 border-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
                                >
                                    {pNum}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={`p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {filteredUsers.length === 0 && !loading && (
             <div className="p-20 text-center flex flex-col items-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-[24px] border-2 border-slate-50 flex items-center justify-center text-slate-200 mb-4 shadow-inner">
                    <Filter className="w-8 h-8" />
                 </div>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Data pengguna tidak ditemukan</p>
                 <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">Gunakan kata kunci atau filter lain</p>
             </div>
        )}
      </div>
      
      <EditUserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        userToEdit={selectedUser}
        tenants={tenants}
      />
    </div>
  );
};
