# QurMa - Architecture & Implementation Guide (v1.4)

## 1. SaaS Multi-Tenant Architecture
QurMa operates on a **Shared-Database, Shared-Schema** model using Supabase.

### Concept
All schools (Tenants) live in the same database tables. Data isolation is enforced strictly via **Row Level Security (RLS)** using the `tenant_id` column present in every major table.

### Security Mechanism (RLS)
The core security logic ensures that users can only access data belonging to their own tenant:
1.  **Identity:** The logged-in user is identified by `auth.uid()`.
2.  **Context:** A PostgreSQL function `get_my_tenant_id()` identified the school.
3.  **Enforcement:** Every operation automatically appends `WHERE tenant_id = get_my_tenant_id()`.

## 2. Role-Based Access Control (RBAC)
We define five primary roles in the `user_role` enum:

1.  **SUPERADMIN**
    *   *Scope:* Platform-wide.
    *   *Capabilities:* Manage all tenants/schools, view global audit logs, manage platform settings.
2.  **ADMIN**
    *   *Scope:* Full access within their specific Tenant.
    *   *Capabilities:* Manage Users, Management Classes, View School Audit Logs.
3.  **TEACHER (GURU)**
    *   *Scope:* Academic data management for assigned Halaqah.
    *   *Capabilities:* Input Daily/Weekly Memorization, Manage Targets, Submit Exam Grades.
4.  **SANTRI**
    *   *Scope:* Personalized dashboard for progress tracking.
    *   *Capabilities:* View progress charts, check weekly status, read teacher notes.
5.  **SUPERVISOR**
    *   *Scope:* Global viewing/exporting of student data within a tenant.

## 3. Database Schema Overview (ERD)

| Table | Description | Key Relationships |
| :--- | :--- | :--- |
| **tenants** | The School entity. | Root of all data isolation. |
| **profiles** | Users (Admin/Guru/Wali). | `id` -> `auth.users`, `tenant_id` -> `tenants`. |
| **students** | The learners. | `halaqah_id` -> `halaqah_classes`, `parent_id` -> `profiles`. |
| **weekly_memorization**| Weekly JSON logs. | `student_id`, `week_start`, `records_data` (JSONB). |
| **memorization_records**| Individual log entries. | `student_id`, `teacher_id`, `status` (Enum). |
| **weekly_targets** | Target management. | `student_id`, `week_start`. |
| **exam_schedules** | Grades & Schedule. | `student_id`, `examiner_id`, `status` (Enum). |
| **audit_logs** | Activity tracking. | `actor_name`, `action`, `tenant_id`. |

## 4. Frontend & Service Architecture

### Modular Service Layer
The application uses a **refactored modular service layer** located in `services/data/`.
*   **`services/dataService.ts`**: Central entry point (re-exports) for backward compatibility.
*   **`services/data/`**: Organized by domain (e.g., `studentService.ts`, `memorizationService.ts`).

### UI Architecture (Next.js App Router)
The project is built using the **Next.js App Router** for modern performance and SEO.
*   **`app/`**: Contains page entry points and layouts.
*   **`views/`**: Contains the core UI components and logic for each page, allowing for better testability and reusability.
*   **`components/`**: Reusable low-level UI elements (Buttons, Inputs, etc.).

### Persistence Strategy (Dual-Write)
To balance performance and usability, memorization inputs use a **Dual-Write** approach:
1.  **Individual Records:** Saved to `memorization_records` for trend graphs and auditability.
2.  **Weekly Snapshots:** Saved to `weekly_memorization` (JSONB) for efficient high-density table rendering (e.g., Target Monitoring).

### State Management
*   **`app/providers.tsx`**: Main context provider wrapper.
*   **`lib/AuthContext`**: Handles session and role-based access.
*   **`lib/LoadingContext`**: Unified loading states for smooth UX.
*   **`lib/NotificationContext`**: Global feedback system.

## 5. Deployment & Terminology
*   **Standard Status:** `Lancar`, `Tidak Lancar`, `Tidak Setor`.
*   **Build:** Next.js optimized production builds.
*   **DB Migration:** Always run `sql.txt` or relevant SQL scripts for schema parity.

