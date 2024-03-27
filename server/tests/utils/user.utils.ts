import { ETAT_UTILISATEUR, OPCOS, RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { IApplication, ICredential, IEmailBlacklist, IJob, IRecruiter, IUserRecruteur, JOB_STATUS, ZApplication, ZCredential, ZEmailBlacklist, ZUserRecruteur } from "shared/models"
import { ICFA, zCFA } from "shared/models/cfa.model"
import { zObjectId } from "shared/models/common"
import { IEntreprise, ZEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { IUser2, ZUser2 } from "shared/models/user2.model"
import { ZodObject, ZodString, ZodTypeAny } from "zod"
import { Fixture, Generator } from "zod-fixture"

import { Application, Cfa, Credential, EmailBlacklist, Entreprise, Recruiter, RoleManagement, User2, UserRecruteur } from "@/common/model"
import { ObjectId } from "@/common/mongodb"

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

export const saveDbEntity = async <T>(schema: ZodTypeAny, dbModel: (item: T) => { save: () => Promise<any> } & T, data: Partial<T>) => {
  const u = dbModel({
    ...getFixture().fromSchema(schema),
    ...data,
  })
  await u.save()
  return u
}

export const saveUser2 = async (data: Partial<IUser2> = {}) => {
  return saveDbEntity(ZUser2, (item) => new User2(item), data)
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
  await new RoleManagement(role).save()
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
  return saveDbEntity(ZEntreprise, (item) => new Entreprise(item), data)
}
export const saveCfa = async (data: Partial<ICFA> = {}) => {
  return saveDbEntity(zCFA, (item) => new Cfa(item), data)
}

export const jobFactory = (props: Partial<IJob> = {}) => {
  const job: IJob = {
    _id: new ObjectId(),
    rome_label: "rome_label",
    rome_appellation_label: "rome_appellation_label",
    job_level_label: "job_level_label",
    job_start_date: new Date(),
    job_description: "job_description",
    job_employer_description: "job_employer_description",
    rome_code: ["rome_code"],
    rome_detail: null,
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
    job_rythm: "job_rythm",
    custom_address: "custom_address",
    custom_geo_coordinates: "custom_geo_coordinates",
    stats_detail_view: 0,
    stats_search_view: 0,
    managed_by: new ObjectId(),
    ...props,
  }
  return job
}

export async function createUserRecruteurTest(data: Partial<IUserRecruteur>, userState: string = ETAT_UTILISATEUR.VALIDE) {
  const u = new UserRecruteur({
    ...getFixture().fromSchema(ZUserRecruteur),
    status: [{ validation_type: "AUTOMATIQUE", status: userState }],
    ...data,
  })
  await u.save()
  return u
}

export async function createCredentialTest(data: Partial<ICredential>) {
  const u = new Credential({
    ...getFixture().fromSchema(ZCredential),
    ...data,
  })
  await u.save()
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
  const u = new Recruiter(recruiter)
  await u.save()
  return u
}

export async function createApplicationTest(data: Partial<IApplication>) {
  const u = new Application({
    ...getFixture().fromSchema(ZApplication),
    ...data,
  })
  await u.save()
  return u
}

export async function createEmailBlacklistTest(data: Partial<IEmailBlacklist>) {
  const u = new EmailBlacklist({
    ...getFixture().fromSchema(ZEmailBlacklist),
    ...data,
  })
  await u.save()
  return u
}

export const saveAdminUserTest = async (userProps: Partial<IUser2> = {}) => {
  const user = await saveUser2(userProps)
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_type: AccessEntityType.ADMIN,
    authorized_id: undefined,
    status: [roleManagementEventFactory()],
  })
  return { user, role }
}

export const saveEntrepriseUserTest = async () => {
  const user = await saveUser2()
  const entreprise = await saveEntreprise()
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: entreprise._id.toString(),
    authorized_type: AccessEntityType.ENTREPRISE,
    status: [roleManagementEventFactory()],
  })
  const recruiter = await saveRecruiter({
    is_delegated: false,
    cfa_delegated_siret: null,
    status: RECRUITER_STATUS.ACTIF,
    establishment_siret: entreprise.siret,
    opco: entreprise.opco,
    jobs: [
      jobFactory({
        managed_by: user._id,
      }),
    ],
  })
  return { user, role, entreprise, recruiter }
}

export const saveCfaUserTest = async (userProps: Partial<IUser2> = {}) => {
  const user = await saveUser2(userProps)
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
        managed_by: user._id,
      }),
    ],
  })
  return { user, role, cfa, recruiter }
}

export const saveOpcoUserTest = async () => {
  const user = await saveUser2()
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: OPCOS.AKTO,
    authorized_type: AccessEntityType.OPCO,
    status: [roleManagementEventFactory()],
  })
  return { user, role }
}
