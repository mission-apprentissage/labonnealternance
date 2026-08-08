import { ObjectId } from "mongodb"
import { OPCOS_LABEL, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import type { ICFA } from "shared/models/cfa.model"
import { zCFA } from "shared/models/cfa.model"
import type { IEntreprise, IEntrepriseStatusEvent } from "shared/models/entreprise.model"
import { EntrepriseStatus, ZEntreprise } from "shared/models/entreprise.model"
import type { IApplication, ICredential, IEmailBlacklist, IEntrepriseManagedByCfa } from "shared/models/index"
import { ZApplication, ZCredential, ZEmailBlacklist } from "shared/models/index"
import type { IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import type { IUserWithAccount } from "shared/models/userWithAccount.model"
import { UserEventType, ZUserWithAccount } from "shared/models/userWithAccount.model"
import type { ZodType, z } from "zod"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getFakeEmail } from "@/jobs/database/obfuscateCollections"
import { generateFixture } from "./zodFixtureCompat"

export const saveDbEntity = async <T extends ZodType>(schema: T, saveEntity: (item: z.output<T>) => Promise<any>, data: Partial<z.input<T>>): Promise<z.output<T>> => {
  const entity = schema.parse({
    ...(generateFixture(schema) as Record<string, unknown>),
    ...data,
  })
  await saveEntity(entity)
  return entity
}

export const saveUserWithAccount = async (data: Partial<IUserWithAccount> = {}) => {
  return saveDbEntity(ZUserWithAccount, (item) => getDbCollection("userswithaccounts").insertOne(item), data)
}
export const saveRoleManagement = async (data: Partial<IRoleManagement> = {}) => {
  const role: IRoleManagement = {
    _id: new ObjectId(),
    authorized_id: "id",
    authorized_type: AccessEntityType.CFA,
    createdAt: new Date(),
    status: [],
    updatedAt: new Date(),
    user_id: new ObjectId(),
    ...data,
  }
  await getDbCollection("rolemanagements").insertOne(role)
  return role
}

export const roleManagementEventFactory = ({
  date = new Date(),
  granted_by,
  reason = "reason",
  status = AccessStatus.GRANTED,
  validation_type = VALIDATION_UTILISATEUR.AUTO,
}: Partial<IRoleManagementEvent> = {}): IRoleManagementEvent => {
  return {
    date,
    granted_by,
    reason,
    status,
    validation_type,
  }
}

export const saveEntreprise = async (data: Partial<IEntreprise> = {}) => {
  return saveDbEntity(ZEntreprise, (item) => getDbCollection("entreprises").insertOne(item), data)
}

export const entrepriseStatusEventFactory = (props: Partial<IEntrepriseStatusEvent> = {}): IEntrepriseStatusEvent => {
  return {
    date: new Date(),
    reason: "test",
    status: EntrepriseStatus.VALIDE,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    ...props,
  }
}

export const saveCfa = async (data: Partial<ICFA> = {}) => {
  return saveDbEntity(zCFA, (item) => getDbCollection("cfas").insertOne(item), data)
}

export async function createCredentialTest(data: Partial<ICredential>) {
  const u: ICredential = {
    ...generateFixture(ZCredential),
    ...data,
  }
  await getDbCollection("credentials").insertOne(u)
  return u
}

export async function createApplicationTest(data: Partial<IApplication>) {
  const application: IApplication = {
    ...generateFixture(ZApplication),
    applicant_attachment_name: "my-cv.pdf",
    ...data,
  }
  await getDbCollection("applications").insertOne(application)
  return application
}

export async function createEmailBlacklistTest(data: Partial<IEmailBlacklist>) {
  const u = {
    ...generateFixture(ZEmailBlacklist),
    ...data,
  }
  await getDbCollection("emailblacklists").insertOne(u)
  return u
}

export const saveAdminUserTest = async (userProps: Partial<IUserWithAccount> = {}) => {
  const user = await saveUserWithAccount(userProps)
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_type: AccessEntityType.ADMIN,
    authorized_id: new ObjectId().toString(),
    status: [roleManagementEventFactory()],
  })
  return { user, role }
}

export const saveEntrepriseUserTest = async (userProps: Partial<IUserWithAccount> = {}, roleProps: Partial<IRoleManagement> = {}, entrepriseProps: Partial<IEntreprise> = {}) => {
  const user = await saveUserWithAccount(userProps)
  const entreprise = await saveEntreprise(entrepriseProps)
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: entreprise._id.toString(),
    authorized_type: AccessEntityType.ENTREPRISE,
    status: [roleManagementEventFactory()],
    ...roleProps,
  })
  return { user, role, entreprise }
}

export const saveEntrepriseManagedByCfa = async (props: Partial<IEntrepriseManagedByCfa> = {}): Promise<IEntrepriseManagedByCfa> => {
  const now = new Date()
  const entreprise: IEntrepriseManagedByCfa = {
    _id: new ObjectId(),
    cfa_id: new ObjectId(),
    createdAt: now,
    updatedAt: now,
    email: "email@email.com",
    entreprise_id: new ObjectId(),
    first_name: "first_name",
    last_name: "last_name",
    origin: "origin",
    phone: "012345678",
    ...props,
  }
  await getDbCollection("entreprise_managed_by_cfa").insertOne(entreprise)
  return entreprise
}

export const saveCfaUserTest = async (userProps: Partial<IUserWithAccount> = {}, cfaProps: Partial<ICFA> = {}, entrepriseProps: Partial<IEntreprise> = {}) => {
  const user = await saveUserWithAccount(userProps)
  const cfa = await saveCfa(cfaProps)
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: cfa._id.toString(),
    authorized_type: AccessEntityType.CFA,
    status: [roleManagementEventFactory()],
  })
  const entreprise = await saveEntreprise(entrepriseProps)
  const entrepriseManagedByCfa = await saveEntrepriseManagedByCfa({
    cfa_id: cfa._id,
    entreprise_id: entreprise._id,
  })
  return { user, role, cfa, entreprise, entrepriseManagedByCfa }
}

export const validatedUserStatus = [
  {
    date: new Date(),
    reason: "test",
    status: UserEventType.VALIDATION_EMAIL,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
  },
  {
    date: new Date(),
    reason: "test",
    status: UserEventType.ACTIF,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
  },
]

export const saveOpcoUserTest = async (opco = OPCOS_LABEL.AKTO, email?: string) => {
  const user = await saveUserWithAccount({
    status: validatedUserStatus,
    email: email || getFakeEmail(),
  })
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: opco,
    authorized_type: AccessEntityType.OPCO,
    status: [roleManagementEventFactory()],
  })
  return { user, role }
}
