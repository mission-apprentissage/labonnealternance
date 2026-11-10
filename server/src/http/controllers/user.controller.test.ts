import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { createAndLogUser, logUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import {
  entrepriseStatusEventFactory,
  roleManagementEventFactory,
  saveAdminUserTest,
  saveCfa,
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
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"

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

describe("GET /admin/users-recruteurs", () => {
  useMongo()
  const httpClient = useServer()

  it("n'indique des offres publiées que pour un recruteur qui a une offre en ligne", async () => {
    const sansOffrePubliee = await saveEntrepriseUserTest({}, {}, { siret: "90000000000001", raison_sociale: "Boulangerie recette sans publication" })
    const avecOffrePubliee = await saveEntrepriseUserTest({}, {}, { siret: "90000000000019", raison_sociale: "Boulangerie recette avec publication" })
    // En attente du compte, en modération ou refusée : aucune n'est en ligne.
    for (const offer_status of [JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.EN_MODERATION, JOB_STATUS_ENGLISH.ANNULEE]) {
      await createJobPartner({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: sansOffrePubliee.user._id, offer_status })
    }
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: avecOffrePubliee.user._id, offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: avecOffrePubliee.user._id, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    const { bearerToken } = await createAndLogUser(httpClient, "admin-recruteurs", { type: "ADMIN" })

    const response = await httpClient().inject({ method: "GET", path: "/api/admin/users-recruteurs?search=Boulangerie%20recette", headers: bearerToken })

    expect(response.statusCode).toBe(200)
    const hasJobsBySociete = Object.fromEntries(response.json().map(({ establishment_raison_sociale, hasJobs }) => [establishment_raison_sociale, hasJobs]))
    expect(hasJobsBySociete).toEqual({ "Boulangerie recette sans publication": false, "Boulangerie recette avec publication": true })
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
