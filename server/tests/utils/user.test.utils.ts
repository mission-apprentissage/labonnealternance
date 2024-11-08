import { randomUUID } from "crypto"

import { ObjectId } from "mongodb"
import { OPCOS_LABEL, RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { IApplication, ICredential, IEmailBlacklist, ILbaCompany, IRecruiter, ZApplication, ZCredential, ZEmailBlacklist, ZLbaCompany, ZPointGeometry } from "shared/models"
import { ICFA, zCFA } from "shared/models/cfa.model"
import { zObjectId } from "shared/models/common"
import { EntrepriseStatus, IEntreprise, IEntrepriseStatusEvent, ZEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { IUserWithAccount, UserEventType, ZUserWithAccount } from "shared/models/userWithAccount.model"
import { ZodArray, ZodObject, ZodString, ZodTypeAny, z } from "zod"
import { Fixture, Generator } from "zod-fixture"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getFakeEmail } from "@/jobs/database/obfuscateCollections"

function generateRandomRomeCode() {
  // Générer une lettre aléatoire
  const letters = "ABCDEFGHIJKL"
  const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length))

  // Générer quatre chiffres aléatoires
  const randomDigits = Math.floor(1000 + Math.random() * 9000) // Cela génère un nombre entre 1000 et 9999

  // Combiner la lettre et les chiffres pour former le code ROME
  return randomLetter + randomDigits
}

let seed = 0
export function getFixture() {
  seed++
  return new Fixture({ seed }).extend([
    Generator({
      schema: ZodArray,
      filter: ({ context }) => context.path.at(-1) === "offer_rome_codes",
      output: () => [generateRandomRomeCode()],
    }),
    Generator({
      schema: ZodObject,
      filter: ({ context }) => context.path.at(-1) === "geopoint",
      output: ({ transform }) => ({
        type: "Point",
        coordinates: [transform.utils.random.float({ min: -180, max: 180 }), transform.utils.random.float({ min: -90, max: 90 })],
      }),
    }),
    Generator({
      schema: ZodString,
      filter: ({ context }) => context.path.at(-1) === "email",
      output: () => `rando${seed}@email.com`,
    }),
    Generator({
      schema: ZodString,
      filter: ({ context }) => context.path.at(-1) === "applicant_attachment_name",
      output: () => "file.pdf",
    }),
    Generator({
      schema: zObjectId,
      output: () => new ObjectId(),
    }),
    Generator({
      schema: extensions.siret,
      output: ({ transform }) =>
        transform.utils.random.from([
          "58006820882692",
          "94770756516212",
          "08993700810714",
          "89557430766546",
          "10392947668876",
          "81952222258729",
          "34843069553553",
          "55445073871148",
          "44477717954190",
          "62006652591225",
          "77147689105960",
        ]),
    }),
    Generator({
      schema: ZPointGeometry,
      output: ({ transform }) => ({
        type: "Point",
        coordinates: [transform.utils.random.float({ min: -180, max: 180 }), transform.utils.random.float({ min: -90, max: 90 })],
      }),
    }),
  ])
}

export const saveDbEntity = async <T extends ZodTypeAny>(schema: T, saveEntity: (item: z.output<T>) => Promise<any>, data: Partial<z.input<T>>): Promise<z.output<T>> => {
  const entity = schema.parse({
    ...getFixture().fromSchema(schema),
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
    email: `${randomUUID()}@email.fr`,
    jobs: [],
    origin: "origin",
    opco: OPCOS_LABEL.MOBILITE,
    idcc: 1000,
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
    applicant_attachment_name: "my-cv.pdf",
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

export async function createRecruteurLbaTest(data: Partial<ILbaCompany>): Promise<ILbaCompany> {
  return await saveDbEntity(ZLbaCompany, (item) => getDbCollection("recruteurslba").insertOne(item), data)
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
  const recruiter = await saveRecruiter(
    generateRecruiterFixture({
      is_delegated: false,
      cfa_delegated_siret: null,
      status: RECRUITER_STATUS.ACTIF,
      establishment_siret: entreprise.siret,
      opco: entreprise.opco,
      jobs: [
        {
          managed_by: user._id.toString(),
        },
      ],
    })
  )
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
  const recruiter = await saveRecruiter(
    generateRecruiterFixture({
      is_delegated: true,
      cfa_delegated_siret: cfa.siret,
      status: RECRUITER_STATUS.ACTIF,
      jobs: [
        {
          managed_by: user._id.toString(),
        },
      ],
    })
  )
  return { user, role, cfa, recruiter }
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
