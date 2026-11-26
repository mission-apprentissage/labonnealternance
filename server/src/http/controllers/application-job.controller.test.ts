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
import { ObjectId } from "mongodb"
import { readSheet } from "read-excel-file/node"
import { APPLICATION_TREATED_ELSEWHERE, ApplicationIntention, RefusalReasons } from "shared/constants/application"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { ApplicationScanStatus, CompanyFeebackSendStatus } from "shared/models/applications.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { AccessEntityType } from "shared/models/role-management.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getS3FileSize, s3ReadAsString } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"

vi.mock("@/common/utils/aws-utils", () => ({ s3ReadAsString: vi.fn(), getS3FileSize: vi.fn().mockResolvedValue(null) }))
// L'envoi immédiat d'une réponse passe par le mailer : sans SMTP en test, il échouerait et rien ne serait enregistré.
vi.mock("@/services/mailer.service", () => ({
  default: {
    sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["candidat@example.com"] }),
    renderEmail: vi.fn().mockResolvedValue("<html></html>"),
  },
}))

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

const saveApplication = async (jobId: ObjectId, lastname: string, data: Parameters<typeof generateApplicationFixture>[0] = {}) => {
  const applicant = generateApplicantFixture({ email: `${lastname.toLowerCase()}@candidat.fr`, firstname: "Prénom", lastname })
  await getDbCollection("applicants").insertOne(applicant)
  const application = generateApplicationFixture({ job_id: jobId, applicant_id: applicant._id, created_at: new Date(), ...data })
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

  it("n'affiche pas une candidature encore dans le circuit d'envoi, avant le mail au recruteur", async () => {
    const recruiter = await saveRecruiter("recruteur-envoi")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Envoyee")
    await saveApplication(offer._id, "Enattente", { to_company_message_id: null, scan_status: ApplicationScanStatus.WAITING_FOR_SCAN })

    const response = await getApplications(offer._id, (await logUser(httpClient, "recruteur-envoi")).bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.json().applications.map(({ applicant_last_name }) => applicant_last_name)).toEqual(["Envoyee"])
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

describe("GET /application/job/:jobId/export", () => {
  useMongo()
  const httpClient = useServer()

  const exportApplications = async (jobId: ObjectId, headers?: Record<string, string>) =>
    httpClient().inject({ method: "GET", path: `/api/application/job/${jobId}/export`, ...(headers ? { headers } : {}) })

  // Première feuille du fichier Excel, en objets indexés par l'en-tête de colonne.
  const readExport = async (content: Buffer) => {
    const [header, ...rows] = await readSheet(content)
    const columns = header.map(String)
    return { columns, rows: rows.map((row) => Object.fromEntries(row.map((value, index) => [columns[index], value]))) }
  }

  it("télécharge un fichier Excel nommé d'après l'offre, avec le nom de la pièce jointe", async () => {
    const recruiter = await saveRecruiter("recruteur-export")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await getDbCollection("jobs_partners").updateOne({ _id: offer._id }, { $set: { offer_title: "Maçon / Maçonne du paysage" } })
    await saveApplication(offer._id, "Exporte", {
      applicant_attachment_name: "cv-exporte.pdf",
      applicant_message_to_company: "Motivé &amp; disponible",
      applicant_answers_to_recruiter_questions: [{ question: "Pourquoi nous ?", answer: "Pour apprendre" }],
      company_recruitment_intention: ApplicationIntention.REFUS,
      company_feedback_reasons: [RefusalReasons.CONTRAT_INADAPTE],
    })

    const response = await exportApplications(offer._id, (await logUser(httpClient, "recruteur-export")).bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.headers["content-type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    expect(response.headers["content-disposition"]).toBe(
      `attachment; filename="candidatures_de_macon_maconne_du_paysage.xlsx"; filename*=UTF-8''candidatures_de_macon_maconne_du_paysage.xlsx`
    )
    const { columns, rows } = await readExport(response.rawPayload)
    expect(columns).not.toContain("Pièce jointe supprimée le")
    expect(columns[0]).toBe("Offre")
    expect(columns).not.toContain("Entreprise")
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      Offre: "Maçon / Maçonne du paysage",
      Nom: "EXPORTE",
      "E-mail": "exporte@candidat.fr",
      Téléphone: "0123456789",
      Statut: "Refusé",
      "Motifs de refus": "Type de contrat inadapté",
      "Message du candidat": "Motivé & disponible",
      "Pièce jointe": "cv-exporte.pdf",
      "Pourquoi nous ?": "Pour apprendre",
    })
  })

  it("n'exporte que les candidatures transmises au recruteur, avec les sauts de ligne du candidat", async () => {
    const recruiter = await saveRecruiter("recruteur-export-envoi")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Envoyee", { applicant_message_to_company: "Bonjour,<br />Je suis motivé" })
    await saveApplication(offer._id, "Enattente", { to_company_message_id: null })

    const response = await exportApplications(offer._id, (await logUser(httpClient, "recruteur-export-envoi")).bearerToken)

    const { rows } = await readExport(response.rawPayload)
    expect(rows.map((row) => row.Nom)).toEqual(["ENVOYEE"])
    expect(rows[0]["Message du candidat"]).toBe("Bonjour,\nJe suis motivé")
  })

  it("garde en texte une saisie du candidat qu'un tableur lirait comme une formule", async () => {
    const recruiter = await saveRecruiter("recruteur-formule")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Formule", { applicant_message_to_company: '=HYPERLINK("http://exemple.test")' })

    const response = await exportApplications(offer._id, (await logUser(httpClient, "recruteur-formule")).bearerToken)

    // Une cellule de formule n'aurait pas de valeur en cache : la relecture renverrait null, pas le texte.
    const { rows } = await readExport(response.rawPayload)
    expect(rows[0]["Message du candidat"]).toBe('=HYPERLINK("http://exemple.test")')
  })

  it("refuse l'export au recruteur d'une autre entreprise", async () => {
    const recruiter = await saveRecruiter("proprietaire-export")
    await saveRecruiter("voisin-export")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Confidentiel")

    const response = await exportApplications(offer._id, (await logUser(httpClient, "voisin-export")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect(response.body).not.toContain("Confidentiel")
  })

  it("refuse l'export à l'OPCO de rattachement de l'offre", async () => {
    const recruiter = await saveRecruiter("recruteur-export-opco")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Protege")
    const { bearerToken } = await createAndLogUser(httpClient, "opco-export", { type: "OPCO" })

    const response = await exportApplications(offer._id, bearerToken)

    expect(response.statusCode).toBe(403)
    expect(response.body).not.toContain("Protege")
  })
})

describe("GET /application/establishment/:establishment_id/export", () => {
  useMongo()
  const httpClient = useServer()

  const exportEstablishment = async (establishmentId: string, headers?: Record<string, string>) =>
    httpClient().inject({ method: "GET", path: `/api/application/establishment/${establishmentId}/export`, ...(headers ? { headers } : {}) })

  const readExport = async (content: Buffer) => {
    const [header, ...rows] = await readSheet(content)
    const columns = header.map(String)
    return { columns, rows: rows.map((row) => Object.fromEntries(row.map((value, index) => [columns[index], value]))) }
  }

  it("exporte pour le CFA les candidatures de toutes les offres de l'entreprise, avec l'entreprise et l'offre", async () => {
    const cfa = await saveCfa("cfa-export-entreprise")
    const siret = cfa.entreprise.siret
    const firstOffer = await saveOffer({ managedBy: cfa.user._id, siret, cfaSiret: cfa.cfa.siret })
    const secondOffer = await saveOffer({ managedBy: cfa.user._id, siret, cfaSiret: cfa.cfa.siret })
    const outdatedOffer = await saveOffer({ managedBy: cfa.user._id, siret, cfaSiret: cfa.cfa.siret })
    const otherCompanyOffer = await saveOffer({ managedBy: cfa.user._id, siret: nextSiret(), cfaSiret: cfa.cfa.siret })
    await getDbCollection("jobs_partners").updateOne({ _id: firstOffer._id }, { $set: { offer_title: "Maçon" } })
    await getDbCollection("jobs_partners").updateOne({ _id: secondOffer._id }, { $set: { offer_title: "Paysagiste" } })
    // Expirée depuis plus de 3 mois : ses candidatures ne sont plus consultables.
    await getDbCollection("jobs_partners").updateOne({ _id: outdatedOffer._id }, { $set: { offer_expiration: new Date(Date.now() - 200 * 24 * 3600 * 1000) } })
    await saveApplication(firstOffer._id, "Premiere")
    await saveApplication(secondOffer._id, "Seconde")
    await saveApplication(secondOffer._id, "Enattente", { to_company_message_id: null })
    await saveApplication(outdatedOffer._id, "Perimee")
    await saveApplication(otherCompanyOffer._id, "Ailleurs")

    const response = await exportEstablishment(`${cfa.user._id}_${siret}`, (await logUser(httpClient, "cfa-export-entreprise")).bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.headers["content-type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    const { columns, rows } = await readExport(response.rawPayload)
    expect(columns.slice(0, 3)).toEqual(["Entreprise", "SIRET", "Offre"])
    expect(rows.map((row) => [row.SIRET, row.Offre, row.Nom])).toEqual(
      expect.arrayContaining([
        [siret, "Maçon", "PREMIERE"],
        [siret, "Paysagiste", "SECONDE"],
      ])
    )
    expect(rows).toHaveLength(2)
  })

  it("refuse l'export à un autre CFA", async () => {
    const cfa = await saveCfa("cfa-export-proprietaire")
    await saveCfa("cfa-export-voisin")
    const offer = await saveOffer({ managedBy: cfa.user._id, siret: cfa.entreprise.siret, cfaSiret: cfa.cfa.siret })
    await saveApplication(offer._id, "Confidentiel")

    const response = await exportEstablishment(`${cfa.user._id}_${cfa.entreprise.siret}`, (await logUser(httpClient, "cfa-export-voisin")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect(response.body).not.toContain("CONFIDENTIEL")
  })

  it("exige une session", async () => {
    const cfa = await saveCfa("cfa-export-anonyme")
    const offer = await saveOffer({ managedBy: cfa.user._id, siret: cfa.entreprise.siret, cfaSiret: cfa.cfa.siret })
    await saveApplication(offer._id, "Anonyme")

    const response = await exportEstablishment(`${cfa.user._id}_${cfa.entreprise.siret}`)

    expect(response.statusCode).toBe(403)
    expect(response.body).not.toContain("ANONYME")
  })
})

describe("GET /application/job/:jobId/application/:applicationId", () => {
  useMongo()
  const httpClient = useServer()

  const getDetail = async (jobId: ObjectId, applicationId: ObjectId, headers?: Record<string, string>) =>
    httpClient().inject({ method: "GET", path: `/api/application/job/${jobId}/application/${applicationId}`, ...(headers ? { headers } : {}) })

  it("renvoie au recruteur le détail de la candidature, avec les mêmes informations que l'export", async () => {
    const recruiter = await saveRecruiter("recruteur-detail")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Detaille", {
      applicant_attachment_name: "cv-detaille.pdf",
      applicant_answers_to_recruiter_questions: [{ question: "Pourquoi nous ?", answer: "Pour apprendre" }],
    })

    const response = await getDetail(offer._id, application._id, (await logUser(httpClient, "recruteur-detail")).bearerToken)

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.application).toMatchObject({
      applicant_first_name: "Prénom",
      applicant_last_name: "Detaille",
      applicant_phone: "0123456789",
      applicant_attachment_name: "cv-detaille.pdf",
      company_recruitment_intention: null,
      feedback_email_subject: null,
      applicant_answers_to_recruiter_questions: [{ question: "Pourquoi nous ?", answer: "Pour apprendre" }],
    })
  })

  it("rend en sauts de ligne les <br /> du message et des réponses du candidat", async () => {
    const recruiter = await saveRecruiter("recruteur-lignes")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Lignes", {
      applicant_message_to_company: "Bonjour,<br />Je suis motivé.<br/><br>Cordialement",
      applicant_answers_to_recruiter_questions: [{ question: "Pourquoi nous ?", answer: "Pour apprendre<br />et progresser" }],
    })

    const response = await getDetail(offer._id, application._id, (await logUser(httpClient, "recruteur-lignes")).bearerToken)

    expect(response.json().application).toMatchObject({
      applicant_message_to_company: "Bonjour,\nJe suis motivé.\n\nCordialement",
      applicant_answers_to_recruiter_questions: [{ question: "Pourquoi nous ?", answer: "Pour apprendre\net progresser" }],
    })
  })

  it("répond 404 pour une candidature encore dans le circuit d'envoi", async () => {
    const recruiter = await saveRecruiter("recruteur-detail-envoi")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Enattente", { to_company_message_id: null })

    const response = await getDetail(offer._id, application._id, (await logUser(httpClient, "recruteur-detail-envoi")).bearerToken)

    expect(response.statusCode).toBe(404)
  })

  it("donne la taille de la pièce jointe déduite de sa data URL sur S3, sans la télécharger", async () => {
    const recruiter = await saveRecruiter("recruteur-detail-taille")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Taille", { applicant_attachment_name: "cv.pdf" })
    const deleted = await saveApplication(offer._id, "Purge", { applicant_attachment_deleted_at: new Date() })
    // 4 caractères base64 par tranche de 3 octets : 254 976 octets de fichier.
    vi.mocked(getS3FileSize).mockResolvedValue("data:application/pdf;base64,".length + 339_968)
    const session = (await logUser(httpClient, "recruteur-detail-taille")).bearerToken

    expect((await getDetail(offer._id, application._id, session)).json().application.applicant_attachment_size).toBe(254_976)
    expect((await getDetail(offer._id, deleted._id, (await logUser(httpClient, "recruteur-detail-taille")).bearerToken)).json().application.applicant_attachment_size).toBeNull()
    expect(s3ReadAsString).not.toHaveBeenCalled()
  })

  it("donne l'objet du mail de réponse envoyé au candidat", async () => {
    const recruiter = await saveRecruiter("recruteur-detail-reponse")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Refuse", { company_recruitment_intention: ApplicationIntention.REFUS, company_name: "Boulangerie du test" })

    const response = await getDetail(offer._id, application._id, (await logUser(httpClient, "recruteur-detail-reponse")).bearerToken)

    expect(response.json().application.feedback_email_subject).toBe("Réponse négative de Boulangerie du test à la candidature de Prénom Refuse")
  })

  it("refuse de lire, via une offre accessible, une candidature d'une autre offre", async () => {
    const recruiter = await saveRecruiter("recruteur-detail-croise")
    const otherRecruiter = await saveRecruiter("autre-recruteur-detail")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const otherOffer = await saveOffer({ managedBy: otherRecruiter.user._id, siret: otherRecruiter.entreprise.siret })
    const otherApplication = await saveApplication(otherOffer._id, "Etrangere")

    const response = await getDetail(offer._id, otherApplication._id, (await logUser(httpClient, "recruteur-detail-croise")).bearerToken)

    expect(response.statusCode).toBe(404)
    expect(response.body).not.toContain("Etrangere")
  })

  it("refuse le détail au recruteur d'une autre entreprise", async () => {
    const recruiter = await saveRecruiter("proprietaire-detail")
    await saveRecruiter("voisin-detail")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Confidentiel")

    const response = await getDetail(offer._id, application._id, (await logUser(httpClient, "voisin-detail")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect(response.body).not.toContain("Confidentiel")
  })
})

describe("GET /application/job/:jobId/application/:applicationId/attachment", () => {
  useMongo()
  const httpClient = useServer()

  beforeEach(() => {
    vi.mocked(s3ReadAsString).mockReset()
    vi.mocked(s3ReadAsString).mockResolvedValue(`data:application/pdf;base64,${Buffer.from("toto").toString("base64")}`)
  })

  const getAttachment = async (jobId: ObjectId, applicationId: ObjectId, headers?: Record<string, string>) =>
    httpClient().inject({ method: "GET", path: `/api/application/job/${jobId}/application/${applicationId}/attachment`, ...(headers ? { headers } : {}) })

  it("télécharge la pièce jointe décodée, sous le nom donné par le candidat", async () => {
    const recruiter = await saveRecruiter("recruteur-pj")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Joint", { applicant_attachment_name: "CV Hélène.pdf" })

    const response = await getAttachment(offer._id, application._id, (await logUser(httpClient, "recruteur-pj")).bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.headers["content-type"]).toBe("application/pdf")
    expect(response.headers["content-disposition"]).toBe(`attachment; filename="CV Helene.pdf"; filename*=UTF-8''CV%20H%C3%A9l%C3%A8ne.pdf`)
    expect(response.body).toBe("toto")
  })

  it("ne sert pas une pièce jointe que l'antivirus n'a pas validée", async () => {
    const recruiter = await saveRecruiter("recruteur-pj-virus")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Infecte", { scan_status: ApplicationScanStatus.VIRUS_DETECTED })

    const response = await getAttachment(offer._id, application._id, (await logUser(httpClient, "recruteur-pj-virus")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect(s3ReadAsString).not.toHaveBeenCalled()
  })

  it("répond 404, et non 403, pour la pièce jointe d'une candidature qui attend encore l'antivirus", async () => {
    const recruiter = await saveRecruiter("recruteur-pj-attente")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Enattente", { to_company_message_id: null, scan_status: ApplicationScanStatus.WAITING_FOR_SCAN })

    const response = await getAttachment(offer._id, application._id, (await logUser(httpClient, "recruteur-pj-attente")).bearerToken)

    expect(response.statusCode).toBe(404)
    expect(s3ReadAsString).not.toHaveBeenCalled()
  })

  it("répond 404 pour une pièce jointe supprimée", async () => {
    const recruiter = await saveRecruiter("recruteur-pj-purge")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Purge", { applicant_attachment_deleted_at: new Date() })

    const response = await getAttachment(offer._id, application._id, (await logUser(httpClient, "recruteur-pj-purge")).bearerToken)

    expect(response.statusCode).toBe(404)
    expect(s3ReadAsString).not.toHaveBeenCalled()
  })

  it("refuse la pièce jointe au recruteur d'une autre entreprise", async () => {
    const recruiter = await saveRecruiter("proprietaire-pj")
    await saveRecruiter("voisin-pj")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Confidentiel")

    const response = await getAttachment(offer._id, application._id, (await logUser(httpClient, "voisin-pj")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect(s3ReadAsString).not.toHaveBeenCalled()
  })

  it("refuse de lire, via une offre accessible, la pièce jointe d'une candidature d'une autre offre", async () => {
    const recruiter = await saveRecruiter("recruteur-pj-croise")
    const otherRecruiter = await saveRecruiter("autre-recruteur-pj")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const otherOffer = await saveOffer({ managedBy: otherRecruiter.user._id, siret: otherRecruiter.entreprise.siret })
    const otherApplication = await saveApplication(otherOffer._id, "Etrangere")

    const response = await getAttachment(offer._id, otherApplication._id, (await logUser(httpClient, "recruteur-pj-croise")).bearerToken)

    expect(response.statusCode).toBe(404)
    expect(s3ReadAsString).not.toHaveBeenCalled()
  })
})

describe("POST /application/job/:jobId/application/:applicationId/treated-elsewhere", () => {
  useMongo()
  const httpClient = useServer()

  const markTreatedElsewhere = async (jobId: ObjectId, applicationId: ObjectId, headers?: Record<string, string>) =>
    httpClient().inject({ method: "POST", path: `/api/application/job/${jobId}/application/${applicationId}/treated-elsewhere`, ...(headers ? { headers } : {}) })

  const getApplication = (applicationId: ObjectId) => getDbCollection("applications").findOne({ _id: applicationId })

  it("pose le statut sur une candidature sans réponse, sans programmer de mail au candidat", async () => {
    const recruiter = await saveRecruiter("recruteur-autre-canal")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Appele")

    const response = await markTreatedElsewhere(offer._id, application._id, (await logUser(httpClient, "recruteur-autre-canal")).bearerToken)

    expect(response.statusCode).toBe(200)
    const saved = await getApplication(application._id)
    expect(saved).toMatchObject({ company_recruitment_intention: APPLICATION_TREATED_ELSEWHERE, company_feedback_send_status: null })
    expect(saved?.company_recruitment_intention_date).toBeInstanceOf(Date)
  })

  it("refuse de remplacer une réponse déjà enregistrée", async () => {
    const recruiter = await saveRecruiter("recruteur-autre-canal-repondu")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Refuse", { company_recruitment_intention: ApplicationIntention.REFUS })

    const response = await markTreatedElsewhere(offer._id, application._id, (await logUser(httpClient, "recruteur-autre-canal-repondu")).bearerToken)

    expect(response.statusCode).toBe(409)
    expect((await getApplication(application._id))?.company_recruitment_intention).toBe(ApplicationIntention.REFUS)
  })

  it("refuse le recruteur d'une autre entreprise", async () => {
    const recruiter = await saveRecruiter("proprietaire-autre-canal")
    await saveRecruiter("voisin-autre-canal")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Confidentiel")

    const response = await markTreatedElsewhere(offer._id, application._id, (await logUser(httpClient, "voisin-autre-canal")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect((await getApplication(application._id))?.company_recruitment_intention).toBeNull()
  })

  it("refuse de modifier, via une offre accessible, une candidature d'une autre offre", async () => {
    const recruiter = await saveRecruiter("recruteur-autre-canal-croise")
    const otherRecruiter = await saveRecruiter("autre-recruteur-autre-canal")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const otherOffer = await saveOffer({ managedBy: otherRecruiter.user._id, siret: otherRecruiter.entreprise.siret })
    const otherApplication = await saveApplication(otherOffer._id, "Etrangere")

    const response = await markTreatedElsewhere(offer._id, otherApplication._id, (await logUser(httpClient, "recruteur-autre-canal-croise")).bearerToken)

    expect(response.statusCode).toBe(404)
    expect((await getApplication(otherApplication._id))?.company_recruitment_intention).toBeNull()
  })
})

describe("POST /application/job/:jobId/application/:applicationId/treated-elsewhere/cancel", () => {
  useMongo()
  const httpClient = useServer()

  const cancelTreatedElsewhere = async (jobId: ObjectId, applicationId: ObjectId, headers?: Record<string, string>) =>
    httpClient().inject({ method: "POST", path: `/api/application/job/${jobId}/application/${applicationId}/treated-elsewhere/cancel`, ...(headers ? { headers } : {}) })

  const getApplication = (applicationId: ObjectId) => getDbCollection("applications").findOne({ _id: applicationId })
  const treatedElsewhere = { company_recruitment_intention: APPLICATION_TREATED_ELSEWHERE, company_recruitment_intention_date: new Date() }

  it("remet la candidature en attente de réponse", async () => {
    const recruiter = await saveRecruiter("recruteur-annule-autre-canal")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Appele", treatedElsewhere)

    const response = await cancelTreatedElsewhere(offer._id, application._id, (await logUser(httpClient, "recruteur-annule-autre-canal")).bearerToken)

    expect(response.statusCode).toBe(200)
    expect(await getApplication(application._id)).toMatchObject({ company_recruitment_intention: null, company_recruitment_intention_date: null })
  })

  it("refuse d'annuler une réponse envoyée par LBA", async () => {
    const recruiter = await saveRecruiter("recruteur-annule-refus")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Refuse", { company_recruitment_intention: ApplicationIntention.REFUS })

    const response = await cancelTreatedElsewhere(offer._id, application._id, (await logUser(httpClient, "recruteur-annule-refus")).bearerToken)

    expect(response.statusCode).toBe(409)
    expect((await getApplication(application._id))?.company_recruitment_intention).toBe(ApplicationIntention.REFUS)
  })

  it("refuse le recruteur d'une autre entreprise", async () => {
    const recruiter = await saveRecruiter("proprietaire-annule-autre-canal")
    await saveRecruiter("voisin-annule-autre-canal")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Confidentiel", treatedElsewhere)

    const response = await cancelTreatedElsewhere(offer._id, application._id, (await logUser(httpClient, "voisin-annule-autre-canal")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect((await getApplication(application._id))?.company_recruitment_intention).toBe(APPLICATION_TREATED_ELSEWHERE)
  })
})

describe("POST /application/job/:jobId/application/:applicationId/reply/cancel", () => {
  useMongo()
  const httpClient = useServer()

  const cancelReply = async (jobId: ObjectId, applicationId: ObjectId, headers?: Record<string, string>) =>
    httpClient().inject({ method: "POST", path: `/api/application/job/${jobId}/application/${applicationId}/reply/cancel`, ...(headers ? { headers } : {}) })

  const getApplication = (applicationId: ObjectId) => getDbCollection("applications").findOne({ _id: applicationId })
  const scheduledReply = {
    company_recruitment_intention: ApplicationIntention.REFUS,
    company_recruitment_intention_date: new Date(),
    company_feedback_send_status: CompanyFeebackSendStatus.SCHEDULED,
  }

  it("annule une réponse programmée comme le formulaire de réponse : la candidature repasse en attente", async () => {
    const recruiter = await saveRecruiter("recruteur-annule-programmee")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Programme", scheduledReply)

    const response = await cancelReply(offer._id, application._id, (await logUser(httpClient, "recruteur-annule-programmee")).bearerToken)

    expect(response.statusCode).toBe(200)
    expect(await getApplication(application._id)).toMatchObject({
      company_recruitment_intention: null,
      company_recruitment_intention_date: null,
      company_feedback_send_status: CompanyFeebackSendStatus.CANCELED,
    })
  })

  it("répond 409 quand la réponse est déjà partie", async () => {
    const recruiter = await saveRecruiter("recruteur-annule-trop-tard")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Envoye", { ...scheduledReply, company_feedback_send_status: CompanyFeebackSendStatus.SENT })

    const response = await cancelReply(offer._id, application._id, (await logUser(httpClient, "recruteur-annule-trop-tard")).bearerToken)

    expect(response.statusCode).toBe(409)
    expect(await getApplication(application._id)).toMatchObject({
      company_recruitment_intention: ApplicationIntention.REFUS,
      company_feedback_send_status: CompanyFeebackSendStatus.SENT,
    })
  })

  it("refuse le recruteur d'une autre entreprise", async () => {
    const recruiter = await saveRecruiter("proprietaire-annule-programmee")
    await saveRecruiter("voisin-annule-programmee")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Confidentiel", scheduledReply)

    const response = await cancelReply(offer._id, application._id, (await logUser(httpClient, "voisin-annule-programmee")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect((await getApplication(application._id))?.company_feedback_send_status).toBe(CompanyFeebackSendStatus.SCHEDULED)
  })
})

describe("GET /application/job/:jobId/application/:applicationId/reply-token", () => {
  useMongo()
  const httpClient = useServer()

  const getReplyToken = async (jobId: ObjectId, applicationId: ObjectId, intention: ApplicationIntention, headers?: Record<string, string>) =>
    httpClient().inject({ method: "GET", path: `/api/application/job/${jobId}/application/${applicationId}/reply-token?intention=${intention}`, ...(headers ? { headers } : {}) })

  it("donne au recruteur un jeton qui ouvre le formulaire de réponse du mail", async () => {
    const recruiter = await saveRecruiter("recruteur-jeton")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Contacte", { job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, company_siret: recruiter.entreprise.siret })

    const response = await getReplyToken(offer._id, application._id, ApplicationIntention.ENTRETIEN, (await logUser(httpClient, "recruteur-jeton")).bearerToken)

    expect(response.statusCode).toBe(200)
    const schedule = await httpClient().inject({
      method: "GET",
      path: `/api/application/intention/schedule/${application._id}?intention=${ApplicationIntention.ENTRETIEN}`,
      headers: { authorization: `Bearer ${response.json().token}` },
    })
    expect(schedule.statusCode).toBe(200)
    expect(schedule.json().espace_pro).toEqual({ job_id: offer._id.toString(), cfa_establishment_id: null, establishment_name: expect.any(String) })
    expect((await getDbCollection("applications").findOne({ _id: application._id }))?.company_recruitment_intention).toBe(ApplicationIntention.ENTRETIEN)
  })

  it("annule l'envoi comme depuis le lien du mail : la candidature repasse en attente", async () => {
    const recruiter = await saveRecruiter("recruteur-jeton-annulation")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Annule", { job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, company_siret: recruiter.entreprise.siret })
    const { token } = (await getReplyToken(offer._id, application._id, ApplicationIntention.REFUS, (await logUser(httpClient, "recruteur-jeton-annulation")).bearerToken)).json()
    const headers = { authorization: `Bearer ${token}` }

    await httpClient().inject({ method: "GET", path: `/api/application/intention/schedule/${application._id}?intention=${ApplicationIntention.REFUS}`, headers })
    const cancel = await httpClient().inject({ method: "POST", path: `/api/application/intention/cancel/${application._id}`, headers })

    expect(cancel.statusCode).toBe(200)
    expect(await getDbCollection("applications").findOne({ _id: application._id })).toMatchObject({
      company_recruitment_intention: null,
      company_feedback_send_status: CompanyFeebackSendStatus.CANCELED,
    })
  })

  it("date la réponse envoyée tout de suite après « Modifier ma réponse », qui avait annulé l'envoi programmé", async () => {
    const recruiter = await saveRecruiter("recruteur-jeton-envoi-immediat")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Immediat", { job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, company_siret: recruiter.entreprise.siret })
    const { token } = (
      await getReplyToken(offer._id, application._id, ApplicationIntention.REFUS, (await logUser(httpClient, "recruteur-jeton-envoi-immediat")).bearerToken)
    ).json()
    const headers = { authorization: `Bearer ${token}` }

    await httpClient().inject({ method: "GET", path: `/api/application/intention/schedule/${application._id}?intention=${ApplicationIntention.REFUS}`, headers })
    await httpClient().inject({ method: "POST", path: `/api/application/intention/cancel/${application._id}`, headers })
    const send = await httpClient().inject({
      method: "POST",
      path: `/api/application/intentionComment/${application._id}`,
      body: { company_recruitment_intention: ApplicationIntention.REFUS, company_feedback: "Merci pour votre candidature.", refusal_reasons: [] },
      headers,
    })

    expect(send.statusCode).toBe(200)
    const saved = await getDbCollection("applications").findOne({ _id: application._id })
    expect(saved).toMatchObject({ company_recruitment_intention: ApplicationIntention.REFUS, company_feedback_send_status: CompanyFeebackSendStatus.SENT })
    expect(saved?.company_recruitment_intention_date).toBeInstanceOf(Date)
    expect(saved?.company_recruitment_intention_date).toEqual(saved?.company_feedback_date)
  })

  it("refuse le jeton à une candidature déjà traitée par un autre canal", async () => {
    const recruiter = await saveRecruiter("recruteur-jeton-autre-canal")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Appele", { company_recruitment_intention: APPLICATION_TREATED_ELSEWHERE })

    const response = await getReplyToken(offer._id, application._id, ApplicationIntention.REFUS, (await logUser(httpClient, "recruteur-jeton-autre-canal")).bearerToken)

    expect(response.statusCode).toBe(409)
  })

  it("refuse le jeton au recruteur d'une autre entreprise", async () => {
    const recruiter = await saveRecruiter("proprietaire-jeton")
    await saveRecruiter("voisin-jeton")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Confidentiel")

    const response = await getReplyToken(offer._id, application._id, ApplicationIntention.REFUS, (await logUser(httpClient, "voisin-jeton")).bearerToken)

    expect(response.statusCode).toBe(403)
    expect(response.body).not.toContain("token")
  })

  it("refuse le jeton d'une candidature d'une autre offre, via une offre accessible", async () => {
    const recruiter = await saveRecruiter("recruteur-jeton-croise")
    const otherRecruiter = await saveRecruiter("autre-recruteur-jeton")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const otherOffer = await saveOffer({ managedBy: otherRecruiter.user._id, siret: otherRecruiter.entreprise.siret })
    const otherApplication = await saveApplication(otherOffer._id, "Etrangere")

    const response = await getReplyToken(offer._id, otherApplication._id, ApplicationIntention.REFUS, (await logUser(httpClient, "recruteur-jeton-croise")).bearerToken)

    expect(response.statusCode).toBe(404)
  })
})

type IApplicationRoute = {
  name: string
  method: "GET" | "POST"
  path: (jobId: ObjectId, applicationId: ObjectId) => string
  data?: Parameters<typeof generateApplicationFixture>[0]
}

// Routes qui exposent ou modifient les candidatures d'une offre, avec l'état que chaque action attend.
const APPLICATION_ROUTES: IApplicationRoute[] = [
  { name: "l'export des candidatures de l'offre", method: "GET", path: (jobId) => `/api/application/job/${jobId}/export` },
  { name: "le détail d'une candidature", method: "GET", path: (jobId, id) => `/api/application/job/${jobId}/application/${id}` },
  { name: "la pièce jointe", method: "GET", path: (jobId, id) => `/api/application/job/${jobId}/application/${id}/attachment` },
  {
    name: "le jeton de réponse",
    method: "GET",
    path: (jobId, id) => `/api/application/job/${jobId}/application/${id}/reply-token?intention=${ApplicationIntention.REFUS}`,
  },
  { name: "« contacté par un autre canal »", method: "POST", path: (jobId, id) => `/api/application/job/${jobId}/application/${id}/treated-elsewhere` },
  {
    name: "l'annulation de « contacté par un autre canal »",
    method: "POST",
    path: (jobId, id) => `/api/application/job/${jobId}/application/${id}/treated-elsewhere/cancel`,
    data: { company_recruitment_intention: APPLICATION_TREATED_ELSEWHERE, company_recruitment_intention_date: new Date() },
  },
  {
    name: "l'annulation d'une réponse programmée",
    method: "POST",
    path: (jobId, id) => `/api/application/job/${jobId}/application/${id}/reply/cancel`,
    data: {
      company_recruitment_intention: ApplicationIntention.REFUS,
      company_recruitment_intention_date: new Date(),
      company_feedback_send_status: CompanyFeebackSendStatus.SCHEDULED,
    },
  },
]
const INDEXED_APPLICATION_ROUTES = APPLICATION_ROUTES.map((route, index) => ({ ...route, index }))

// Le middleware laisse passer l'OPCO par workplace_opco : chaque service doit le refuser (cf. canAccessJobAsEntrepriseOrCfa).
describe("Refus de l'OPCO de rattachement de l'offre", () => {
  useMongo()
  const httpClient = useServer()

  it.each(INDEXED_APPLICATION_ROUTES)("refuse $name", async ({ method, path, data, index }) => {
    const recruiter = await saveRecruiter(`recruteur-opco-${index}`)
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const application = await saveApplication(offer._id, "Protege", data)
    const { bearerToken } = await createAndLogUser(httpClient, `opco-akto-${index}`, { type: "OPCO" })

    const response = await httpClient().inject({ method, path: path(offer._id, application._id), headers: bearerToken })

    expect(response.statusCode).toBe(403)
    expect(response.json().message).toBe("Accès réservé au recruteur de l'offre")
    expect(response.body).not.toMatch(/protege|token/i)
    expect(await getDbCollection("applications").findOne({ _id: application._id })).toEqual(application)
  })

  it("refuse l'export des candidatures de l'entreprise", async () => {
    const recruiter = await saveRecruiter("recruteur-opco-export-entreprise")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Protege")
    const { bearerToken } = await createAndLogUser(httpClient, "opco-akto-export-entreprise", { type: "OPCO" })

    const response = await httpClient().inject({
      method: "GET",
      path: `/api/application/establishment/${recruiter.user._id}_${recruiter.entreprise.siret}/export`,
      headers: bearerToken,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().message).toBe("Accès réservé au recruteur de l'entreprise ou au CFA qui la gère")
    expect(response.body).not.toMatch(/protege/i)
  })
})

describe("Refus d'un autre CFA que celui qui gère l'offre", () => {
  useMongo()
  const httpClient = useServer()

  it.each(INDEXED_APPLICATION_ROUTES)("refuse $name", async ({ method, path, data, index }) => {
    const owner = await saveCfa(`cfa-gestionnaire-${index}`)
    await saveCfa(`cfa-voisin-${index}`)
    const offer = await saveOffer({ managedBy: owner.user._id, siret: owner.entreprise.siret, cfaSiret: owner.cfa.siret })
    const application = await saveApplication(offer._id, "Protege", data)

    const response = await httpClient().inject({ method, path: path(offer._id, application._id), headers: (await logUser(httpClient, `cfa-voisin-${index}`)).bearerToken })

    expect(response.statusCode).toBe(403)
    expect(response.body).not.toMatch(/protege|token/i)
    expect(await getDbCollection("applications").findOne({ _id: application._id })).toEqual(application)
  })
})

describe("Refus de l'export des candidatures d'une autre entreprise", () => {
  useMongo()
  const httpClient = useServer()

  // Le middleware ne trouve aucune offre du demandeur sur ce siret et laisse passer : c'est le service qui refuse.
  it("refuse au recruteur d'une autre entreprise l'export d'une entreprise qui n'est pas la sienne", async () => {
    const recruiter = await saveRecruiter("proprietaire-export-entreprise")
    await saveRecruiter("voisin-export-entreprise")
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    await saveApplication(offer._id, "Protege")

    const response = await httpClient().inject({
      method: "GET",
      path: `/api/application/establishment/${recruiter.user._id}_${recruiter.entreprise.siret}/export`,
      headers: (await logUser(httpClient, "voisin-export-entreprise")).bearerToken,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().message).toBe("Accès réservé au recruteur de l'entreprise ou au CFA qui la gère")
    expect(response.body).not.toMatch(/protege/i)
  })
})

describe("Refus d'agir, via une offre accessible, sur la candidature d'une autre offre", () => {
  useMongo()
  const httpClient = useServer()

  const CANCEL_ROUTES = INDEXED_APPLICATION_ROUTES.filter(({ path }) => /\/cancel$/.test(path(new ObjectId(), new ObjectId())))

  it.each(CANCEL_ROUTES)("refuse $name", async ({ method, path, data, index }) => {
    const recruiter = await saveRecruiter(`recruteur-croise-${index}`)
    const otherRecruiter = await saveRecruiter(`autre-recruteur-croise-${index}`)
    const offer = await saveOffer({ managedBy: recruiter.user._id, siret: recruiter.entreprise.siret })
    const otherOffer = await saveOffer({ managedBy: otherRecruiter.user._id, siret: otherRecruiter.entreprise.siret })
    const otherApplication = await saveApplication(otherOffer._id, "Etrangere", data)

    const response = await httpClient().inject({
      method,
      path: path(offer._id, otherApplication._id),
      headers: (await logUser(httpClient, `recruteur-croise-${index}`)).bearerToken,
    })

    expect(response.statusCode).toBe(404)
    expect(await getDbCollection("applications").findOne({ _id: otherApplication._id })).toEqual(otherApplication)
  })
})
