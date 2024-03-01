import { Role } from "shared/security/permissions"

interface IAccessLog {
  status: "authorized" | "unauthorized"
  user_id?: string
  user_email?: string
  user_type?: string
  auth_type: string
  path: string
  role?: Role
  parameters?: any
  http_method: string
  resources?: any
  ip: string
  created_at: Date
}

export type { IAccessLog }
