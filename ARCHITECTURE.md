# QurMa - Architecture & Implementation Guide

## 1. SaaS Multi-Tenant Architecture
QurMa operates on a **Shared-Database, Shared-Schema** model (Pool Architecture) using Supabase.

### Concept
All schools (Tenants) live in the same database tables. Data isolation is enforced strictly via **Row Level Security (RLS)** using the `tenant_id` column present in every major table.

### Security Mechanism (RLS)
The core security logic is defined in `schema.sql`:
1.  **Identity:** The logged-in user is identified by `auth.uid()`.
2.  **Context:** A PostgreSQL function `get_my_tenant_id()` queries the `profiles` table to find which tenant the user belongs to.
3.  **Enforcement:** Every `SELECT`, `INSERT`, `UPDATE`, `DELETE` operation automatically appends `WHERE tenant_id = get_my_tenant_id()` to the query.
    *   *Result:* A Teacher from "School A" can query `SELECT * FROM students`, but Postgres will only return students where `tenant_id = School A`.

## 2. Role-Based Access Control (RBAC)
We define three primary roles in the `user_role` enum:

1.  **ADMIN**
    *   *Scope:* Full access within their Tenant.
    *   *Capabilities:* Manage Users (create teachers/parents), Manage Classes (Halaqah), View Audit Logs.
    *   *UI:* Can see "Manajemen User", "Kelas", "Audit Logs".
2.  **TEACHER (GURU)**
    *   *Scope:* Academic data (Students, Records).
    *   *Capabilities:* Input Memorization (Sabaq/Sabqi/Manzil), View Student List.
    *   *Restriction:* Cannot delete users or change school settings.
3.  **GUARDIAN (WALI)**
    *   *Scope:* Read-Only access for their specific child(ren).
    *   *Capabilities:* View Progress Charts, Read Teacher Notes.

## 3. Database Schema Overview (ERD)

| Table | Description | Key Relationships |
| :--- | :--- | :--- |
| **tenants** | The School entity. | Root of all data. |
| **profiles** | Users (Admin/Guru/Wali). | `id` -> `auth.users`, `tenant_id` -> `tenants`. |
| **halaqah_classes** | Study groups. | `teacher_id` -> `profiles`. |
| **students** | The learners. | `halaqah_id` -> `classes`, `parent_id` -> `profiles`. |
| **memorization_records** | Daily entries. | `student_id`, `teacher_id`, `type` (Enum). |

## 4. Frontend Structure
The application is a **React Single Page Application (SPA)**.

*   **`App.tsx`**: Acts as the Router. It holds the `currentPage` state and renders the appropriate component based on the user's role.
*   **`Layout.tsx`**: Provides the persistent Sidebar and Header. It handles navigation events.
*   **`components/`**: Reusable UI parts.
    *   `MemorizationForm`: Complex form with logic for Surah/Ayat input.
    *   `StudentProgressChart`: Visualizes data using Recharts.
*   **`pages/`**: Feature-specific views.
    *   `admin/`: Restricted to Admin role.
    *   `teacher/`: Restricted to Teacher role.

## 5. Deployment & Security Checklist
1.  **Supabase:** Run the contents of `schema.sql` in the SQL Editor.
2.  **Environment Variables:** Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`.
3.  **Authentication:** Enable Email/Password auth in Supabase.
4.  **Policies:** Ensure RLS is ENABLED on all tables (done in schema.sql).
