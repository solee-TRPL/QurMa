import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, Student, MemorizationRecord, MemorizationType, MemorizationStatus, Halaqah, Tenant } from '../../types';
import { getHalaqahs, getStudentsByHalaqah, getWeeklyMemorization, upsertWeeklyMemorization, createRecord, deleteRecord, getTenant, updateTenant, getLastProgressByType } from '../../services/dataService';
import { BookOpen, Search, User, Users, Calendar, Plus, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, XCircle, Filter, Save, X, Book, Check, Eye, HelpCircle, AlertTriangle, Settings2, ChevronDown, Circle, HeartPulse, FileText, UserX } from 'lucide-react';
import { useNotification } from '../../lib/NotificationContext';
import { useLoading } from '../../lib/LoadingContext';
import { SURAH_DATA } from '../../lib/quranData';
import { calculateLines, calculatePages, getNextAyah } from '@/lib/quranUtils';
import { QURAN_NAME_TO_ID } from '../../lib/quranNameToId';

interface InputHafalanProps {
    user: UserProfile;
    onSetUnsavedChanges?: (hasChanges: boolean) => void;
    saveTrigger?: number;
    onSaveSuccess?: () => void;
    isGlobalModalOpen?: boolean;
}

export const InputHafalan: React.FC<InputHafalanProps> = ({ user, onSetUnsavedChanges, saveTrigger, onSaveSuccess, isGlobalModalOpen }) => {
    const getStudentIdFromUrl = () => new URLSearchParams(window.location.search).get('studentId');
    const [studentIdParam, setStudentIdParam] = useState(getStudentIdFromUrl());

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [records, setRecords] = useState<MemorizationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('weekOffset') || '0');
    });

    const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]); // Default 7 Days: Mon(1)-Sun(0)
    
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isFetchingRecords, setIsFetchingRecords] = useState(false);
    const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
    const [showLocalUnsavedModal, setShowLocalUnsavedModal] = useState(false);
    const [tenant, setTenant] = useState<any>(null);
    const [lastProgress, setLastProgress] = useState<Record<string, MemorizationRecord | null>>({});
    
    const { addNotification } = useNotification();
    const { setLoading: setGlobalLoading } = useLoading();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    
    const selectedStudentRef = React.useRef(selectedStudent);
    useEffect(() => {
        selectedStudentRef.current = selectedStudent;
    }, [selectedStudent]);

    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const weekDates = useMemo(() => {
        const today = new Date();
        const day = today.getDay(); // 0-6
        // Adjust to Monday: Monday is 1, Sunday is 0 -> diff: (1 - day)
        // If Sunday (0), it goes back 6 days to prev Monday.
        const diff = (day === 0 ? -6 : 1) - day + (currentWeekOffset * 7);
        
        const start = new Date(today);
        start.setDate(today.getDate() + diff);
        
        const dates = [];
        // Loop through 7 full days starting from Monday
        for (let i = 0; i < 7; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            // Only add to table if it's an active day based on config
            if (activeDays.includes(current.getDay())) {
                dates.push(getLocalDateString(current));
            }
        }
        return dates;
    }, [currentWeekOffset, activeDays]);

    const weekDisplayRange = useMemo(() => {
        if (weekDates.length === 0) return '';
        const start = new Date(weekDates[0]);
        const end = new Date(weekDates[weekDates.length - 1]);
        
        const startDay = start.getDate().toString().padStart(2, '0');
        const startMonth = start.toLocaleDateString('id-ID', { month: 'short' });
        const endDay = end.getDate().toString().padStart(2, '0');
        const endMonth = end.toLocaleDateString('id-ID', { month: 'short' });
        const year = end.getFullYear();

        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    }, [weekDates]);

    // Form State
    const [formData, setFormData] = useState({
        type: MemorizationType.SABAQ,
        surah_name: 'Al-Fatihah',
        ayat_start: 1,
        ayat_end: 7,
        status: MemorizationStatus.EMPTY,
        record_date: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })(),
        keterangan: '-',
        is_verified: false,
        is_read_by_parent: false,
        jumlah: 0
    });


    const fetchData = async (force: boolean = false) => {
        if (!user.tenant_id) return;
        setLoading(true);
        try {
            const [allHalaqahs, tenantData] = await Promise.all([
                getHalaqahs(user.tenant_id),
                getTenant(user.tenant_id)
            ]);
            
            // Load Cycle Config
            if (tenantData) {
                setTenant(tenantData);
                if (tenantData?.cycle_config?.activeDays) {
                    setActiveDays(tenantData.cycle_config.activeDays);
                }
            }

            const myHalaqah = allHalaqahs.find(h => h.teacher_id === user.id);
            
            if (myHalaqah) {
                const studentData = await getStudentsByHalaqah(myHalaqah.id);
                setStudents(studentData);
                
                // Sync from URL if available
                if (studentData.length > 0) {
                    if (studentIdParam) {
                        const found = studentData.find(s => s.id === studentIdParam);
                        if (found) setSelectedStudent(found);
                        else setSelectedStudent(studentData[0]);
                    } else {
                        setSelectedStudent(studentData[0]);
                    }
                }
            }
        } catch (error) {
            addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memuat data santri.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.id]);

    useEffect(() => {
        setRecords([]);
        setPendingChanges({});
        
        // Comprehensive URL Sync (Student + Week)
        const url = new URL(window.location.href);
        let changed = false;

        if (selectedStudent && selectedStudent.id !== studentIdParam) {
            url.searchParams.set('studentId', selectedStudent.id);
            setStudentIdParam(selectedStudent.id);
            changed = true;
        }

        if (url.searchParams.get('weekOffset') !== currentWeekOffset.toString()) {
            url.searchParams.set('weekOffset', currentWeekOffset.toString());
            changed = true;
        }

        if (changed) {
            window.history.replaceState({}, '', url.toString());
        }

        if (selectedStudent) {
            fetchRecords();
        }
    }, [selectedStudent, currentWeekOffset]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()));
    }, [students, search]);

    const recordsByDate = useMemo(() => {
        const map: Record<string, MemorizationRecord[]> = {};
        records.forEach(rec => {
            const date = rec.record_date.split('T')[0];
            if (!map[date]) map[date] = [];
            map[date].push(rec);
        });
        return map;
    }, [records]);

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        
        setGlobalLoading(true);
        try {
            const weekStart = weekDates[0];
            const currentRecordsData = await getWeeklyMemorization(selectedStudent.id, weekStart);
            const newRecordsData = { ...currentRecordsData };

            const date = formData.record_date;
            const type = formData.type;

            const recordPayload = {
                surah_name: formData.surah_name,
                jumlah: formData.jumlah || formData.ayat_end, // Use calculated lines, fallback to ayat_end if null (previous behavior)
                ayat_end: formData.ayat_start, // Last Verse Number
                status: formData.status,
                keterangan: formData.keterangan || '-',
                score: undefined,
                is_verified: false,
                created_by: user.id
            };

            if (!newRecordsData[date]) newRecordsData[date] = {};
            newRecordsData[date][type] = recordPayload;

            // DUAL SAVE: Weekly JSON (for Target Table) + Individual Record (for Dashboard/Activity)
            await Promise.all([
                upsertWeeklyMemorization(selectedStudent.id, weekStart, newRecordsData, user, selectedStudent.full_name),
                createRecord({
                    student_id: selectedStudent.id,
                    teacher_id: user.id,
                    type: type,
                    record_date: date,
                    surah_name: recordPayload.surah_name,
                    ayat_start: recordPayload.ayat_end, // DB ayat_start = UI ayat_end (Position)
                    ayat_end: recordPayload.jumlah,     // DB ayat_end   = UI jumlah (Volume)
                    status: recordPayload.status,
                    keterangan: recordPayload.keterangan
                }, user, selectedStudent.full_name)
            ]);
            
            addNotification({ type: 'success', title: 'Berhasil', message: 'Setoran hafalan berhasil dicatat.' });
            setIsAddModalOpen(false);
            fetchRecords();
        } catch (error) {
            console.error("Add record failed:", error);
            addNotification({ type: 'error', title: 'Gagal', message: 'Gagal mencatat setoran.' });
        } finally {
            setGlobalLoading(false);
        }
    };

    const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
    const [saveCounter, setSaveCounter] = useState(0);

    useEffect(() => {
        const hasChanges = Object.keys(pendingChanges).length > 0;
        if (onSetUnsavedChanges) onSetUnsavedChanges(hasChanges);
        
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // We DON'T reset to false here because the component might unmount 
            // during a successful navigation. The parent (App.tsx) handles resetting.
        };
    }, [pendingChanges, onSetUnsavedChanges]);

    const fetchRecords = async () => {
        if (!selectedStudent) return;
        
        const targetId = selectedStudent.id;
        const weekStart = weekDates[0];
        setIsFetchingRecords(true);
        try {
            const recordsData = await getWeeklyMemorization(targetId, weekStart);
            // Only update if the user hasn't switched to another student
            if (selectedStudentRef.current?.id === targetId) {
                // UNPACK: Convert JSONB map back to virtual records array for UI
                const virtualRecords: MemorizationRecord[] = [];
                Object.entries(recordsData).forEach(([date, dayRecords]: [string, any]) => {
                    Object.entries(dayRecords).forEach(([type, record]: [string, any]) => {
                        virtualRecords.push({
                            id: `${date}|${type}`, // Virtual ID since they share one DB row
                            student_id: targetId,
                            type: type as MemorizationType,
                            record_date: date,
                            ...record
                        });
                    });
                });
                setRecords(virtualRecords);
                setPendingChanges({}); 
                
                // Fetch last progress for reference
                const lastMap = await getLastProgressByType(targetId);
                setLastProgress(lastMap);
            }
        } catch (error) {
            console.error("Fetch records failed:", error);
        } finally {
            setIsFetchingRecords(false);
        }
    };

    // Auto-scroll to today
    useEffect(() => {
        if (selectedStudent && records.length > 0) {
            const todayStr = getLocalDateString(new Date());
            // Small delay to ensure table is fully rendered
            const timer = setTimeout(() => {
                const todayElement = document.getElementById(`row-${todayStr}`);
                if (todayElement && tableContainerRef.current) {
                    todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [selectedStudent, records.length]);

    const toggleVerification = (date: string, type: MemorizationType, rec?: MemorizationRecord) => {
        const key = `${date}|${type}`;
        const currentVerified = pendingChanges[key]?.is_verified ?? rec?.is_verified ?? false;
        
        setPendingChanges(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                is_verified: !currentVerified
            }
        }));
    };

    const findLatestPosition = (type: MemorizationType, currentDate: string): { surah_name: string; ayat_pos: number } | null => {
        const sortedDates = [...weekDates].sort((a, b) => a.localeCompare(b)); // Ascending: 20, 21, 22...
        const currentIndex = sortedDates.indexOf(currentDate);
        
        // Check dates BEFORE currentDate in reverse
        for (let i = currentIndex - 1; i >= 0; i--) {
            const d = sortedDates[i];
            const key = `${d}|${type}`;
            
            // Check pending first
            const pending = pendingChanges[key];
            if (pending?.surah_name && pending?.ayat_end) {
                return { surah_name: pending.surah_name, ayat_pos: pending.ayat_end };
            }
            
            // Check existing
            const existing = (recordsByDate[d] || []).find(r => r.type === type);
            if (existing?.surah_name && existing?.ayat_end) {
                return { surah_name: existing.surah_name, ayat_pos: existing.ayat_end };
            }
        }

        // Fallback to lastProgress
        const last = lastProgress[type];
        if (last) {
            return { surah_name: last.surah_name, ayat_pos: last.ayat_start };
        }
        return null;
    };

    const handleLocalChange = (date: string, type: MemorizationType, value: string, subType: string = 'value') => {
        if (!selectedStudent) return;
        
        const key = `${date}|${type}`;

        // Handle Status Dropdown (String)
        if (subType === 'status') {
            const isNotDepositing = value === MemorizationStatus.TIDAK_SETOR || 
                                     value === MemorizationStatus.SAKIT || 
                                     value === MemorizationStatus.IZIN || 
                                     value === MemorizationStatus.ALPA;
            
            // Validation: LANCAR/TIDAK LANCAR requires Surah and Jumlah
            if (value === MemorizationStatus.LANCAR || value === MemorizationStatus.TIDAK_LANCAR) {
                const current = {
                    ...((recordsByDate[date] || []).find(r => r.type === type) || {}),
                    ...(pendingChanges[key] || {})
                };

                if (!current.surah_name || !current.jumlah || current.jumlah <= 0) {
                    addNotification({ 
                        type: 'error', 
                        title: 'Data Tidak Lengkap', 
                        message: `Mohon isi Nama Surah dan Total Baris/Hal terlebih dahulu sebelum memberi keterangan ${value}.` 
                    });
                    return;
                }
            }

            const lastRef = lastProgress[type];

            setPendingChanges(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    status: value as MemorizationStatus,
                    keterangan: value, // Ensure both fields are synchronized
                    ...(isNotDepositing ? {
                        surah_name: lastRef?.surah_name || '',
                        ayat_end: lastRef?.ayat_start || 0, // Using ayat_start as it represents the "current position" in database
                        jumlah: lastRef?.ayat_end || 0,     // Using ayat_end as it represents the "volume/count" in database
                        // Wait! In the grid: 
                        // database ayat_start = UI ayat_end (Position)
                        // database ayat_end   = UI jumlah (Volume)
                    } : {}),
                    is_verified: false,
                    is_read_by_parent: false
                }
            }));
            return;
        }

        if (subType === 'surah_name') {
            const last = findLatestPosition(type, date);
            let suggestedAyat = value === '' ? 0 : 1;
            let autoJumlah = 0;

            if (value && last) {
                const nextPoint = getNextAyah(last.surah_name, last.ayat_pos);
                if (nextPoint) {
                    if (value === last.surah_name) {
                        suggestedAyat = last.ayat_pos + 1;
                    } 
                    else if (value === nextPoint.surah) {
                        suggestedAyat = nextPoint.ayah;
                    }
                    
                    if (suggestedAyat > 0) {
                        autoJumlah = (type === MemorizationType.SABAQ)
                            ? calculateLines(nextPoint.surah, nextPoint.ayah, value, suggestedAyat)
                            : calculatePages(nextPoint.surah, nextPoint.ayah, value, suggestedAyat);
                    }
                }
            }

            setPendingChanges(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    surah_name: value,
                    ayat_end: suggestedAyat,
                    jumlah: autoJumlah > 0 ? autoJumlah : 0,
                    is_verified: false,
                    is_read_by_parent: false
                }
            }));
            return;
        }

        // Handle empty/clear input
        if (value.trim() === '') {
            setPendingChanges(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    [subType === 'score' ? 'score' : subType === 'ayat_end' ? 'ayat_end' : 'jumlah']: null,
                    is_verified: false,
                    is_read_by_parent: false
                }
            }));
            return;
        }

        const numValue = parseInt(value);
        if (isNaN(numValue)) {
            // Still allow null/empty for deletion
            if (value.trim() === '') return; 
        }

        setPendingChanges(prev => {
            const current = {
                ...((recordsByDate[date] || []).find(r => r.type === type) || {}),
                ...(prev[key] || {})
            };

            const updatedChanges = {
                ...prev[key],
                [subType === 'score' ? 'score' : subType === 'ayat_end' ? 'ayat_end' : 'jumlah']: value.trim() === '' ? null : numValue,
                is_verified: false,
                is_read_by_parent: false
            };

            // AUTO-CALCULATE LINES
            // Triggered when current surah and ayat are set
            if (subType === 'ayat_end' || subType === 'surah_name') {
                const targetSurah = subType === 'surah_name' ? value : current.surah_name;
                const targetAyat = subType === 'ayat_end' ? numValue : current.ayat_end;
                const last = findLatestPosition(type, date);

                if (targetSurah && targetAyat && last) {
                    const startPoint = getNextAyah(last.surah_name, last.ayat_pos);
                    if (startPoint) {
                        const calculatedVal = (type === MemorizationType.SABAQ)
                            ? calculateLines(startPoint.surah, startPoint.ayah, targetSurah, targetAyat)
                            : calculatePages(startPoint.surah, startPoint.ayah, targetSurah, targetAyat);
                        
                        if (calculatedVal > 0) {
                            updatedChanges.jumlah = calculatedVal;
                        }
                    }
                }
            }

            return {
                ...prev,
                [key]: updatedChanges
            };
        });
    };

    const handleMassSave = async (isManual: boolean = false, isSilent: boolean = false) => {
        if (!selectedStudent || Object.keys(pendingChanges).length === 0) {
            if (isManual) {
                addNotification({ type: 'info', title: 'Info', message: 'Tidak ada perubahan untuk disimpan.' });
            }
            return;
        }
        
        setGlobalLoading(true);
        try {
            // PACK: Merge existing records with pending changes into one JSONB object
            const weekStart = weekDates[0];
            const currentRecordsData = await getWeeklyMemorization(selectedStudent.id, weekStart);
            const newRecordsData = { ...currentRecordsData };

            Object.entries(pendingChanges).forEach(([key, changes]) => {
                const [date, type] = key.split('|');
                const currentChanges = changes as any;

                // Handle deletion (EMPTY status)
                if (currentChanges.status === MemorizationStatus.EMPTY) {
                    if (newRecordsData[date]) {
                        delete newRecordsData[date][type];
                        if (Object.keys(newRecordsData[date]).length === 0) {
                            delete newRecordsData[date];
                        }
                    }
                    return;
                }

                if (!newRecordsData[date]) newRecordsData[date] = {};
                
                const existing = newRecordsData[date][type] || {};
                
                // Explicitly check for property existence to honor 'null' (cleared) state
                const hasJumlah = Object.prototype.hasOwnProperty.call(currentChanges, 'jumlah');
                const hasAyatEnd = Object.prototype.hasOwnProperty.call(currentChanges, 'ayat_end');

                newRecordsData[date][type] = {
                    ...existing,
                    ...changes,
                    // Map to new UI structure for JSONB
                    surah_name: currentChanges.surah_name ?? existing.surah_name ?? '',
                    jumlah: hasJumlah ? (currentChanges.jumlah ?? 0) : (existing.jumlah ?? 0),
                    ayat_end: hasAyatEnd ? (currentChanges.ayat_end ?? 0) : (existing.ayat_end ?? 0),
                    status: currentChanges.status ?? existing.status ?? MemorizationStatus.LANCAR,
                    keterangan: currentChanges.status ?? existing.status ?? MemorizationStatus.LANCAR
                };
                // Cleanup old keys if they exist in the object
                delete (newRecordsData[date][type] as any).ayat_start;
            });

            // DUAL SAVE: Update Weekly JSON + Create/Update Individual Records
            const savePromises = Object.entries(pendingChanges).map(([key, changes]) => {
                const [date, type] = key.split('|');
                const currentChanges = changes as any;

                if (currentChanges.status === MemorizationStatus.EMPTY) {
                    return deleteRecord(selectedStudent.id, type, date, user, selectedStudent.full_name);
                }

                const existing = newRecordsData[date]?.[type];
                if (!existing) return Promise.resolve();
                
                // Map UI keys to DB Columns
                return createRecord({
                    student_id: selectedStudent.id,
                    teacher_id: user.id,
                    type: type as MemorizationType,
                    record_date: date,
                    surah_name: existing.surah_name,
                    ayat_start: existing.ayat_end || 0, // Posisi Ayat (from UI ayat_end)
                    ayat_end: existing.jumlah || 0,   // Volume (from UI jumlah)
                    status: existing.status,
                    keterangan: existing.status,
                    is_verified: existing.is_verified
                }, user, selectedStudent.full_name);
            });

            await Promise.all([
                upsertWeeklyMemorization(selectedStudent.id, weekStart, newRecordsData, user, selectedStudent.full_name),
                ...savePromises
            ]);
            
            await fetchRecords();
            setSaveCounter(c => c + 1);
            
            if (!isSilent) {
                // Construct a detailed success message
                const keys = Object.keys(pendingChanges);
                let progressDetail = '';

                if (keys.length === 1) {
                    const ch = pendingChanges[keys[0]] as any;
                    if (ch.surah_name && ch.ayat_end) {
                        progressDetail = ` (${ch.surah_name}: ${ch.ayat_end})`;
                    }
                } else if (keys.length > 1) {
                    // Get the record with the most recent date from the pending collection
                    const sorted = keys.sort((a, b) => b.localeCompare(a));
                    const latest = pendingChanges[sorted[0]] as any;
                    if (latest.surah_name && latest.ayat_end) {
                        progressDetail = ` (Terakhir: ${latest.surah_name}: ${latest.ayat_end})`;
                    }
                }

                addNotification({ 
                    type: 'success', 
                    title: 'Setoran Berhasil Disimpan', 
                    message: `Progress ${selectedStudent.full_name} berhasil diperbarui${progressDetail}.` 
                });
            }
        } catch (error: any) {
            console.error("Mass save error:", error);
            addNotification({ 
                type: 'error', 
                title: 'Gagal Menyimpan', 
                message: error.message || 'Terjadi kesalahan saat menyimpan data.' 
            });
        } finally {
            setGlobalLoading(false);
        }
    };

    // Add effect to handle save trigger from parent
    useEffect(() => {
        if (saveTrigger && saveTrigger > 0) {
            handleMassSave(false, true).then(() => {
                if (onSaveSuccess) onSaveSuccess();
            }).catch(() => {
                // If save fails, we don't proceed with navigation so user can fix issues
                console.error("Auto-save failed during navigation.");
            });
        }
    }, [saveTrigger]);

    const handleStudentSwitch = (student: Student) => {
        if (student.id === selectedStudent?.id) return;
        
        if (Object.keys(pendingChanges).length > 0) {
            setPendingStudent(student);
            setShowLocalUnsavedModal(true);
            return;
        }
        
        setSelectedStudent(student);
    };

    const proceedStudentSwitch = () => {
        if (pendingStudent) {
            setSelectedStudent(pendingStudent);
            setPendingStudent(null);
            setPendingChanges({}); 
        }
        setShowLocalUnsavedModal(false);
    };

    const handleLocalSaveAndSwitch = async () => {
        await handleMassSave(false, true);
        proceedStudentSwitch();
    };

    // Prevent double modal: if app level modal is open, hide local modal
    useEffect(() => {
        if (isGlobalModalOpen) {
            setShowLocalUnsavedModal(false);
            setPendingStudent(null);
        }
    }, [isGlobalModalOpen]);

    const getStatusIcon = (status: MemorizationStatus) => {
        switch (status) {
            case MemorizationStatus.LANCAR: return <Check className="w-4 h-4 text-emerald-500" />;
            case MemorizationStatus.TIDAK_LANCAR: return <Circle className="w-4 h-4 text-amber-500" />;
            case MemorizationStatus.TIDAK_SETOR: return <X className="w-4 h-4 text-rose-500" />;
            case MemorizationStatus.SAKIT: return <HeartPulse className="w-4 h-4 text-indigo-500" />;
            case MemorizationStatus.IZIN: return <FileText className="w-4 h-4 text-indigo-500" />;
            case MemorizationStatus.ALPA: return <UserX className="w-4 h-4 text-indigo-500" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: MemorizationStatus) => {
        switch (status) {
            case MemorizationStatus.LANCAR: return 'Lancar';
            case MemorizationStatus.TIDAK_LANCAR: return 'Tidak Lancar';
            case MemorizationStatus.TIDAK_SETOR: return 'Tidak Setor';
            case MemorizationStatus.SAKIT: return 'Sakit';
            case MemorizationStatus.IZIN: return 'Izin';
            case MemorizationStatus.ALPA: return 'Alpa';
            default: return status;
        }
    };

    const getTypeColor = (type: MemorizationType) => {
        switch (type) {
            case MemorizationType.SABAQ: return 'text-indigo-600 bg-indigo-50 border-indigo-100';
            case MemorizationType.SABQI: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case MemorizationType.MANZIL: return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const getTypeLabel = (type: MemorizationType) => {
        switch (type) {
            case MemorizationType.SABAQ: return 'Sabaq';
            case MemorizationType.SABQI: return 'Sabqi';
            case MemorizationType.MANZIL: return 'Manzil';
            default: return type;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4 lg:gap-6 animate-fade-in overflow-hidden no-scrollbar">
            {/* Sidebar Santri (Desktop Only) */}
            <div className="hidden lg:flex w-64 bg-white rounded-t-[32px] rounded-b-none border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            Daftar Santri
                        </h3>
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full ring-1 ring-indigo-100">
                            {students.length}
                        </span>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Cari santri..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-[11px] font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {filteredStudents.map(student => (
                        <button
                            key={student.id}
                            onClick={() => handleStudentSwitch(student)}
                            className={`w-full flex items-center p-3.5 rounded-2xl transition-all text-left group ${
                                selectedStudent?.id === student.id 
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-100/50' 
                                : 'hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-100'
                            }`}
                        >
                            <div className="flex-1 overflow-hidden">
                                <p className={`text-[11px] font-black uppercase tracking-tight truncate ${
                                    selectedStudent?.id === student.id ? 'text-indigo-700' : 'text-slate-800'
                                }`}>
                                    {student.full_name}
                                </p>
                                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                                    selectedStudent?.id === student.id ? 'text-indigo-400' : 'text-slate-400'
                                }`}>
                                    NIS: {student.nis || '-'}
                                </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${
                                selectedStudent?.id === student.id 
                                ? 'rotate-90 text-indigo-500 opacity-100' 
                                : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                            }`} />
                        </button>
                    ))}
                    
                    {filteredStudents.length === 0 && (
                        <div className="py-12 text-center opacity-40">
                            <Search className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Santri tidak ditemukan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden min-h-0">
                {/* Mobile Student Selector (Visible only on mobile) */}
                <div className="lg:hidden shrink-0 bg-white border border-slate-200 rounded-[24px] p-2 shadow-sm">
                    <div className="flex flex-col gap-2">
                        {/* Selected Student Display / Toggle Button */}
                        <div className="relative">
                            <button 
                                onClick={() => {
                                    const dropdown = document.getElementById('student-mobile-dropdown');
                                    if(dropdown) dropdown.classList.toggle('hidden');
                                }}
                                className="w-full flex items-center justify-between p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Santri Terpilih</p>
                                        <p className="text-xs font-black uppercase tracking-tight leading-none">
                                            {selectedStudent?.full_name || 'Pilih Santri'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            <div 
                                id="student-mobile-dropdown"
                                className="hidden absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] max-h-[300px] overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-200"
                            >
                                <div className="p-2 space-y-1">
                                    {students.map(student => (
                                        <button
                                            key={student.id}
                                            onClick={() => {
                                                handleStudentSwitch(student);
                                                document.getElementById('student-mobile-dropdown')?.classList.add('hidden');
                                            }}
                                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${
                                                selectedStudent?.id === student.id 
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                                : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className={`text-[11px] font-black uppercase tracking-tight ${selectedStudent?.id === student.id ? 'text-white' : 'text-slate-800'}`}>
                                                    {student.full_name}
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${selectedStudent?.id === student.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                    NIS: {student.nis || '-'}
                                                </span>
                                            </div>
                                            {selectedStudent?.id === student.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedStudent ? (
                    <>
                        {/* Log Table Area */}
                        <div className="flex-1 bg-white rounded-t-[32px] rounded-b-none border border-slate-200 flex flex-col overflow-hidden shadow-sm relative">
                            {/* Table Header Filter / Title - MADE SOLID AND SEAMLESS */}
                            <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between bg-white relative z-20 gap-3 lg:gap-0">
                                <div className="hidden lg:flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                                        <Book className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{selectedStudent.full_name}</h3>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Mutaba'ah Hafalan</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between lg:justify-end gap-2 lg:gap-4 w-full lg:w-auto">
                                    <div className="flex bg-white p-0.5 lg:p-1 rounded-xl border border-slate-100 shadow-sm ring-1 ring-white">
                                        <button 
                                            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                                            className="p-1 px-1.5 lg:px-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                        </button>
                                        <div className="px-2 lg:px-3 py-1 text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-indigo-600 flex flex-col items-center justify-center min-w-[130px] lg:min-w-[160px]">
                                            <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                <Calendar className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                                                {weekDisplayRange}
                                            </span>
                                            <span className="text-[6px] lg:text-[7px] text-indigo-300 mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none">
                                                {currentWeekOffset === 0 ? 'Pekan Ini' : 
                                                 currentWeekOffset === -1 ? 'Pekan Lalu' : 
                                                 currentWeekOffset === 1 ? 'Pekan Depan' : 
                                                 currentWeekOffset < 0 ? `${Math.abs(currentWeekOffset)} Pekan Lalu` : 
                                                 `${currentWeekOffset} Pekan Depan`}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                                            className="p-1 px-1.5 lg:px-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                                        >
                                            <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setIsInfoModalOpen(true)}
                                            className="p-2 lg:p-2.5 bg-white border border-slate-200/60 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
                                            title="Informasi Target Harian"
                                        >
                                            <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </button>

                                        <button 
                                            onClick={() => handleMassSave(true)}
                                            className="flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 group"
                                        >
                                            <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                            <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Simpan</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Dense Grid Table */}
                            <div 
                                ref={tableContainerRef}
                                key={selectedStudent.id} 
                                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mt-[1px]"
                            >
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 z-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                                        <tr>
                                            <th className="px-2 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[75px] min-w-[75px] sticky left-0 z-50 bg-slate-50 border-b border-slate-200 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-200">Tanggal</th>
                                            <th className="px-2 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[65px] min-w-[65px] sticky left-[75px] z-50 bg-slate-50 border-b border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.05)] after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-300">Setoran</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border border-slate-200 bg-slate-50">Surat / Ayat</th>
                                            <th className="px-2 lg:px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-12 lg:w-48 border border-slate-200 bg-slate-50">
                                                <span className="lg:hidden">Ket</span>
                                                <span className="hidden lg:inline">Keterangan</span>
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-24 border border-slate-200 bg-slate-50">Paraf</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {weekDates.map((date) => {
                                            const dayRecords = recordsByDate[date] || [];
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const rowDate = new Date(date);
                                            rowDate.setHours(0, 0, 0, 0);
                                            const isFuture = rowDate > today;

                                            return (
                                                <React.Fragment key={date}>
                                                    {isFetchingRecords ? (
                                                        [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type, idx) => (
                                                            <tr key={`${date}-${type}-loading`} className="animate-pulse">
                                                                {idx === 0 && (
                                                                    <td rowSpan={3} className="px-2 py-5 align-middle sticky left-0 z-20 border-b border-slate-200 bg-slate-50 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-200">
                                                                        <div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div>
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-3 sticky left-[75px] z-20 border-b border-slate-200 bg-white shadow-[4px_0_8px_rgba(0,0,0,0.05)] after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-300">
                                                                    <div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div>
                                                                </td>
                                                                <td className="px-4 py-3 border border-slate-200">
                                                                    <div className="h-8 bg-slate-50 rounded-lg w-14 mx-auto"></div>
                                                                </td>
                                                                <td className="px-4 py-3 border border-slate-200">
                                                                    <div className="h-8 bg-slate-50 rounded-lg w-14 mx-auto"></div>
                                                                </td>
                                                                <td className="px-4 py-3 border border-slate-200">
                                                                    <div className="w-7 h-7 bg-slate-50 rounded-full mx-auto"></div>
                                                                </td>
                                                                <td className="px-4 py-3 border border-slate-200">
                                                                    <div className="w-6 h-6 bg-slate-50 rounded-full mx-auto"></div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type, idx) => {
                                                        const dayRecords = recordsByDate[date] || [];
                                                        const rec = dayRecords.find(r => r.type === type && r.student_id === selectedStudent.id);
                                                        const isToday = date === getLocalDateString(new Date());

                                                        return (
                                                            <tr key={`${date}-${type}`} className={`group transition-all ${isFuture ? 'pointer-events-none select-none' : ''} ${isToday ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                                                                {idx === 0 && (
                                                                    <td 
                                                                        id={`row-${date}`}
                                                                        rowSpan={3} 
                                                                        className={`px-2 py-5 align-middle w-[75px] min-w-[75px] sticky left-0 z-20 border-b border-slate-200 shadow-sm opacity-100 !opacity-100 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-100 ${isToday ? 'bg-[#ECFDF5]' : isFuture ? 'bg-[#FDFDFD]' : 'bg-white'}`}
                                                                    >
                                                                        {isToday && (
                                                                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500 shadow-[2px_0_8px_rgba(16,185,129,0.3)]"></div>
                                                                        )}
                                                                        <div className="flex flex-col items-center justify-center space-y-1 text-center relative z-10">
                                                                            {isToday && (
                                                                                <span className="mb-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[7px] font-black rounded-full uppercase tracking-tighter">Hari Ini</span>
                                                                            )}
                                                                            <p className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                                                {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                                                            </p>
                                                                            <p className={`text-[8px] font-medium uppercase tracking-widest ${isToday ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                <td className={`px-2 py-3 sticky left-[75px] z-20 w-[65px] min-w-[65px] border-b border-slate-200 text-center transition-colors shadow-[4px_0_8px_rgba(0,0,0,0.05)] opacity-100 !opacity-100 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-200 ${isToday ? 'bg-[#ECFDF5]' : isFuture ? 'bg-[#FDFDFD]' : 'bg-white group-hover:bg-slate-50'}`}>
                                                                    <span className={`text-[8px] font-black ${isToday ? 'text-emerald-600' : 'text-slate-500'} uppercase tracking-tighter ${isFuture ? 'opacity-60' : ''}`}>
                                                                        {getTypeLabel(type)}
                                                                    </span>
                                                                </td>
                                                                <td className={`px-2 py-1 border-b border-slate-200 ${isFuture ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
                                                                    <div className="flex items-center gap-1 justify-center min-w-[200px]">
                                                                        {/* VOLUME - NOW "jumlah" */}
                                                                        <div className="flex items-center bg-slate-100/50 border border-slate-200 rounded-lg focus-within:ring-1 focus-within:ring-indigo-200 h-8 px-1.5 flex-none w-[84px]">
                                                                            <input 
                                                                                type="number" readOnly
                                                                                disabled={isFuture}
                                                                                value={(() => {
                                                                                    const pending = pendingChanges[`${date}|${type}`];
                                                                                    const val = (pending && Object.prototype.hasOwnProperty.call(pending, 'jumlah')) ? pending.jumlah : rec?.jumlah;
                                                                                    return (val === 0 || val === null || val === undefined) ? '' : val;
                                                                                })()}
                                                                                placeholder="0"
                                                                                className="bg-transparent w-full text-[12px] font-black text-center text-slate-500 outline-none border-none ring-0 appearance-none cursor-default"
                                                                             />
                                                                            <span className="text-[7px] font-black text-slate-400 uppercase opacity-60 flex-none">{type === MemorizationType.SABAQ ? 'Baris' : 'Hal'}</span>
                                                                        </div>

                                                                        {/* SURAH */}
                                                                        <div className="flex-1 min-w-[60px]">
                                                                            <select 
                                                                                disabled={isFuture}
                                                                                value={pendingChanges[`${date}|${type}`]?.surah_name ?? rec?.surah_name ?? ''}
                                                                                onChange={(e) => handleLocalChange(date, type, e.target.value, 'surah_name')}
                                                                                className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[9px] font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all appearance-none text-center shadow-sm"
                                                                            >
                                                                                <option value="">- Surat -</option>
                                                                                {SURAH_DATA.slice(0, 114).map(s => (
                                                                                    <option key={s.name} value={s.name}>{s.name}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>

                                                                        <span className="text-slate-300 font-bold self-center">:</span>

                                                                        {/* AYAT - NOW "ayat_end" */}
                                                                        <div className={`flex items-center h-8 px-1 flex-none w-[68px] border rounded-lg transition-all shadow-sm ${
                                                                             !(!!(pendingChanges[`${date}|${type}`]?.surah_name ?? rec?.surah_name)) 
                                                                                 ? 'bg-slate-50/30 border-slate-100 opacity-30 cursor-not-allowed' 
                                                                                 : 'bg-slate-50/50 border-slate-100 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200'
                                                                         }`}>
                                                                            {(() => {
                                                                                const sName = pendingChanges[`${date}|${type}`]?.surah_name ?? rec?.surah_name;
                                                                                const surahInfo = SURAH_DATA.find(s => s.name === sName);
                                                                                const isSurahSelected = !!sName && sName !== '';
                                                                                return (
                                                                                    <input 
                                                                                        type="number"
                                                                                        disabled={isFuture || !isSurahSelected}
                                                                                        placeholder="0"
                                                                                        min={0}
                                                                                        max={surahInfo?.totalAyah || 286}
                                                                                        value={(() => {
                                                                                            // Force empty string (placeholder) if no surah is selected
                                                                                            if (!isSurahSelected) return '';
                                                                                            const pending = pendingChanges[`${date}|${type}`];
                                                                                            const val = (pending && Object.prototype.hasOwnProperty.call(pending, 'ayat_end')) ? pending.ayat_end : rec?.ayat_end;
                                                                                            return (val === 0 || val === null || val === undefined) ? '' : val;
                                                                                        })()}
                                                                                        onChange={(e) => {
                                                                                            const rawVal = e.target.value;
                                                                                            const cleanedVal = rawVal.replace('-', '').replace(/^0+(?=\d)/, '');
                                                                                            if (cleanedVal === '') {
                                                                                                handleLocalChange(date, type, '', 'ayat_end');
                                                                                                return;
                                                                                            }
                                                                                            let val = parseInt(cleanedVal);
                                                                                            if (isNaN(val)) val = 0;
                                                                                            if (val < 0) val = 0;
                                                                                            if (surahInfo && val > surahInfo.totalAyah) val = surahInfo.totalAyah;
                                                                                            handleLocalChange(date, type, val.toString(), 'ayat_end');
                                                                                        }}
                                                                                        className="bg-transparent w-full text-[12px] font-black text-center text-slate-700 outline-none border-none ring-0 h-full"
                                                                                    />
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                 <td className={`px-1 lg:px-2 py-1 border-b border-slate-200 min-w-[50px] lg:min-w-[180px] ${isFuture ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
                                                                    <div className="flex flex-col gap-1">
                                                                        {/* Desktop Select */}
                                                                        <select
                                                                            disabled={isFuture}
                                                                            value={pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY}
                                                                            key={`${saveCounter}-${selectedStudent.id}-${date}-${type}-combined-status-desktop`}
                                                                            className={`hidden lg:block w-full py-1 text-[9px] font-black text-center outline-none rounded border transition-all appearance-none cursor-pointer whitespace-nowrap ${
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.LANCAR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.TIDAK_SETOR ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.SAKIT ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.IZIN ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.ALPA ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                                'bg-slate-50 text-slate-400 border-slate-200'
                                                                            }`}
                                                                            onChange={(e) => handleLocalChange(date, type, e.target.value, 'status')}
                                                                        >
                                                                            <option value={MemorizationStatus.EMPTY}>- STATUS -</option>
                                                                            <option value={MemorizationStatus.LANCAR}>LANCAR</option>
                                                                            <option value={MemorizationStatus.TIDAK_LANCAR}>TIDAK LANCAR</option>
                                                                            <option value={MemorizationStatus.TIDAK_SETOR}>TIDAK SETOR</option>
                                                                            <option value={MemorizationStatus.SAKIT}>SAKIT</option>
                                                                            <option value={MemorizationStatus.IZIN}>IZIN</option>
                                                                            <option value={MemorizationStatus.ALPA}>ALPA</option>
                                                                        </select>

                                                                        {/* Mobile Select (Symbols Only) */}
                                                                        <select
                                                                            disabled={isFuture}
                                                                            value={pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY}
                                                                            key={`${saveCounter}-${selectedStudent.id}-${date}-${type}-combined-status-mobile`}
                                                                            className={`block lg:hidden w-full py-1 text-[10px] font-black text-center outline-none rounded border transition-all appearance-none cursor-pointer whitespace-nowrap ${
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.LANCAR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.TIDAK_SETOR ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.SAKIT ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.IZIN ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                                (pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY) === MemorizationStatus.ALPA ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                                'bg-slate-50 text-slate-400 border-slate-200'
                                                                            }`}
                                                                            onChange={(e) => handleLocalChange(date, type, e.target.value, 'status')}
                                                                        >
                                                                            <option value={MemorizationStatus.EMPTY}>-</option>
                                                                            <option value={MemorizationStatus.LANCAR}>✓</option>
                                                                            <option value={MemorizationStatus.TIDAK_LANCAR}>○</option>
                                                                            <option value={MemorizationStatus.TIDAK_SETOR}>✕</option>
                                                                            <option value={MemorizationStatus.SAKIT}>S</option>
                                                                            <option value={MemorizationStatus.IZIN}>I</option>
                                                                            <option value={MemorizationStatus.ALPA}>A</option>
                                                                        </select>
                                                                    </div>
                                                                </td>
                                                                <td className={`px-2 py-3 border-b border-slate-200 text-center w-24 ${isFuture ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        {/* Guru Paraf */}
                                                                        {(() => {
                                                                            const p = pendingChanges[`${date}|${type}`];
                                                                            const isCompletable = (p?.surah_name ?? rec?.surah_name) && 
                                                                                                 ((p?.jumlah ?? rec?.jumlah) > 0) && 
                                                                                                 (p?.status ?? rec?.status) && 
                                                                                                 (p?.status ?? rec?.status) !== MemorizationStatus.EMPTY;
                                                                            
                                                                            return (
                                                                                <button 
                                                                                    disabled={isFuture || !isCompletable}
                                                                                    onClick={() => toggleVerification(date, type, rec)}
                                                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                                                                        (pendingChanges[`${date}|${type}`]?.is_verified ?? rec?.is_verified) 
                                                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                                                            : !isCompletable ? 'bg-slate-50 border border-slate-100 text-slate-200 cursor-not-allowed opacity-50' : 'bg-slate-50 border border-dashed border-slate-300 text-slate-300 hover:border-indigo-400 hover:text-indigo-400'
                                                                                    }`}
                                                                                    title={
                                                                                        isFuture ? "Belum masuk tanggalnya" : 
                                                                                        !isCompletable ? "Lengkapi data (Surat, Ayat, Status) untuk memaraf" :
                                                                                        (pendingChanges[`${date}|${type}`]?.is_verified ?? rec?.is_verified) ? "Terverifikasi (Pending)" : "Klik untuk memaraf"
                                                                                    }
                                                                                >
                                                                                    <Check className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            );
                                                                        })()}
                                                                        {/* Ortu Indicator */}
                                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                                                            rec?.is_read_by_parent 
                                                                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                                                                                : 'bg-slate-50 border border-slate-100 opacity-20'
                                                                        }`} title="Paraf Orang Tua">
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            )
                                        })}
                                        {weekDates.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-32 text-center border border-slate-200">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200 ring-1 ring-slate-100">
                                                        <BookOpen className="w-8 h-8" />
                                                    </div>
                                                    <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Belum ada data rekaman</h4>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-[32px] border border-slate-200 border-dashed animate-pulse">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-200 rounded-[32px] flex items-center justify-center mb-8">
                            <User className="w-12 h-12" />
                        </div>
                        <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">Pilih Santri</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Pilih dari daftar di sebelah kiri untuk melihat log hafalan</p>
                    </div>
                )}
            </div>

            {/* Input Modal */}
            {isAddModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-20"
                    onClick={() => setIsAddModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Catat Setoran Baru</h3>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">{selectedStudent?.full_name}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"> <X className="w-4 h-4 text-slate-400" /> </button>
                        </div>
                        
                        <form onSubmit={handleAddRecord} className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Setoran</label>
                                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                        {[MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData({...formData, type: t})}
                                                className={`py-2 px-1 text-[8.5px] font-black uppercase tracking-tight rounded-xl transition-all ${
                                                    formData.type === t ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            >
                                                {t === MemorizationType.SABAQ ? 'Sabaq' : t === MemorizationType.SABQI ? 'Sabqi' : 'Manzil'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                                    <input 
                                        type="date" 
                                        value={formData.record_date} 
                                        onChange={e => setFormData({...formData, record_date: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Surah</label>
                                    <select 
                                        value={formData.surah_name} 
                                        onChange={e => {
                                            const surah = SURAH_DATA.find(s => s.name === e.target.value);
                                            const newSurah = e.target.value;
                                            const newAyatEnd = surah?.totalAyah || 1;
                                            
                                            let newJumlah = 0;
                                            const last = lastProgress[formData.type];
                                            if (newSurah && newAyatEnd && last) {
                                                const startPoint = getNextAyah(last.surah_name, last.ayat_start);
                                                if (startPoint) {
                                                    newJumlah = calculateLines(startPoint.surah, startPoint.ayah, newSurah, newAyatEnd);
                                                }
                                            }
                                            
                                            setFormData({
                                                ...formData, 
                                                surah_name: newSurah, 
                                                ayat_end: newAyatEnd, 
                                                ayat_start: 1, // Note: This field is confusingly named in the modal, but used as "Dari Ayat"
                                                jumlah: newJumlah > 0 ? newJumlah : 0
                                            });
                                        }}
                                        className="w-full px-4 py-3 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none appearance-none"
                                    >
                                        <option value="">-- Pilih Surah --</option>
                                        {SURAH_DATA.map(s => (
                                            <option key={s.name} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Dari Ayat</label>
                                        <input 
                                            type="number" 
                                            disabled={!formData.surah_name}
                                            value={formData.ayat_start} 
                                            onChange={e => {
                                                let val = parseInt(e.target.value);
                                                const surah = SURAH_DATA.find(s => s.name === formData.surah_name);
                                                if (isNaN(val)) val = 1;
                                                if (val < 1) val = 1;
                                                if (surah && val > surah.totalAyah) val = surah.totalAyah;
                                                setFormData({...formData, ayat_start: val});
                                            }}
                                            className={`w-full px-4 py-3 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none ${!formData.surah_name ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Sampai Ayat</label>
                                        <input 
                                            type="number" 
                                            disabled={!formData.surah_name}
                                            value={formData.ayat_end} 
                                            onChange={e => {
                                                let val = parseInt(e.target.value);
                                                const surah = SURAH_DATA.find(s => s.name === formData.surah_name);
                                                if (isNaN(val)) val = 1;
                                                if (val < 1) val = 1;
                                                if (surah && val > surah.totalAyah) val = surah.totalAyah;

                                                let newJumlah = 0;
                                                const last = lastProgress[formData.type];
                                                if (formData.surah_name && val && last) {
                                                    const startPoint = getNextAyah(last.surah_name, last.ayat_start);
                                                    if (startPoint) {
                                                        newJumlah = calculateLines(startPoint.surah, startPoint.ayah, formData.surah_name, val);
                                                    }
                                                }

                                                setFormData({
                                                    ...formData, 
                                                    ayat_end: val,
                                                    jumlah: newJumlah > 0 ? newJumlah : 0
                                                });
                                            }}
                                            className={`w-full px-4 py-3 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none ${!formData.surah_name ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kualitas Hafalan (Keterangan)</label>
                                <div className="flex gap-3">
                                    {[MemorizationStatus.LANCAR, MemorizationStatus.TIDAK_LANCAR, MemorizationStatus.TIDAK_SETOR, MemorizationStatus.SAKIT, MemorizationStatus.IZIN, MemorizationStatus.ALPA].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => {
                                                const isNotDepositing = s === MemorizationStatus.TIDAK_SETOR || s === MemorizationStatus.SAKIT || s === MemorizationStatus.IZIN || s === MemorizationStatus.ALPA;
                                                const lastRef = lastProgress[formData.type];
                                                setFormData({
                                                    ...formData, 
                                                    status: s,
                                                    ...(isNotDepositing ? { 
                                                        surah_name: lastRef?.surah_name || '', 
                                                        ayat_start: lastRef?.ayat_start || 1, // UI ayat_start
                                                        ayat_end: lastRef?.ayat_end || 1      // UI ayat_end (volume)
                                                    } : {})
                                                });
                                            }}
                                            className={`flex-1 py-3 px-1 rounded-2xl font-black text-[8px] uppercase tracking-tighter border-2 transition-all flex flex-col items-center gap-2 ${
                                                formData.status === s 
                                                ? s === MemorizationStatus.LANCAR ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' :
                                                  s === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-sm' :
                                                  s === MemorizationStatus.TIDAK_SETOR ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm' :
                                                  'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm'
                                                : 'bg-white border-slate-50 text-slate-400 grayscale'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg ${
                                                s === MemorizationStatus.LANCAR ? 'bg-emerald-100 text-emerald-600' :
                                                s === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-100 text-amber-600' :
                                                s === MemorizationStatus.TIDAK_SETOR ? 'bg-rose-100 text-rose-600' :
                                                'bg-indigo-100 text-indigo-600'
                                            }`}>
                                                {getStatusIcon(s)}
                                            </div>
                                            {getStatusLabel(s)}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            <div className="pt-6 border-t border-slate-100 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3.5 font-black text-[11px] uppercase tracking-widest rounded-2xl border-2 border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                                >
                                    BATAL
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] py-3.5 font-black text-[11px] uppercase tracking-widest rounded-2xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:border-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    SIMPAN REKAMAN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Information Modal */}
            {isInfoModalOpen && (
                <div 
                    className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-fade-in lg:pl-64 pt-20"
                    onClick={() => setIsInfoModalOpen(false)}
                >
                    <div 
                        className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[340px] overflow-hidden animate-scale-in border border-white flex flex-col max-h-[70vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 overflow-y-auto scrollbar-hide">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                                        <HelpCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">Informasi Target</h3>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">Acuan Sabaq Harian</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsInfoModalOpen(false)} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                                    <X className="w-3.5 h-3.5 text-slate-300" />
                                </button>
                            </div>

                            <div className="space-y-3.5">
                                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3.5 space-y-2.5">
                                    {tenant?.curriculum_config?.target_info ? (
                                        tenant.curriculum_config.target_info.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter ring-1 ring-indigo-100/50">{item.value}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Kelas 1 - 2</span>
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter ring-1 ring-indigo-100/50">3 Baris</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Kelas 3 - 4</span>
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter ring-1 ring-indigo-100/50">5 Baris</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Kelas 5 - 6</span>
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter ring-1 ring-indigo-100/50">7 Baris</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50 flex items-start gap-2.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase tracking-wide opacity-80">
                                        Gunakan acuan ini sebagai standar minimal pencapaian harian santri.
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsInfoModalOpen(false)}
                                className="w-full mt-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Local Unsaved Changes Modal (for Switching Students) */}
            {showLocalUnsavedModal && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-fade-in shadow-2xl lg:pl-64">
                    <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-[380px] overflow-hidden animate-scale-in border border-white/50">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-sm border border-amber-100">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-normal mb-3">Tunggu Sebentar!</h3>
                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide opacity-80">
                                Anda memiliki perubahan data untuk <b>{selectedStudent?.full_name}</b> yang belum disimpan. Ingin menyimpannya dulu?
                            </p>
                        </div>
                        <div className="px-6 pb-8 flex items-center gap-2">
                            <button 
                                onClick={() => { setShowLocalUnsavedModal(false); setPendingStudent(null); }}
                                className="flex-1 py-3 bg-white text-slate-400 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-slate-600 transition-all active:scale-95"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={proceedStudentSwitch}
                                className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                            >
                                Buang
                            </button>
                            <button 
                                onClick={handleLocalSaveAndSwitch}
                                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 outline-none"
                            >
                                Simpan & Pindah
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
