import { Role } from "shared/security/permissions"

import { ResourceIds } from "@/security/authorisationService"

interface IAccessLog {
  authorized: boolean
  user_id: string | null
  user_email: string | null
  user_type: string
  auth_type: string
  path: string
  role: Role | null
  parameters: { [key: string]: string } | null
  http_method: string
  resources: ResourceIds | null
  ip: string
  created_at: Date
}

export type { IAccessLog }
