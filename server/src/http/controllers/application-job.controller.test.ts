import { createAndLogUser, logUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import {
  entrepriseStatusEventFactory,
  roleManagementEventFactory,
  saveCfaUserTest,
  saveEntrepriseUserTest,
  saveRoleManagement,
  validatedUserStatus,
} from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { AccessEntityType } from "shared/models/role-management.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"

// Les candidatures d'une offre n'appartiennent qu'à son recruteur ou au CFA qui la gère : chaque profil
// voisin (autre entreprise, autre CFA, OPCO de rattachement) doit être refusé.

let siretSequence = 0
const nextSiret = () => String(12000001600000 + ++siretSequence)
const inTwoWeeks = () => new Date(Date.now() + 14 * 24 * 3600 * 1000)

const saveRecruiter = (username: string, siret = nextSiret()) =>
  saveEntrepriseUserTest(
    { status: validatedUserStatus, email: `${username}@mail.com` },
    { status: [roleManagementEventFactory()] },
    { siret, status: [entrepriseStatusEventFactory()], raison_sociale: `Entreprise ${username}` }
  )

const saveCfa = (username: string) => saveCfaUserTest({ status: validatedUserStatus, email: `${username}@mail.com` }, { siret: nextSiret() }, { siret: nextSiret() })

const saveOffer = async ({ managedBy, siret, cfaSiret = null }: { managedBy: ObjectId; siret: string; cfaSiret?: string | null }) => {
  const offer = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: managedBy,
    workplace_siret: siret,
    workplace_opco: OPCOS_LABEL.AKTO,
    cfa_siret: cfaSiret,
    offer_expiration: inTwoWeeks(),
  })
  await getDbCollection("jobs_partners").insertOne(offer)
  return offer
}

const saveApplication = async (jobId: ObjectId, lastname: string) => {
  const applicant = generateApplicantFixture({ email: `${lastname.toLowerCase()}@candidat.fr`, firstname: "Prénom", lastname })
  await getDbCollection("applicants").insertOne(applicant)
  const application = generateApplicationFixture({ job_id: jobId, applicant_id: applicant._id, created_at: new Date() })
  await getDbCollection("applications").insertOne(application)
  return application
}

describe("GET /application/job/:jobId", () => {
  useMongo()
  const httpClient = useServer()

  const getApplications = async (jobId: ObjectId, headers?: Record<string, string>) =>
    httpClient().inject({ method: "GET", path: `/api/application/job/${jobId}`, ...(headers ? { headers } : {}) })

  it("renvoie au recruteur les seules candidatures de son offre", async () => {
    const recruiter = await saveRecruiter("recruteur")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const otherOffer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Retenu")
    await saveApplication(otherOffer._id, "Autreoffre")

    const response = await getApplications(offer._id, (await logUser(httpClient, "recruteur")).bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.json().applications.map(({ applicant_last_name }) => applicant_last_name)).toEqual(["Retenu"])
  })

  it("refuse le recruteur d'une autre entreprise", async () => {
    const recruiter = await saveRecruiter("proprietaire")
    await saveRecruiter("voisin")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Confidentiel")

    const response = await getApplications(offer._id, (await logUser(httpClient, "voisin")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect(response.json().message).toBe("non autorisé")
    expect(response.body).not.toContain("Confidentiel")
  })

  it("ouvre l'offre au collègue rattaché à la même entreprise", async () => {
    const recruiter = await saveRecruiter("titulaire")
    const colleague = await saveRecruiter("collegue")
    await saveRoleManagement({
      user_id: colleague.user._id,
      authorized_id: recruiter.entreprise._id.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [roleManagementEventFactory()],
    })
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })

    const response = await getApplications(offer._id, (await logUser(httpClient, "collegue")).bearerToken)

    expect(response.statusCode).toBe(200)
  })

  it("renvoie au CFA les candidatures de l'offre qu'il gère, et les refuse à un autre CFA", async () => {
    const cfaGestionnaire = await saveCfa("cfa-gestionnaire")
    await saveCfa("cfa-voisin")
    const offer = await saveOffer({ managedBy: cfaGestionnaire.user._id, siret: cfaGestionnaire.entreprise.siret, cfaSiret: cfaGestionnaire.cfa.siret })
    await saveApplication(offer._id, "Viacfa")

    const allowed = await getApplications(offer._id, (await logUser(httpClient, "cfa-gestionnaire")).bearerToken)
    const denied = await getApplications(offer._id, (await logUser(httpClient, "cfa-voisin")).bearerToken)

    expect(allowed.statusCode).toBe(200)
    expect(allowed.json().applications.map(({ applicant_last_name }) => applicant_last_name)).toEqual(["Viacfa"])
    expect(denied.statusCode).toBe(403)
  })

  it("refuse l'OPCO de rattachement de l'offre, même s'il a aussi un rôle entreprise", async () => {
    const recruiter = await saveRecruiter("recruteur-opco")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Protege")
    const { bearerToken, user: opcoUser } = await createAndLogUser(httpClient, "opco-akto", { type: "OPCO" })
    const autreEntreprise = await saveRecruiter("entreprise-de-l-opco")
    await saveRoleManagement({
      user_id: opcoUser._id,
      authorized_id: autreEntreprise.entreprise._id.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [roleManagementEventFactory()],
    })

    const response = await getApplications(offer._id, bearerToken)

    // Le middleware laisse passer l'OPCO par workplace_opco : c'est le service qui le refuse.
    expect(response.statusCode).toBe(403)
    expect(response.json().message).toBe("Accès réservé au recruteur de l'offre")
    expect(response.body).not.toContain("Protege")
  })

  // Sans cookie, l'authentification par session répond 403 « Session invalide », comme sur les autres routes.
  it("exige une session", async () => {
    const recruiter = await saveRecruiter("sans-session")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Anonyme")

    const response = await getApplications(offer._id)

    expect(response.statusCode).toBe(403)
    expect(response.body).not.toContain("Anonyme")
  })
})
