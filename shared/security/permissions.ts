export type Permission =
  | "recruiter:manage"
  | "user:validate"
  | "recruiter:add_job"
  | "job:manage"
  | "school:manage"
  | "application:manage"
  | "user:manage"
  | "admin"
  | "api-apprentissage:jobs"
  | "api-apprentissage:applications"
  | "api-apprentissage:appointment"

export type RoleNames = "opco" | "recruiter" | "cfa" | "admin" | "pending_recruiter"

export interface Role {
  name: RoleNames
  permissions: Permission[]
}

export const OpcoRole = {
  name: "opco",
  permissions: ["recruiter:manage", "user:validate", "recruiter:add_job", "job:manage", "user:manage"],
} satisfies Role

export const RecruiterRole = {
  name: "recruiter",
  permissions: ["recruiter:manage", "recruiter:add_job", "job:manage", "application:manage", "user:manage"],
} satisfies Role

export const PendingRecruiterRole = {
  name: "pending_recruiter",
  permissions: ["recruiter:add_job"],
} satisfies Role

export const CfaRole = {
  name: "cfa",
  permissions: ["recruiter:manage", "recruiter:add_job", "job:manage", "school:manage", "user:manage"],
} satisfies Role

export const AdminRole = {
  name: "admin",
  permissions: ["admin"],
} satisfies Role

export type AccessPermission = Permission | { some: ReadonlyArray<AccessPermission> } | { every: ReadonlyArray<AccessPermission> }

export type AccessResourcePath = {
  type: "params" | "query"
  key: string
}

export type AccessRessouces = {
  recruiter?: ReadonlyArray<
    | {
        _id: AccessResourcePath
      }
    | {
        establishment_id: AccessResourcePath
      }
    | {
        establishment_siret: AccessResourcePath
        email: AccessResourcePath
      }
    | {
        opco: AccessResourcePath
      }
    | {
        cfa_delegated_siret: AccessResourcePath
      }
  >
  appointment?: ReadonlyArray<{
    _id: AccessResourcePath
  }>
  formationCatalogue?: ReadonlyArray<{
    cle_ministere_educatif: AccessResourcePath
  }>
  job?: ReadonlyArray<{
    _id: AccessResourcePath
  }>
  application?: ReadonlyArray<{
    _id: AccessResourcePath
  }>
  user?: ReadonlyArray<{
    _id: AccessResourcePath
  }>
  entreprise?: ReadonlyArray<
    | {
        _id: AccessResourcePath
      }
    | {
        siret: AccessResourcePath
      }
  >
  jobPartner?: ReadonlyArray<{ _id: AccessResourcePath }>
}

export type UserWithType<T, V> = Readonly<{
  type: T
  value: V
}>
