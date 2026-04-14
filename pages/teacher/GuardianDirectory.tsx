
import React, { useEffect, useState, useMemo } from 'react';
import { getUsers, getStudentsByHalaqah, getHalaqahs } from '../../services/dataService';
import { UserProfile, UserRole, Student, Halaqah } from '../../types';
import { Search, Mail, Phone, User, MessageCircle, ChevronRight, School, ArrowUpRight, GraduationCap } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// New data structure for the view
interface GuardianWithStudents {
    guardian: UserProfile;
    students: Student[];
}

export const GuardianDirectory: React.FC<{ tenantId: string, user: UserProfile }> = ({ tenantId, user }) => {
    const [guardianData, setGuardianData] = useState<GuardianWithStudents[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Find the teacher's halaqah
                const allHalaqahs = await getHalaqahs(tenantId);
                const teacherHalaqah = allHalaqahs.find(h => h.teacher_id === user.id);

                if (!teacherHalaqah) {
                    setGuardianData([]);
                    setLoading(false);
                    return;
                }

                // 2. Get students in that halaqah
                const studentsInHalaqah = await getStudentsByHalaqah(teacherHalaqah.id);

                if (studentsInHalaqah.length === 0) {
                    setGuardianData([]);
                    setLoading(false);
                    return;
                }

                // 3. Get unique parent IDs from those students
                const parentIds = Array.from(new Set(studentsInHalaqah.map(s => s.parent_id).filter(Boolean)));
                
                if (parentIds.length === 0) {
                    setGuardianData([]);
                    setLoading(false);
                    return;
                }

                // 4. Fetch the relevant guardian profiles
                const allUsers = await getUsers(tenantId);
                const relevantGuardians = allUsers.filter(u => parentIds.includes(u.id));

                // 5. Build the final data structure: Guardian -> [Students]
                const finalData: GuardianWithStudents[] = relevantGuardians.map(guardian => ({
                    guardian,
                    students: studentsInHalaqah.filter(student => student.parent_id === guardian.id)
                }));
                
                setGuardianData(finalData);

            } catch (error) {
                console.error("Failed to fetch guardian directory data:", error);
                setGuardianData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tenantId, user.id]);

    // Search Filter (Search by Student Name OR Guardian Name)
    const filteredGuardians = useMemo(() => {
        if (!search) return guardianData;
        const term = search.toLowerCase();
        return guardianData.filter(({ guardian, students }) => 
            guardian.full_name.toLowerCase().includes(term) ||
            students.some(s => s.full_name.toLowerCase().includes(term))
        );
    }, [guardianData, search]);

    const formatWhatsAppUrl = (phoneNumber: string) => {
        let cleanNumber = phoneNumber.replace(/\D/g, '');
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.slice(1);
        }
        return `https://wa.me/${cleanNumber}`;
    };

    return (
        <div className="animate-fade-in pb-10 relative">
            {/* Sticky Header Block */}
            <div className="sticky top-0 z-30 bg-[#F8F9FB]/95 backdrop-blur-sm py-4 border-b border-slate-200/60 -mx-4 px-4 lg:-mx-8 lg:px-8 mb-6 transition-all shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 max-w-7xl mx-auto">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Kontak Santri</h2>
                        <p className="text-slate-500 text-sm">Daftar kontak santri dari halaqah Anda</p>
                    </div>
                    <div className="w-full md:w-80">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Cari nama santri..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Guardian List Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-7xl mx-auto">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-2"></div>
                        Memuat data...
                    </div>
                ) : filteredGuardians.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredGuardians.map(({ guardian, students }) => (
                            <div key={guardian.id} className="p-5 flex flex-col md:flex-row items-start justify-between gap-6 group">
                                
                                {/* LEFT: Guardian Info */}
                                <div className="flex items-center gap-4 w-full md:w-1/3 min-w-[280px]">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-200 shrink-0 capitalize">
                                        {guardian.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-base truncate capitalize">{guardian.full_name}</h4>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                            {guardian.whatsapp_number ? (
                                                <a 
                                                    href={formatWhatsAppUrl(guardian.whatsapp_number)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 hover:text-green-600 transition-colors"
                                                >
                                                    <MessageCircle className="w-4 h-4" /> 
                                                    <span>{guardian.whatsapp_number}</span>
                                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                                </a>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-slate-400 italic">
                                                    <Phone className="w-4 h-4" /> 
                                                    <span>No. HP tidak ada</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: Students List */}
                                <div className="w-full md:w-2/3 flex-1 pl-4 md:pl-6 border-l-0 md:border-l-2 border-slate-100/80">
                                    <div className="space-y-3">
                                        {students.map(student => (
                                            <div key={student.id} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <GraduationCap className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <p className="font-semibold text-slate-700 capitalize">{student.full_name}</p>
                                                        <p className="text-xs text-slate-500">NIS: {student.nis || '-'} • Juz {student.current_juz}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 text-center">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100">
                            <Search className="w-10 h-10 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800">Tidak Ditemukan</h3>
                        <p className="text-slate-500 mt-1">{search ? `Tidak ada data yang cocok dengan pencarian "${search}".` : 'Tidak ada data kontak di halaqah Anda.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
