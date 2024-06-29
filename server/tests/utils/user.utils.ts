import { ObjectId } from "mongodb"
import { OPCOS, RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { IApplication, ICredential, IEmailBlacklist, IJob, IRecruiter, JOB_STATUS, ZApplication, ZCredential, ZEmailBlacklist } from "shared/models"
import { ICFA, zCFA } from "shared/models/cfa.model"
import { zObjectId } from "shared/models/common"
import { EntrepriseStatus, IEntreprise, IEntrepriseStatusEvent, ZEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { IUserWithAccount, UserEventType, ZUserWithAccount } from "shared/models/userWithAccount.model"
import { ZodObject, ZodString, ZodTypeAny } from "zod"
import { Fixture, Generator } from "zod-fixture"

import { getDbCollection } from "@/common/utils/mongodbUtils"

let seed = 0
function getFixture() {
  seed++
  return new Fixture({ seed }).extend([
    Generator({
      schema: ZodObject,
      filter: ({ context }) => context.path.at(-1) === "geopoint",
      output: ({ transform }) => ({
        type: "Point",
        coordinates: [transform.utils.random.float(), transform.utils.random.float()],
      }),
    }),
    Generator({
      schema: ZodString,
      filter: ({ context }) => context.path.at(-1) === "email",
      output: () => `rando${seed}@email.com`,
    }),
    Generator({
      schema: zObjectId,
      output: () => new ObjectId(),
    }),
    Generator({
      schema: extensions.siret,
      output: ({ transform }) =>
        transform.utils.random.from([
          "55327987900672",
          "55327987900673",
          "55327987900674",
          "55327987900675",
          "55327987900676",
          "55327987900677",
          "73282932000074",
          "35600000000048",
          "35600000009075",
          "35600000009093",
        ]),
    }),
  ])
}

export const saveDbEntity = async <T>(schema: ZodTypeAny, saveEntity: (item: T) => Promise<any>, data: Partial<T>) => {
  const entity = {
    ...getFixture().fromSchema(schema),
    ...data,
  }
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
    origin: "origin",
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

export const jobFactory = (props: Partial<IJob> = {}) => {
  const job: IJob = {
    _id: new ObjectId(),
    rome_label: "rome_label",
    rome_appellation_label: "rome_appellation_label",
    job_level_label: "BTS, DEUST, autres formations niveau (Bac+2)",
    job_start_date: new Date(),
    job_description: "job_description",
    job_employer_description: "job_employer_description",
    rome_code: ["rome_code"],
    job_creation_date: new Date(),
    job_expiration_date: new Date(),
    job_update_date: new Date(),
    job_last_prolongation_date: new Date(),
    job_prolongation_count: 0,
    relance_mail_sent: false,
    job_status: JOB_STATUS.ACTIVE,
    job_status_comment: "job_status_comment",
    job_type: ["Apprentissage"],
    is_multi_published: false,
    job_delegation_count: 0,
    delegations: [],
    is_disabled_elligible: false,
    job_count: 1,
    job_duration: 6,
    job_rythm: "Indifférent",
    custom_address: "custom_address",
    custom_geo_coordinates: "custom_geo_coordinates",
    stats_detail_view: 0,
    stats_search_view: 0,
    managed_by: new ObjectId().toString(),
    ...props,
  }
  return job
}

export async function createCredentialTest(data: Partial<ICredential>) {
  const u: ICredential = {
    ...getFixture().fromSchema(ZCredential),
    ...data,
  }
  await getDbCollection("credentials").insertOne(u)
  return u
}

export async function saveRecruiter(data: Partial<IRecruiter>) {
  const recruiter: IRecruiter = {
    _id: new ObjectId(),
    distance: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    establishment_id: "establishment_id",
    establishment_raison_sociale: "establishment_raison_sociale",
    establishment_enseigne: "establishment_enseigne",
    establishment_siret: "establishment_siret",
    address_detail: "address_detail",
    address: "address",
    geo_coordinates: "geo_coordinates",
    geopoint: {
      type: "Point",
      coordinates: [41, 10],
    },
    is_delegated: false,
    cfa_delegated_siret: "cfa_delegated_siret",
    last_name: "last_name",
    first_name: "first_name",
    phone: "phone",
    email: "email",
    jobs: [],
    origin: "origin",
    opco: "opco",
    idcc: "idcc",
    status: RECRUITER_STATUS.ACTIF,
    naf_code: "naf_code",
    naf_label: "naf_label",
    establishment_size: "establishment_size",
    establishment_creation_date: new Date(),
    ...data,
  }
  await getDbCollection("recruiters").insertOne(recruiter)
  return recruiter
}

export async function createApplicationTest(data: Partial<IApplication>) {
  const u: IApplication = {
    ...getFixture().fromSchema(ZApplication),
    ...data,
  }
  await getDbCollection("applications").insertOne(u)
  return u
}

export async function createEmailBlacklistTest(data: Partial<IEmailBlacklist>) {
  const u = {
    ...getFixture().fromSchema(ZEmailBlacklist),
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
  const recruiter = await saveRecruiter({
    is_delegated: false,
    cfa_delegated_siret: null,
    status: RECRUITER_STATUS.ACTIF,
    establishment_siret: entreprise.siret,
    opco: entreprise.opco,
    jobs: [
      jobFactory({
        managed_by: user._id.toString(),
      }),
    ],
  })
  return { user, role, entreprise, recruiter }
}

export const saveCfaUserTest = async (userProps: Partial<IUserWithAccount> = {}) => {
  const user = await saveUserWithAccount(userProps)
  const cfa = await saveCfa()
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: cfa._id.toString(),
    authorized_type: AccessEntityType.CFA,
    status: [roleManagementEventFactory()],
  })
  const recruiter = await saveRecruiter({
    is_delegated: true,
    cfa_delegated_siret: cfa.siret,
    status: RECRUITER_STATUS.ACTIF,
    jobs: [
      jobFactory({
        managed_by: user._id.toString(),
      }),
    ],
  })
  return { user, role, cfa, recruiter }
}

export const saveOpcoUserTest = async () => {
  const user = await saveUserWithAccount({
    status: [
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
    ],
  })
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: OPCOS.AKTO,
    authorized_type: AccessEntityType.OPCO,
    status: [roleManagementEventFactory()],
  })
  return { user, role }
}
