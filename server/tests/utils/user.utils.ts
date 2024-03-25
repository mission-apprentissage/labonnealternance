import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { IApplication, ICredential, IEmailBlacklist, IJob, IRecruiter, IUserRecruteur, ZApplication, ZCredential, ZEmailBlacklist, ZRecruiter, ZUserRecruteur } from "shared/models"
import { zObjectId } from "shared/models/common"
import { ZodObject, ZodString } from "zod"
import { Fixture, Generator } from "zod-fixture"

import { Application, Credential, EmailBlacklist, Recruiter, UserRecruteur } from "@/common/model"
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

export async function createRecruteurTest(data: Partial<IRecruiter>, jobsData: Partial<IJob>[]) {
  const u = new Recruiter({
    ...getFixture().fromSchema(ZRecruiter),
    ...data,
    jobs: jobsData.map((d) => {
      return {
        ...getFixture().fromSchema(ZRecruiter),
        ...d,
      }
    }),
  })
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
