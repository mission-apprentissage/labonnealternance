import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { createAndLogUser, logUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import {
  entrepriseStatusEventFactory,
  roleManagementEventFactory,
  saveAdminUserTest,
  saveCfa,
  saveCfaUserTest,
  saveEntreprise,
  saveEntrepriseUserTest,
  saveOpcoUserTest,
  saveRoleManagement,
  saveUserWithAccount,
  validatedUserStatus,
} from "@tests/utils/user.test.utils"
import { OPCOS_LABEL } from "shared/constants/index"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { AccessEntityType, AccessStatus, DEACTIVATION_REASON_MAX_LENGTH, DEACTIVATION_REASON_MIN_LENGTH } from "shared/models/role-management.model"
import { validateSIRET } from "shared/validators/siret-validator"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"

vi.mock("@/services/mailer.service", () => ({ default: { sendEmail: vi.fn().mockResolvedValue({}) } }))

describe("Modification des utilisateurs par ADMIN et par utilisateur OPCO ", () => {
  beforeEach(async () => {
    return async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("entreprises").deleteMany({})
      await getDbCollection("userswithaccounts").deleteMany({})
      await getDbCollection("rolemanagements").deleteMany({})
    }
  })

  useMongo()
  const httpClient = useServer()

  it("Vérifie qu'une création d'ADMIN ou d'utilisateur OPCO légitime fonctionne correctement", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

    const response1 = await httpClient().inject({
      method: "POST",
      path: "/api/admin/users",
      headers: bearerToken,
      body: {
        email: "admin-bis@mail.fr",
        first_name: "first_name",
        last_name: "last_name",
        phone: "",
        type: "ADMIN",
      },
    })
    expect.soft(response1.statusCode).to.equal(200)

    const response2 = await httpClient().inject({
      method: "POST",
      path: "/api/admin/users",
      headers: bearerToken,
      body: {
        email: "opco-bis@mail.fr",
        first_name: "first_name",
        last_name: "last_name",
        phone: "",
        type: "OPCO",
        opco: OPCOS_LABEL.ATLAS,
      },
    })
    expect.soft(response2.statusCode).to.equal(200)
  })

  it("Vérifie qu'une création d'ADMIN ou d'utilisateur OPCO par un utilisateur OPCO est bloquée", async () => {
    let loggedUser = await createAndLogUser(httpClient, "userOPCO", { type: "OPCO" })
    const response1 = await httpClient().inject({
      method: "POST",
      path: "/api/admin/users",
      headers: loggedUser.bearerToken,
      body: {
        email: "admin-bis@mail.fr",
        first_name: "first_name",
        last_name: "last_name",
        phone: "",
        type: "ADMIN",
      },
    })
    expect.soft(response1.statusCode).to.equal(403)

    loggedUser = await logUser(httpClient, "userOPCO")
    const response2 = await httpClient().inject({
      method: "POST",
      path: "/api/admin/users",
      headers: loggedUser.bearerToken,
      body: {
        email: "opco-bis@mail.fr",
        first_name: "first_name",
        last_name: "last_name",
        phone: "",
        type: "OPCO",
        opco: OPCOS_LABEL.ATLAS,
      },
    })
    expect.soft(response2.statusCode).to.equal(403)
  })

  it("Vérifie qu'une modification des paramètres d'un ADMIN ou d'un utilisateur OPCO légitime fonctionne correctement", async () => {
    const { bearerToken, user } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

    const response1 = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${user._id.toString()}`,
      headers: bearerToken,
      body: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
    })
    expect.soft(response1.statusCode).to.equal(200)

    const userOpco = (await saveOpcoUserTest(OPCOS_LABEL.CONSTRUCTYS)).user

    const response2 = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${userOpco._id.toString()}`,
      headers: bearerToken,
      body: {
        email: userOpco.email,
        first_name: "Newfirstname",
        last_name: "Newlastname",
        phone: "0606060606",
      },
    })
    expect.soft(response2.statusCode).to.equal(200)
  })

  it("Vérifie qu'une modification d'ADMIN ou d'utilisateur OPCO  par un utilisateur OPCO est bloquée", async () => {
    let loggedUser = await createAndLogUser(httpClient, "userOPCO", { type: "OPCO" })
    const adminUser = (await saveAdminUserTest()).user
    const response1 = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${adminUser._id.toString()}`,
      headers: loggedUser.bearerToken,
      body: {
        email: adminUser.email,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        phone: adminUser.phone,
      },
    })
    expect.soft(response1.statusCode).to.equal(403)

    loggedUser = await logUser(httpClient, "userOPCO")
    const opcoUser = (await saveOpcoUserTest(OPCOS_LABEL.CONSTRUCTYS)).user
    const response2 = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${opcoUser._id.toString()}`,
      headers: loggedUser.bearerToken,
      body: {
        email: opcoUser.email,
        first_name: "Newfirstname",
        last_name: "Newlastname",
        phone: "0606060606",
      },
    })
    expect.soft(response2.statusCode).to.equal(403)
  })

  it("Vérifie qu'une modification légitime d'OPCO fonctionne correctement", async () => {
    const entrepriseUserA = await saveEntrepriseUserTest({}, {}, { siret: "89557430766546", opco: OPCOS_LABEL.AKTO })
    const entrepriseUserB = await saveEntrepriseUserTest({}, {}, { siret: "10392947668876", opco: OPCOS_LABEL.CONSTRUCTYS })

    let loggedUser = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

    let response = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${entrepriseUserA.user._id.toString()}/organization/${entrepriseUserA.entreprise.siret}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: "testfirstname",
        last_name: "testlastname",
        email: entrepriseUserA.user.email,
        phone: entrepriseUserA.user.phone,
        opco: entrepriseUserA.entreprise.opco,
      },
    })
    expect.soft(response.statusCode).toBe(200)

    //test nom d'OPCO erroné
    response = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${entrepriseUserA.user._id.toString()}/organization/${entrepriseUserA.entreprise.siret}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: "testfirstname",
        last_name: "testlastname",
        email: `${Math.random()}@mail.fr`,
        phone: entrepriseUserA.user.phone,
        opco: "NOT_AN_OPCO",
      },
    })
    expect.soft(response.statusCode).toBe(400)

    // test entreprise non reliée à l'utilisateur
    response = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${entrepriseUserB.user._id.toString()}/organization/${entrepriseUserA.entreprise.siret}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: "testfirstname",
        last_name: "testlastname",
        email: `${Math.random()}@mail.fr`,
        phone: entrepriseUserA.user.phone,
      },
    })
    expect.soft(response.statusCode).toBe(403)
    expect.soft(JSON.parse(response.body).data.error).toBe("UNSUPPORTED")

    // test de modification par un opco
    loggedUser = await createAndLogUser(httpClient, "userOPCO", { type: "OPCO" })
    response = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${entrepriseUserA.user._id.toString()}/organization/${entrepriseUserA.entreprise.siret}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: "testfirstname",
        last_name: "testlastname",
        email: entrepriseUserA.user.email,
        phone: entrepriseUserA.user.phone,
        opco: entrepriseUserA.entreprise.opco,
      },
    })
    expect.soft(response.statusCode).toBe(200)

    // tentative modification société liée à un autre OPCO que l'utilisateur OPCO
    response = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${entrepriseUserB.user._id.toString()}/organization/${entrepriseUserB.entreprise.siret}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: "testfirstname",
        last_name: "testlastname",
        email: entrepriseUserA.user.email,
        phone: entrepriseUserA.user.phone,
        opco: entrepriseUserA.entreprise.opco,
      },
    })
    expect.soft(response.statusCode).toBe(403)
  })

  it("met à jour l'OPCO uniquement sur les offres LBA gérées par l'utilisateur ciblé", async () => {
    const entrepriseUser = await saveEntrepriseUserTest({}, {}, { siret: "89557430766546", opco: OPCOS_LABEL.AKTO })
    await createJobPartner({
      workplace_siret: entrepriseUser.entreprise.siret,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      managed_by: entrepriseUser.user._id,
      workplace_opco: OPCOS_LABEL.AKTO,
    })
    const externalPartnerOffer = await createJobPartner({
      workplace_siret: entrepriseUser.entreprise.siret,
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      workplace_opco: OPCOS_LABEL.AKTO,
    })
    const otherManagedLbaOffer = await createJobPartner({
      workplace_siret: entrepriseUser.entreprise.siret,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      workplace_opco: OPCOS_LABEL.AKTO,
    })

    const loggedUser = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${entrepriseUser.user._id.toString()}/organization/${entrepriseUser.entreprise.siret}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: entrepriseUser.user.first_name,
        last_name: entrepriseUser.user.last_name,
        email: entrepriseUser.user.email,
        phone: entrepriseUser.user.phone,
        opco: OPCOS_LABEL.CONSTRUCTYS,
      },
    })

    expect.soft(response.statusCode).toBe(200)

    const updatedManagedOffer = await getDbCollection("jobs_partners").findOne({
      workplace_siret: entrepriseUser.entreprise.siret,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      managed_by: entrepriseUser.user._id,
    })
    const unchangedExternalOffer = await getDbCollection("jobs_partners").findOne({ _id: externalPartnerOffer._id })
    const unchangedOtherManagedOffer = await getDbCollection("jobs_partners").findOne({ _id: otherManagedLbaOffer._id })

    expect.soft(updatedManagedOffer?.workplace_opco).toBe(OPCOS_LABEL.CONSTRUCTYS)
    expect.soft(unchangedExternalOffer?.workplace_opco).toBe(OPCOS_LABEL.AKTO)
    expect.soft(unchangedOtherManagedOffer?.workplace_opco).toBe(OPCOS_LABEL.AKTO)
  })
})

describe("Modification du compte par l'entreprise elle-même (PUT /user/:userId, self-service)", () => {
  beforeEach(async () => {
    await getDbCollection("entreprises").deleteMany({})
    await getDbCollection("userswithaccounts").deleteMany({})
    await getDbCollection("rolemanagements").deleteMany({})
    await getDbCollection("referentiel_engagement_entreprise").deleteMany({})
  })

  useMongo()
  const httpClient = useServer()

  it("enregistre l'engagement handicap (source lba) quand l'entreprise choisit \"oui\"", async () => {
    const entrepriseUser = await saveEntrepriseUserTest(
      { email: "compteentreprise1@mail.com", status: validatedUserStatus },
      {},
      { siret: "89557430766546", status: [entrepriseStatusEventFactory()] }
    )
    const loggedUser = await logUser(httpClient, "compteentreprise1")

    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/user/${entrepriseUser.user._id.toString()}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: entrepriseUser.user.first_name,
        last_name: entrepriseUser.user.last_name,
        email: entrepriseUser.user.email,
        phone: entrepriseUser.user.phone,
        handiEngagement: "oui",
      },
    })
    expect.soft(response.statusCode).toBe(200)

    const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: entrepriseUser.entreprise.siret })
    expect.soft(referentiel?.sources).toEqual([EntrepriseEngagementSources.LBA])
  })

  it("n'écrit rien dans referentiel_engagement_entreprise quand l'entreprise choisit \"non\"", async () => {
    const entrepriseUser = await saveEntrepriseUserTest(
      { email: "compteentreprise2@mail.com", status: validatedUserStatus },
      {},
      { siret: "10392947668876", status: [entrepriseStatusEventFactory()] }
    )
    const loggedUser = await logUser(httpClient, "compteentreprise2")

    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/user/${entrepriseUser.user._id.toString()}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: entrepriseUser.user.first_name,
        last_name: entrepriseUser.user.last_name,
        email: entrepriseUser.user.email,
        phone: entrepriseUser.user.phone,
        handiEngagement: "non",
      },
    })
    expect.soft(response.statusCode).toBe(200)

    const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: entrepriseUser.entreprise.siret })
    expect.soft(referentiel).toBeNull()
  })

  it("ne touche pas au référentiel quand handiEngagement est omis (mise à jour du seul contact)", async () => {
    const entrepriseUser = await saveEntrepriseUserTest(
      { email: "compteentreprise3@mail.com", status: validatedUserStatus },
      {},
      { siret: "77298992300012", status: [entrepriseStatusEventFactory()] }
    )
    const loggedUser = await logUser(httpClient, "compteentreprise3")

    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/user/${entrepriseUser.user._id.toString()}`,
      headers: loggedUser.bearerToken,
      body: {
        first_name: "Nouveauprenom",
        last_name: entrepriseUser.user.last_name,
        email: entrepriseUser.user.email,
        phone: entrepriseUser.user.phone,
      },
    })
    expect.soft(response.statusCode).toBe(200)

    const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: entrepriseUser.entreprise.siret })
    expect.soft(referentiel).toBeNull()
    const updatedUser = await getDbCollection("userswithaccounts").findOne({ _id: entrepriseUser.user._id })
    expect.soft(updatedUser?.first_name).toBe("Nouveauprenom")
  })
})

describe("conformité des offres dans les listes de comptes (#5757)", () => {
  useMongo()
  const httpClient = useServer()

  // La réponse valide la clé de Luhn des SIRET : le dernier chiffre est choisi pour la satisfaire.
  let siretSequence = 0
  const nextSiret = () => {
    const prefix = String(9100000000000 + ++siretSequence)
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `${prefix}${digit}`).find(validateSIRET) as string
  }
  const DESCRIPTION = "Description de l'offre, jamais renvoyée par les listes de comptes"

  const saveAccount = (raison_sociale: string, { opco = OPCOS_LABEL.AKTO, roleStatus = AccessStatus.AWAITING_VALIDATION } = {}) =>
    saveEntrepriseUserTest(
      {},
      { status: [roleManagementEventFactory({ status: roleStatus })] },
      { siret: nextSiret(), raison_sociale, opco, status: [entrepriseStatusEventFactory()] }
    )

  type IAccount = Awaited<ReturnType<typeof saveAccount>>

  const saveOffer = (account: IAccount, offer: Partial<IJobsPartnersOfferPrivate> = {}) =>
    createJobPartner({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      managed_by: account.user._id,
      workplace_siret: account.entreprise.siret,
      workplace_opco: OPCOS_LABEL.AKTO,
      offer_description: DESCRIPTION,
      offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE,
      offer_moderation_verdict: "conforme",
      offer_moderation_status: "ok",
      offer_moderation_review: null,
      ...offer,
    })

  const conformityBySociete = (rows: { establishment_raison_sociale?: string; offer_conformity: string }[]) =>
    Object.fromEntries(rows.map(({ establishment_raison_sociale, offer_conformity }) => [establishment_raison_sociale, offer_conformity]))

  it("donne à chaque compte la conformité de sa pire offre non close, par entreprise et pour les offres déposées par un CFA", async () => {
    await saveAccount("Recette sans offre")
    const partenaire = await saveAccount("Recette avec offre partenaire")
    await saveOffer(partenaire, { partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_moderation_verdict: "non_conforme" })
    const closes = await saveAccount("Recette offres closes")
    await saveOffer(closes, { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_moderation_verdict: "non_conforme" })
    await saveOffer(closes, { offer_status: JOB_STATUS_ENGLISH.POURVUE, offer_moderation_verdict: "non_conforme" })
    const jamaisAnalysee = await saveAccount("Recette jamais analysée")
    await saveOffer(jamaisAnalysee, { offer_moderation_verdict: undefined, offer_moderation_status: undefined })
    const aVerifier = await saveAccount("Recette à vérifier")
    await saveOffer(aVerifier, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await saveOffer(aVerifier, { offer_moderation_verdict: "a_verifier" })
    await saveOffer(aVerifier, { offer_moderation_verdict: undefined, offer_moderation_status: undefined })
    const indisponible = await saveAccount("Recette analyse indisponible")
    await saveOffer(indisponible, { offer_moderation_verdict: "a_verifier" })
    await saveOffer(indisponible, { offer_status: JOB_STATUS_ENGLISH.EN_MODERATION, offer_moderation_verdict: "a_verifier", offer_moderation_status: "epuise" })
    const nonConforme = await saveAccount("Recette non conforme")
    await saveOffer(nonConforme, { offer_moderation_status: "indisponible", offer_moderation_verdict: "a_verifier" })
    await saveOffer(nonConforme, { offer_status: JOB_STATUS_ENGLISH.EN_MODERATION, offer_moderation_verdict: "non_conforme" })
    const validee = await saveAccount("Recette validée par la modération", { roleStatus: AccessStatus.GRANTED })
    await saveOffer(validee, { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "non_conforme", offer_moderation_review: "validee" })
    // Un même utilisateur sur deux entreprises : chacune garde la conformité de ses offres.
    const premiere = await saveAccount("Recette première entreprise")
    const seconde = await saveEntrepriseUserTest(
      {},
      { user_id: premiere.user._id, status: [roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION })] },
      { siret: nextSiret(), raison_sociale: "Recette seconde entreprise", status: [entrepriseStatusEventFactory()] }
    )
    await getDbCollection("userswithaccounts").deleteOne({ _id: seconde.user._id })
    await saveOffer(premiere, { offer_moderation_verdict: "non_conforme" })
    await saveOffer({ user: premiere.user, entreprise: seconde.entreprise } as IAccount)
    const cfa = await saveCfaUserTest({}, { siret: nextSiret(), raison_sociale: "Recette CFA" }, { siret: nextSiret() })
    await getDbCollection("rolemanagements").updateOne({ _id: cfa.role._id }, { $set: { status: [roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION })] } })
    await createJobPartner({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      managed_by: cfa.user._id,
      workplace_siret: cfa.entreprise.siret,
      is_delegated: true,
      cfa_siret: cfa.cfa.siret,
      offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE,
      offer_moderation_verdict: "non_conforme",
      offer_moderation_status: "ok",
      offer_moderation_review: null,
    })
    const { bearerToken } = await createAndLogUser(httpClient, "admin-recruteurs", { type: "ADMIN" })

    const response = await httpClient().inject({ method: "GET", path: "/api/admin/users-recruteurs?search=Recette", headers: bearerToken })

    expect(response.statusCode).toBe(200)
    expect(conformityBySociete(response.json())).toEqual({
      "Recette sans offre": "aucune_offre",
      "Recette avec offre partenaire": "aucune_offre",
      "Recette offres closes": "aucune_offre",
      "Recette jamais analysée": "non_applicable",
      "Recette à vérifier": "a_verifier",
      "Recette analyse indisponible": "indisponible",
      "Recette non conforme": "non_conforme",
      "Recette validée par la modération": "conforme",
      "Recette première entreprise": "non_conforme",
      "Recette seconde entreprise": "conforme",
      "Recette CFA": "non_conforme",
    })
    expect(response.body).not.toContain(DESCRIPTION)
  })

  it("calcule la conformité des entreprises d'un OPCO sur les seules offres de son OPCO", async () => {
    const dansPerimetre = await saveAccount("Recette OPCO dans le périmètre")
    await saveOffer(dansPerimetre, { offer_moderation_verdict: "non_conforme" })
    // Offre rattachée à un autre OPCO : l'OPCO ne peut pas l'ouvrir, sa conformité ne lui est pas montrée.
    const horsPerimetre = await saveAccount("Recette OPCO offre d'un autre OPCO")
    await saveOffer(horsPerimetre, { offer_moderation_verdict: "non_conforme", workplace_opco: OPCOS_LABEL.ATLAS })
    await saveOffer(horsPerimetre, { offer_moderation_verdict: "a_verifier" })
    await saveAccount("Recette entreprise d'un autre OPCO", { opco: OPCOS_LABEL.ATLAS })
    const { bearerToken } = await createAndLogUser(httpClient, "opco-recruteurs", { type: "OPCO" })

    const response = await httpClient().inject({ method: "GET", path: "/api/user/opco", headers: bearerToken })

    expect(response.statusCode).toBe(200)
    expect(conformityBySociete(response.json().awaiting)).toEqual({
      "Recette OPCO dans le périmètre": "non_conforme",
      "Recette OPCO offre d'un autre OPCO": "a_verifier",
    })
    expect(response.body).not.toContain(DESCRIPTION)
  })

  it("refuse les listes de comptes à un CFA et à un recruteur", async () => {
    await saveEntrepriseUserTest({ email: "recruteur-listes@mail.com" }, {}, { siret: nextSiret() })

    // Une réponse 403 ferme la session (cf. errorMiddleware) : chaque appel refusé part d'une connexion neuve.
    const responses = [
      await httpClient().inject({ method: "GET", path: "/api/admin/users-recruteurs", headers: (await createAndLogUser(httpClient, "cfa-listes", { type: "CFA" })).bearerToken }),
      await httpClient().inject({ method: "GET", path: "/api/user/opco", headers: (await logUser(httpClient, "cfa-listes")).bearerToken }),
      await httpClient().inject({ method: "GET", path: "/api/admin/users-recruteurs", headers: (await logUser(httpClient, "recruteur-listes")).bearerToken }),
      await httpClient().inject({ method: "GET", path: "/api/user/opco", headers: (await logUser(httpClient, "recruteur-listes")).bearerToken }),
    ]

    expect(responses.map(({ statusCode }) => statusCode)).toEqual([403, 403, 403, 403])
  })
})

describe("GET /user/:userId/organization/:organizationId/same-siret-accounts", () => {
  useMongo()
  const httpClient = useServer()

  const SIRET = "90000000000027"
  const AUTRE_SIRET = "90000000000035"

  const setup = async () => {
    const entreprise = await saveEntreprise({ siret: SIRET, opco: OPCOS_LABEL.AKTO, status: [entrepriseStatusEventFactory()] })
    const autreEntreprise = await saveEntreprise({ siret: AUTRE_SIRET, opco: OPCOS_LABEL.AKTO, status: [entrepriseStatusEventFactory()] })
    const saveAccount = async (
      organizationId: string,
      status: AccessStatus,
      createdAt: Date,
      authorized_type = AccessEntityType.ENTREPRISE,
      reason = "reason",
      contact: { first_name?: string; last_name?: string; phone?: string } = {}
    ) => {
      const user = await saveUserWithAccount({ status: validatedUserStatus, first_name: "Hugo", last_name: "Martin", phone: "0699999999", ...contact })
      await saveRoleManagement({ user_id: user._id, authorized_id: organizationId, authorized_type, createdAt, status: [roleManagementEventFactory({ status, reason })] })
      return user
    }
    const cible = await saveAccount(entreprise._id.toString(), AccessStatus.AWAITING_VALIDATION, new Date("2026-11-01"), AccessEntityType.ENTREPRISE, "reason", {
      first_name: "Léa",
      last_name: "Durand",
      phone: "0601020304",
    })
    await saveRoleManagement({
      user_id: cible._id,
      authorized_id: autreEntreprise._id.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [roleManagementEventFactory()],
    })
    const ancien = await saveAccount(entreprise._id.toString(), AccessStatus.GRANTED, new Date("2025-03-01"))
    const desactive = await saveAccount(entreprise._id.toString(), AccessStatus.DENIED, new Date("2026-06-01"), AccessEntityType.ENTREPRISE, "doublon", {
      first_name: "Lea",
      last_name: "DURAND",
      phone: "+33 6 01 02 03 04",
    })
    await saveAccount(autreEntreprise._id.toString(), AccessStatus.GRANTED, new Date("2026-01-01"))
    const cfa = await saveCfa({ siret: SIRET })
    await saveAccount(cfa._id.toString(), AccessStatus.GRANTED, new Date("2026-01-01"), AccessEntityType.CFA)

    const offre = { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: ancien._id }
    await createJobPartner({ ...offre, workplace_siret: SIRET, workplace_opco: OPCOS_LABEL.AKTO })
    await createJobPartner({ ...offre, workplace_siret: SIRET, workplace_opco: OPCOS_LABEL.AKTO })
    await createJobPartner({ ...offre, workplace_siret: SIRET, workplace_opco: OPCOS_LABEL.ATLAS })
    await createJobPartner({ ...offre, workplace_siret: AUTRE_SIRET, workplace_opco: OPCOS_LABEL.AKTO })
    await createJobPartner({ ...offre, partner_label: JOBPARTNERS_LABEL.HELLOWORK, workplace_siret: SIRET, workplace_opco: OPCOS_LABEL.AKTO })

    return { entreprise, cible, ancien, desactive }
  }

  const callRoute = (userId: string, organizationId: string, headers: Record<string, string>) =>
    httpClient().inject({ method: "GET", path: `/api/user/${userId}/organization/${organizationId}/same-siret-accounts`, headers })

  it("liste les autres comptes du même SIRET, sans le compte consulté, ses autres SIRET ni un CFA de même SIRET", async () => {
    const { entreprise, cible, ancien, desactive } = await setup()
    const { bearerToken } = await createAndLogUser(httpClient, "admin-same-siret", { type: "ADMIN" })

    const response = await callRoute(cible._id.toString(), entreprise._id.toString(), bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      expect.objectContaining({ _id: desactive._id.toString(), status: ETAT_UTILISATEUR.DESACTIVE, status_reason: "doublon", jobs_count: 0, matches: ["phone", "name"] }),
      expect.objectContaining({ _id: ancien._id.toString(), status: ETAT_UTILISATEUR.VALIDE, createdAt: new Date("2025-03-01").toISOString(), jobs_count: 3, matches: [] }),
    ])
  })

  it("ne compte pour un OPCO que les offres de son OPCO", async () => {
    const { entreprise, cible, ancien } = await setup()
    const { bearerToken } = await createAndLogUser(httpClient, "opco-same-siret", { type: "OPCO" })

    const response = await callRoute(cible._id.toString(), entreprise._id.toString(), bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.json().find(({ _id }) => _id === ancien._id.toString())?.jobs_count).toBe(2)
  })

  it("renvoie une liste vide quand aucun autre compte n'a ce SIRET", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({}, {}, { siret: SIRET, status: [entrepriseStatusEventFactory()] })
    const { bearerToken } = await createAndLogUser(httpClient, "admin-same-siret-vide", { type: "ADMIN" })

    const response = await callRoute(user._id.toString(), entreprise._id.toString(), bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it("refuse un recruteur qui consulte son propre compte", async () => {
    const { bearerToken, user } = await createAndLogUser(httpClient, "cfa-same-siret", { type: "CFA" })
    const role = await getDbCollection("rolemanagements").findOne({ user_id: user._id })
    const autreCompte = await saveUserWithAccount({ status: validatedUserStatus })
    await saveRoleManagement({ user_id: autreCompte._id, authorized_id: role!.authorized_id, authorized_type: AccessEntityType.CFA, status: [roleManagementEventFactory()] })

    const response = await callRoute(user._id.toString(), role!.authorized_id, bearerToken)

    expect(response.statusCode).toBe(403)
  })
})

describe("Périmètre d'un OPCO sur les fiches d'un utilisateur multi-compte", () => {
  useMongo()
  const httpClient = useServer()

  const setup = async () => {
    const entrepriseAkto = await saveEntreprise({ siret: "90000000000043", opco: OPCOS_LABEL.AKTO, status: [entrepriseStatusEventFactory()] })
    const entrepriseAtlas = await saveEntreprise({ siret: "90000000000050", opco: OPCOS_LABEL.ATLAS, status: [entrepriseStatusEventFactory()] })
    const cfa = await saveCfa({ siret: "90000000000068" })
    const cible = await saveUserWithAccount({ status: validatedUserStatus })
    const saveRole = (authorized_id: string, authorized_type: AccessEntityType, status: AccessStatus) =>
      saveRoleManagement({ user_id: cible._id, authorized_id, authorized_type, status: [roleManagementEventFactory({ status })] })
    await saveRole(entrepriseAkto._id.toString(), AccessEntityType.ENTREPRISE, AccessStatus.AWAITING_VALIDATION)
    await saveRole(entrepriseAtlas._id.toString(), AccessEntityType.ENTREPRISE, AccessStatus.GRANTED)
    await saveRole(cfa._id.toString(), AccessEntityType.CFA, AccessStatus.GRANTED)
    return { cible, entrepriseAkto, entrepriseAtlas, cfa }
  }

  const get = (path: string, headers: Record<string, string>) => httpClient().inject({ method: "GET", path: `/api${path}`, headers })

  it("ne laisse pas un OPCO atteindre, par repli, l'entreprise d'un autre OPCO", async () => {
    const { cible, entrepriseAkto } = await setup()
    const { bearerToken } = await createAndLogUser(httpClient, "opco-perimetre", { type: "OPCO" })

    const response = await get(`/user/${cible._id}/organization/unused`, bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.json().organizationId).toBe(entrepriseAkto._id.toString())
  })

  it.each([
    ["l'entreprise d'un autre OPCO", "entrepriseAtlas"],
    ["un CFA", "cfa"],
  ] as const)("refuse à un OPCO la fiche et les autres comptes de %s", async (_label, organization) => {
    const fixtures = await setup()
    const username = `opco-perimetre-${organization}`
    const { bearerToken } = await createAndLogUser(httpClient, username, { type: "OPCO" })
    const organizationId = fixtures[organization]._id.toString()

    expect((await get(`/user/${fixtures.cible._id}/organization/${organizationId}`, bearerToken)).statusCode).toBe(403)
    // errorMiddleware ferme la session à chaque 403 : nouvelle connexion avant la seconde route.
    const { bearerToken: newToken } = await logUser(httpClient, username)
    expect((await get(`/user/${fixtures.cible._id}/organization/${organizationId}/same-siret-accounts`, newToken)).statusCode).toBe(403)
  })

  it("exige l'organisation exacte pour lister les autres comptes", async () => {
    const { cible, entrepriseAkto } = await setup()
    const { bearerToken } = await createAndLogUser(httpClient, "opco-perimetre-exact", { type: "OPCO" })

    expect((await get(`/user/${cible._id}/organization/unused/same-siret-accounts`, bearerToken)).statusCode).toBe(400)
    expect((await get(`/user/${cible._id}/organization/${entrepriseAkto._id}/same-siret-accounts`, bearerToken)).statusCode).toBe(200)
  })

  it("laisse un admin retomber sur le rôle validé, comme avant", async () => {
    const { cible, entrepriseAtlas } = await setup()
    const { bearerToken } = await createAndLogUser(httpClient, "admin-perimetre", { type: "ADMIN" })

    const response = await get(`/user/${cible._id}/organization/unused`, bearerToken)

    expect(response.statusCode).toBe(200)
    expect(response.json().organizationId).toBe(entrepriseAtlas._id.toString())
  })
})

describe("motif de désactivation d'un compte (#6022)", () => {
  beforeEach(async () => {
    await getDbCollection("entreprises").deleteMany({})
    await getDbCollection("userswithaccounts").deleteMany({})
    await getDbCollection("rolemanagements").deleteMany({})
  })

  useMongo()
  const httpClient = useServer()

  const postReason = async (action: "deactivate" | "not-my-opco", reason: string) => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const { user, entreprise, role } = await saveEntrepriseUserTest()
    const response = await httpClient().inject({
      method: "POST",
      path: `/api/user/${user._id}/organization/${entreprise._id}/${action}`,
      headers: bearerToken,
      body: { reason },
    })
    const savedRole = await getDbCollection("rolemanagements").findOne({ _id: role._id })
    return { response, lastEvent: savedRole?.status.at(-1) }
  }

  it.each([
    ["trop court", "a".repeat(DEACTIVATION_REASON_MIN_LENGTH - 1)],
    ["trop court une fois les espaces retirés", `  ${"a".repeat(DEACTIVATION_REASON_MIN_LENGTH - 1)}  `],
    ["trop long", "a".repeat(DEACTIVATION_REASON_MAX_LENGTH + 1)],
  ])("refuse un motif %s sans désactiver le compte", async (_label, reason) => {
    const { response, lastEvent } = await postReason("deactivate", reason)
    expect.soft(response.statusCode).toBe(400)
    expect.soft(lastEvent?.status).toBe(AccessStatus.GRANTED)
  })

  it("enregistre un motif de longueur maximale sans le tronquer", async () => {
    const reason = "ligne 1\nligne 2 ".padEnd(DEACTIVATION_REASON_MAX_LENGTH, "é")
    expect(reason).toHaveLength(DEACTIVATION_REASON_MAX_LENGTH)
    const { response, lastEvent } = await postReason("deactivate", reason)
    expect.soft(response.statusCode).toBe(200)
    expect.soft(lastEvent?.status).toBe(AccessStatus.DENIED)
    expect.soft(lastEvent?.reason).toBe(reason)
  })

  it("enregistre le motif sans ses espaces de début et de fin", async () => {
    const { response, lastEvent } = await postReason("deactivate", "  motif valide  ")
    expect.soft(response.statusCode).toBe(200)
    expect.soft(lastEvent?.reason).toBe("motif valide")
  })

  it("remet le compte en attente de validation sur not-my-opco avec un motif valide", async () => {
    const { response, lastEvent } = await postReason("not-my-opco", "Ne relève pas des champs de compétences de mon OPCO")
    expect.soft(response.statusCode).toBe(200)
    expect.soft(lastEvent?.status).toBe(AccessStatus.AWAITING_VALIDATION)
    expect.soft(lastEvent?.reason).toBe("Ne relève pas des champs de compétences de mon OPCO")
  })

  it("refuse un motif vide sur not-my-opco", async () => {
    const { response, lastEvent } = await postReason("not-my-opco", "")
    expect.soft(response.statusCode).toBe(400)
    expect.soft(lastEvent?.status).toBe(AccessStatus.GRANTED)
  })
})
