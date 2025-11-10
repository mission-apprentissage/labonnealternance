import type { ResourceIds } from "./authorisationService"

interface IAccessLog {
  authorized: boolean
  user_id: string | null
  user_email: string | null
  user_siret: string | null
  user_type: string | null
  auth_type: string
  path: string
  parameters: { [key: string]: string } | null
  http_method: string
  resources: ResourceIds | null
  ip: string
  created_at: Date
}

export type { IAccessLog }
