
import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, UserRole, Student, MemorizationRecord, MemorizationStatus, MemorizationType, AdminStats, GuardianDashboardStats, Halaqah, Achievement, TeacherStats, PageView, WeeklyTarget, TeacherNote } from '../types';
import { getHalaqahs, getStudents, getStudentsByHalaqah, getStudentRecords, getAdminStats, getGuardianStats, getExamSchedules, getUsers, getAchievements, getTeacherStats, getWeeklyTargets, getTenant, getHalaqahRecords, getTenantRecords, getWeeklyAllTypeTotals, getStudentNotes } from '../services/dataService';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { TeacherDashboard } from '../components/dashboard/TeacherDashboard';
import { StudentDashboard } from '../components/dashboard/StudentDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { AdminDashboardProvider } from '../components/dashboard/AdminDashboardContext';

interface DashboardProps {
  user: UserProfile;
  onNavigate?: (page: PageView) => void;
  currentPage?: PageView;
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

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, currentPage = 'dashboard' }) => {
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
          <AdminDashboardProvider
              user={user}
              adminStats={adminStats}
              halaqahs={halaqahs}
              allUsers={allUsers}
              students={students}
              activeDays={activeDays}
              isRefreshing={isRefreshing}
              refreshData={refreshData}
          >
              <AdminDashboard currentPage={currentPage} />
          </AdminDashboardProvider>
      );
  }

  return null;
};
