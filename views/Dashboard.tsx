
import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, UserRole, Student, MemorizationRecord, MemorizationStatus, MemorizationType, AdminStats, GuardianDashboardStats, Halaqah, Achievement, TeacherStats, PageView, WeeklyTarget, TeacherNote } from '../types';
import { getHalaqahs, getStudents, getStudentsByHalaqah, getStudentRecords, getAdminStats, getGuardianStats, getExamSchedules, getUsers, getAchievements, getTeacherStats, getWeeklyTargets, getTenant, getHalaqahRecords, getTenantRecords, getWeeklyAllTypeTotals, getStudentNotes } from '../services/dataService';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { TeacherDashboard } from '../components/dashboard/TeacherDashboard';
import { StudentDashboard } from '../components/dashboard/StudentDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';

interface DashboardProps {
  user: UserProfile;
  onNavigate?: (page: PageView) => void;
}

// --- Persistent Cache for Instant Navigation ---
interface DashboardCache {
    students: Student[];
    recentRecords: MemorizationRecord[];
    adminStats: AdminStats | null;
    guardianStats: GuardianDashboardStats | null;
    studentProfile: Student | null;
    myHalaqah: Halaqah | null;
    teacherStats: TeacherStats | null;
    studentHalaqah: Halaqah | null;
    halaqahTeacher: UserProfile | null;
    achievements: Achievement[];
    halaqahs: Halaqah[];
    allUsers: UserProfile[];
    activeDays: number[];
    hasLoadedOnce: boolean;
}

const dashboardCache: DashboardCache = {
    students: [],
    recentRecords: [],
    adminStats: null,
    guardianStats: null,
    studentProfile: null,
    myHalaqah: null,
    teacherStats: null,
    studentHalaqah: null,
    halaqahTeacher: null,
    achievements: [],
    halaqahs: [],
    allUsers: [],
    activeDays: [1, 2, 3, 4, 5, 6, 0],
    hasLoadedOnce: false
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [students, setStudents] = useState<Student[]>(dashboardCache.students);
  const [recentRecords, setRecentRecords] = useState<MemorizationRecord[]>(dashboardCache.recentRecords);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(dashboardCache.adminStats);
  const [guardianStats, setGuardianStats] = useState<GuardianDashboardStats | null>(dashboardCache.guardianStats);
  const [studentProfile, setStudentProfile] = useState<Student | null>(dashboardCache.studentProfile); 
  const [loading, setLoading] = useState(!dashboardCache.hasLoadedOnce);
  
  const [myHalaqah, setMyHalaqah] = useState<Halaqah | null>(dashboardCache.myHalaqah);
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(dashboardCache.teacherStats);
  const [studentHalaqah, setStudentHalaqah] = useState<Halaqah | null>(dashboardCache.studentHalaqah);
  const [halaqahTeacher, setHalaqahTeacher] = useState<UserProfile | null>(dashboardCache.halaqahTeacher);
  const [achievements, setAchievements] = useState<Achievement[]>(dashboardCache.achievements);
  const [studentNotes, setStudentNotes] = useState<TeacherNote[]>([]);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>(dashboardCache.halaqahs);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(dashboardCache.allUsers);
  const [activeDays, setActiveDays] = useState<number[]>(dashboardCache.activeDays);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Admin Specific States
  const [adminTrendType, setAdminTrendType] = useState<MemorizationType | 'all'>('all');
  const [adminTrendPeriod, setAdminTrendPeriod] = useState<'weekly' | 'monthly' | '3months' | '6months' | 'yearly'>('monthly');
  const [adminTrendWeekOffset, setAdminTrendWeekOffset] = useState(0);
  const [adminTrendMonth, setAdminTrendMonth] = useState(new Date().getMonth());
  const [adminTrendYear, setAdminTrendYear] = useState(new Date().getFullYear());
  const [adminAllRecords, setAdminAllRecords] = useState<MemorizationRecord[]>([]);
  const [loadingAdminTrend, setLoadingAdminTrend] = useState(false);

  
  const [adminTargetHalaqahId, setAdminTargetHalaqahId] = useState<string>('all');
  const [adminTargetWeekOffset, setAdminTargetWeekOffset] = useState<number>(0);
  const [adminTargetData, setAdminTargetData] = useState<any[]>([]);
  const [loadingAdminTargetChart, setLoadingAdminTargetChart] = useState(false);

  // Data Fetching Logic
  const refreshData = React.useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      if (user.role === UserRole.TEACHER) {
          const [allHalaqahs, tenantData] = await Promise.all([
              getHalaqahs(user.tenant_id || ''),
              getTenant(user.tenant_id || '')
          ]);
          
          if (tenantData?.cycle_config?.activeDays) {
              setActiveDays(tenantData.cycle_config.activeDays);
              dashboardCache.activeDays = tenantData.cycle_config.activeDays;
          }

          const teacherHalaqah = allHalaqahs.find(h => h.teacher_id === user.id) || null;
          setMyHalaqah(teacherHalaqah);
          dashboardCache.myHalaqah = teacherHalaqah;
          
          if (teacherHalaqah) {
              const studentsInHalaqah = await getStudentsByHalaqah(teacherHalaqah.id);
              setStudents(studentsInHalaqah);
              dashboardCache.students = studentsInHalaqah;

              const stats = await getTeacherStats(studentsInHalaqah);
              setTeacherStats(stats);
              dashboardCache.teacherStats = stats;

              const halaqahRecords = await getHalaqahRecords(studentsInHalaqah.map(s => s.id));
              setRecentRecords(halaqahRecords);
              dashboardCache.recentRecords = halaqahRecords;
          }
      } else if (user.role === UserRole.SANTRI) {
          const allStudents = await getStudents(user.tenant_id || '');
          const myStudent = allStudents.find(s => s.parent_id === user.id) || allStudents.find(s => s.id === user.id);
          const studentToLoad = myStudent || null;
          setStudentProfile(studentToLoad);
          dashboardCache.studentProfile = studentToLoad;
          
          if (studentToLoad) {
              const [recs, stats, achs, notes, allHalaqahs, allUsers, tenantData] = await Promise.all([
                  getStudentRecords(studentToLoad.id),
                  getGuardianStats(studentToLoad.id),
                  getAchievements(studentToLoad.id),
                  getStudentNotes(studentToLoad.id),
                  getHalaqahs(user.tenant_id || ''),
                  getUsers(user.tenant_id || ''),
                  getTenant(user.tenant_id || '')
              ]);

              recs.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
              setRecentRecords(recs);
              dashboardCache.recentRecords = recs;
              setGuardianStats(stats);
              dashboardCache.guardianStats = stats;
              setAchievements(achs);
              dashboardCache.achievements = achs;
              setStudentNotes(notes);

              if (tenantData?.cycle_config?.activeDays) {
                  setActiveDays(tenantData.cycle_config.activeDays);
                  dashboardCache.activeDays = tenantData.cycle_config.activeDays;
              }

              const foundHalaqah = allHalaqahs.find(h => h.id === studentToLoad.halaqah_id) || null;
              if (foundHalaqah) {
                  setStudentHalaqah(foundHalaqah);
                  dashboardCache.studentHalaqah = foundHalaqah;
                  const foundTeacher = allUsers.find(u => u.id === foundHalaqah.teacher_id) || null;
                  setHalaqahTeacher(foundTeacher);
                  dashboardCache.halaqahTeacher = foundTeacher;
              }
          }
      } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
          const [stats, studentList, halaqahList, userList, tenantData] = await Promise.all([
              getAdminStats(user.tenant_id || ''),
              getStudents(user.tenant_id || ''),
              getHalaqahs(user.tenant_id || ''),
              getUsers(user.tenant_id || ''),
              getTenant(user.tenant_id || '')
          ]);
          setAdminStats(stats);
          setStudents(studentList);
          setHalaqahs(halaqahList);
          setAllUsers(userList);
          if (tenantData?.cycle_config?.activeDays) {
              setActiveDays(tenantData.cycle_config.activeDays);
              dashboardCache.activeDays = tenantData.cycle_config.activeDays;
          }
      }
    } catch (err) {
        console.error("Dashboard data load error:", err);
    } finally {
        setLoading(false);
        setIsRefreshing(false);
        dashboardCache.hasLoadedOnce = true;
    }
  }, [user]);

  useEffect(() => {
    refreshData(!dashboardCache.hasLoadedOnce);
  }, [refreshData]);

  // Admin-specific calculation logic
  const adminTargetWeekRange = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day + (adminTargetWeekOffset * 7);
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    const end = new Date(start);
    const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
    end.setDate(start.getDate() + rangeLength);
    const formatToLocalISO = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayStr}`;
    };
    return {
        start: formatToLocalISO(start),
        end: formatToLocalISO(end),
        display: `${start.getDate()} ${start.toLocaleDateString('id-ID', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'short' })} ${end.getFullYear()}`
    };
  }, [adminTargetWeekOffset, activeDays.length]);

  useEffect(() => {
    if ((user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && students.length > 0) {
        const fetchTargetAchievement = async () => {
            setLoadingAdminTargetChart(true);
            try {
                let filteredStudents = students;
                if (adminTargetHalaqahId !== 'all') filteredStudents = students.filter(s => s.halaqah_id === adminTargetHalaqahId);
                if (filteredStudents.length === 0) { setAdminTargetData([]); return; }
                const studentIds = filteredStudents.map(s => s.id);
                const [targets, weeklyTotals] = await Promise.all([
                    getWeeklyTargets(studentIds, adminTargetWeekRange.start),
                    getWeeklyAllTypeTotals(studentIds, adminTargetWeekRange.start)
                ]);
                const stats = {
                    sabaq: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 },
                    sabqi: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 },
                    manzil: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 }
                };
                targets.forEach(t => {
                    const studentTotals = weeklyTotals[t.student_id] || { sabaq: 0, sabqi: 0, manzil: 0 };
                    const data = t.target_data || {};
                    // Sabaq
                    const sabaqTarget = Number(data.sabaq_target || 0);
                    const sabaqActual = Number(studentTotals.sabaq || 0);
                    if (sabaqTarget > 0) {
                        if (sabaqActual > sabaqTarget) stats.sabaq.terlampaui++;
                        else if (sabaqActual === sabaqTarget) stats.sabaq.tercapai++;
                        else stats.sabaq.tidakTercapai++;
                    }
                    // Sabqi
                    const sabqiTarget = Number(data.sabqi_target || 0);
                    const sabqiActual = Number(studentTotals.sabqi || 0);
                    if (sabqiTarget > 0) {
                        if (sabqiActual > sabqiTarget) stats.sabqi.terlampaui++;
                        else if (sabqiActual === sabqiTarget) stats.sabqi.tercapai++;
                        else stats.sabqi.tidakTercapai++;
                    }
                    // Manzil
                    const manzilTarget = Number(data.manzil_hal || 0);
                    const manzilActual = Number(studentTotals.manzil || 0);
                    if (manzilTarget > 0) {
                        if (manzilActual > manzilTarget) stats.manzil.terlampaui++;
                        else if (manzilActual === manzilTarget) stats.manzil.tercapai++;
                        else stats.manzil.tidakTercapai++;
                    }
                });
                setAdminTargetData([
                    { name: 'SABAQ', tercapai: stats.sabaq.tercapai, tidakTercapai: stats.sabaq.tidakTercapai, terlampaui: stats.sabaq.terlampaui },
                    { name: 'SABQI', tercapai: stats.sabqi.tercapai, tidakTercapai: stats.sabqi.tidakTercapai, terlampaui: stats.sabqi.terlampaui },
                    { name: 'MANZIL', tercapai: stats.manzil.tercapai, tidakTercapai: stats.manzil.tidakTercapai, terlampaui: stats.manzil.terlampaui }
                ]);
            } catch (error) {
                console.error("Error fetching target achievement data:", error);
            } finally {
                setLoadingAdminTargetChart(false);
            }
        };
        fetchTargetAchievement();
    }
  }, [user.role, students, adminTargetHalaqahId, adminTargetWeekOffset, adminTargetWeekRange.start]);

  useEffect(() => {
    if ((user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && students.length > 0) {
        const fetchRangeData = async () => {
            setLoadingAdminTrend(true);
            try {
                const studentIds = students.map(s => s.id);
                let start, end;
                if (adminTrendPeriod === 'weekly') {
                    const today = new Date();
                    const day = today.getDay();
                    const diff = (day === 0 ? -6 : 1) - day + (adminTrendWeekOffset * 7);
                    start = new Date(today);
                    start.setDate(today.getDate() + diff);
                    end = new Date(start);
                    const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
                    end.setDate(start.getDate() + rangeLength);
                } else if (adminTrendPeriod === 'monthly') {
                    start = new Date(adminTrendYear, adminTrendMonth, 1);
                    end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                } else if (adminTrendPeriod === '3months') {
                    end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                    start = new Date(adminTrendYear, adminTrendMonth - 2, 1);
                } else if (adminTrendPeriod === '6months') {
                    if (adminTrendMonth < 6) { start = new Date(adminTrendYear, 0, 1); end = new Date(adminTrendYear, 6, 0); }
                    else { start = new Date(adminTrendYear, 6, 1); end = new Date(adminTrendYear, 12, 0); }
                } else if (adminTrendPeriod === 'yearly') {
                    start = new Date(adminTrendYear, 0, 1);
                    end = new Date(adminTrendYear, 11, 31);
                } else {
                    start = new Date(adminTrendYear, adminTrendMonth, 1);
                    end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                }
                const formatD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const records = await getTenantRecords(studentIds, formatD(start), formatD(end));
                setAdminAllRecords(records);
            } catch (error) {
                console.error("Error fetching admin trend records:", error);
            } finally {
                setLoadingAdminTrend(false);
            }
        };
        fetchRangeData();
    }
  }, [adminTrendMonth, adminTrendYear, adminTrendPeriod, adminTrendWeekOffset, user.role, students.length, activeDays]);

  const adminTrendData = useMemo(() => {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) return [];
    const isMonthlyAggregation = adminTrendPeriod !== 'weekly' && adminTrendPeriod !== 'monthly';
    const groups: Record<string, { sabaq: number, sabqi: number, manzil: number }> = {};
    let start, end;
    if (adminTrendPeriod === 'weekly') {
        const today = new Date();
        const day = today.getDay();
        const diff = (day === 0 ? -6 : 1) - day + (adminTrendWeekOffset * 7);
        start = new Date(today);
        start.setDate(today.getDate() + diff);
        end = new Date(start);
        const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
        end.setDate(start.getDate() + rangeLength);
    } else if (adminTrendPeriod === 'monthly') { start = new Date(adminTrendYear, adminTrendMonth, 1); end = new Date(adminTrendYear, adminTrendMonth + 1, 0); }
    else if (adminTrendPeriod === '3months') { end = new Date(adminTrendYear, adminTrendMonth + 1, 0); start = new Date(adminTrendYear, adminTrendMonth - 2, 1); }
    else if (adminTrendPeriod === '6months') { end = new Date(adminTrendYear, adminTrendMonth + 1, 0); start = new Date(adminTrendYear, adminTrendMonth - 5, 1); }
    else if (adminTrendPeriod === 'yearly') { start = new Date(adminTrendYear, 0, 1); end = new Date(adminTrendYear, 11, 31); }
    else { start = new Date(adminTrendYear, adminTrendMonth, 1); end = new Date(adminTrendYear, adminTrendMonth + 1, 0); }

    if (!isMonthlyAggregation) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            groups[dateStr] = { sabaq: 0, sabqi: 0, manzil: 0 };
        }
    } else {
        for (let d = new Date(start); d <= end; ) {
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            groups[mKey] = { sabaq: 0, sabqi: 0, manzil: 0 };
            d.setMonth(d.getMonth() + 1);
        }
    }
    adminAllRecords.forEach(rec => {
        const dateStr = rec.record_date.split('T')[0];
        const mKey = dateStr.slice(0, 7);
        const key = isMonthlyAggregation ? mKey : dateStr;
        if (groups[key] !== undefined && rec.status !== MemorizationStatus.TIDAK_SETOR) {
             if (rec.type === MemorizationType.SABAQ) groups[key].sabaq++;
             else if (rec.type === MemorizationType.SABQI) groups[key].sabqi++;
             else if (rec.type === MemorizationType.MANZIL) groups[key].manzil++;
        }
    });
    return Object.entries(groups).map(([key, counts]) => {
        let name = "";
        if (!isMonthlyAggregation) name = new Date(key).getDate().toString();
        else {
            const [y, m] = key.split('-');
            name = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
        }
        return { name, sabaq: counts.sabaq, sabqi: counts.sabqi, manzil: counts.manzil, fullDate: key };
    });
  }, [adminAllRecords, adminTrendMonth, adminTrendYear, adminTrendPeriod, user.role, activeDays, adminTrendWeekOffset]);

  if (loading) return <div className="p-8 lg:p-12"><DashboardSkeleton /></div>;

  if (user.role === UserRole.TEACHER) {
      return (
          <TeacherDashboard 
              user={user}
              students={students}
              teacherStats={teacherStats}
              recentRecords={recentRecords}
              myHalaqah={myHalaqah}
              loading={loading}
              isRefreshing={isRefreshing}
              refreshData={refreshData}
              onNavigate={onNavigate || (() => {})}
              activeDays={activeDays}
          />
      );
  }

  if (user.role === UserRole.SANTRI) {
      return (
          <StudentDashboard 
              user={user}
              studentProfile={studentProfile}
              recentRecords={recentRecords}
              studentHalaqah={studentHalaqah}
              halaqahTeacher={halaqahTeacher}
              achievements={achievements}
              notes={studentNotes}
              loading={loading}
              activeDays={activeDays}
              isRefreshing={isRefreshing}
              refreshData={refreshData}
          />
      );
  }

  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
      return (
          <AdminDashboard 
              user={user}
              adminStats={adminStats}
              halaqahs={halaqahs}
              allUsers={allUsers}
              students={students}
              activeDays={activeDays}
              isRefreshing={isRefreshing}
              refreshData={refreshData}
              adminTrendType={adminTrendType}
              setAdminTrendType={setAdminTrendType}
              adminTrendPeriod={adminTrendPeriod}
              setAdminTrendPeriod={setAdminTrendPeriod}
              adminTrendWeekOffset={adminTrendWeekOffset}
              setAdminTrendWeekOffset={setAdminTrendWeekOffset}
              adminTrendMonth={adminTrendMonth}
              setAdminTrendMonth={setAdminTrendMonth}
              adminTrendYear={adminTrendYear}
              setAdminTrendYear={setAdminTrendYear}
              loadingAdminTrend={loadingAdminTrend}
              adminTrendData={adminTrendData}
              
              adminTargetHalaqahId={adminTargetHalaqahId}
              setAdminTargetHalaqahId={setAdminTargetHalaqahId}
              adminTargetWeekOffset={adminTargetWeekOffset}
              setAdminTargetWeekOffset={setAdminTargetWeekOffset}
              adminTargetData={adminTargetData}
              loadingAdminTargetChart={loadingAdminTargetChart}
              adminTargetWeekRange={adminTargetWeekRange}
          />
      );
  }

  return null;
};
