export type Employee = {
    id: string
    full_name: string
    role: "super_admin" | "company_admin" | "manager" | "employee"
    is_active: boolean
    status: "active" | "terminated" | "medical_leave" | "unpaid_leave"
    created_at: string
}
