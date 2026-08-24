import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { createAndLogUser, logUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { saveAdminUserTest, saveEntrepriseUserTest, saveOpcoUserTest, validatedUserStatus } from "@tests/utils/user.test.utils"
import { OPCOS_LABEL } from "shared/constants/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
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
    const entrepriseUser = await saveEntrepriseUserTest({ email: "compteentreprise1@mail.com", status: validatedUserStatus }, {}, { siret: "89557430766546" })
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
    const entrepriseUser = await saveEntrepriseUserTest({ email: "compteentreprise2@mail.com", status: validatedUserStatus }, {}, { siret: "10392947668876" })
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
    const entrepriseUser = await saveEntrepriseUserTest({ email: "compteentreprise3@mail.com", status: validatedUserStatus }, {}, { siret: "77298992300012" })
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
