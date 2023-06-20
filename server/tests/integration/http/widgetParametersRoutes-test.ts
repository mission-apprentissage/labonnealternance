import assert from "assert"
import { omit } from "lodash-es"
import httpTests from "../../utils/httpTests.js"
import { roles } from "../../../src/common/roles.js"
import { sampleParameter, sampleUpdateParameter } from "../../data/samples.js"
import { WidgetParameter } from "../../../src/common/model/index.js"
import { referrers } from "../../../src/common/model/constants/referrers.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  const sampleWidgetParameter = omit(sampleParameter, ["id_parcoursup"])

  it("Vérifie qu'on peut consulter la liste des parametres de widget en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    // Add parameter
    await components.widgetParameters.createParameter({
      etablissement_siret: sampleWidgetParameter.etablissement_siret,
      formation_intitule: sampleWidgetParameter.formation_intitule,
      formation_cfd: sampleWidgetParameter.formation_cfd,
      email_rdv: sampleWidgetParameter.email_rdv,
      referrers: sampleWidgetParameter.referrers,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/widget-parameters/parameters", { headers: bearerToken })

    // Check API response
    assert.deepStrictEqual(response.status, 200)
    assert.ok(response.data.parameters)
    assert.deepStrictEqual(response.data.parameters.length, 1)
    assert.ok(response.data.pagination)
  })

  it("Vérifie qu'on peut décompter les parametres de widget en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    // Add parameter
    await components.widgetParameters.createParameter({
      etablissement_siret: sampleWidgetParameter.etablissement_siret,
      formation_intitule: sampleWidgetParameter.formation_intitule,
      formation_cfd: sampleWidgetParameter.formation_cfd,
      email_rdv: sampleWidgetParameter.email_rdv,
      referrers: sampleWidgetParameter.referrers,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/widget-parameters/parameters/count", { headers: bearerToken })

    // Check API response
    assert.deepStrictEqual(response.status, 200)
    assert.deepStrictEqual(response.data, { total: 1 })
  })

  it("Vérifie qu'on peut importer une collection de paramètres via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.post(
      "/api/widget-parameters/import",
      {
        parameters: [
          {
            siret_formateur: sampleWidgetParameter.etablissement_siret,
            email: sampleWidgetParameter.email_rdv,
            referrers: [referrers.LBA.code],
          },
        ],
      },
      { headers: bearerToken }
    )

    // Check API Response
    assert.deepStrictEqual(response.status, 200)
    assert.deepStrictEqual(response.data.result[0].siret_formateur, sampleWidgetParameter.etablissement_siret)
    assert.deepStrictEqual(response.data.result[0].email, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(response.data.result[0].referrers, [referrers.LBA.code])
    assert.deepStrictEqual(response.data.result[0].formations[0].email_rdv, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(response.data.result[0].formations[0].referrers, [referrers.LBA.code])
  })

  it("Vérifie qu'on peut ajouter un parametre de widget en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.post("/api/widget-parameters/", sampleWidgetParameter, { headers: bearerToken })

    // Check API Response
    assert.deepStrictEqual(response.status, 200)
    assert.ok(response.data._id)
    assert.deepStrictEqual(response.data.etablissement_siret, sampleWidgetParameter.etablissement_siret)
    assert.deepStrictEqual(response.data.formation_intitule, sampleWidgetParameter.formation_intitule)
    assert.deepStrictEqual(response.data.formation_cfd, sampleWidgetParameter.formation_cfd)
    assert.deepStrictEqual(response.data.email_rdv, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(response.data.referrers.includes(referrers.LBA.code), true)

    // Check query db
    const found = await WidgetParameter.findById(response.data._id)
    assert.deepStrictEqual(found.etablissement_siret, sampleWidgetParameter.etablissement_siret)
    assert.deepStrictEqual(found.formation_intitule, sampleWidgetParameter.formation_intitule)
    assert.deepStrictEqual(found.formation_cfd, sampleWidgetParameter.formation_cfd)
    assert.deepStrictEqual(found.email_rdv, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(found.referrers.includes(referrers.LBA.code), true)
  })

  it("Vérifie qu'on peut récupérer un parametre de widget avec une requete en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    // Add parameter
    await components.widgetParameters.createParameter({
      etablissement_siret: sampleWidgetParameter.etablissement_siret,
      formation_intitule: sampleWidgetParameter.formation_intitule,
      formation_cfd: sampleWidgetParameter.formation_cfd,
      email_rdv: sampleWidgetParameter.email_rdv,
      referrers: sampleWidgetParameter.referrers,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/widget-parameters/", { headers: bearerToken }, { data: { etablissement_siret: sampleWidgetParameter.etablissement_siret } })

    // Check API Response
    assert.deepStrictEqual(response.status, 200)
    assert.ok(response.data._id)
    assert.deepStrictEqual(response.data.etablissement_siret, sampleWidgetParameter.etablissement_siret)
    assert.deepStrictEqual(response.data.formation_intitule, sampleWidgetParameter.formation_intitule)
    assert.deepStrictEqual(response.data.formation_cfd, sampleWidgetParameter.formation_cfd)
    assert.deepStrictEqual(response.data.email_rdv, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(response.data.referrers.includes(referrers.LBA.code), true)
  })

  it("Vérifie qu'on peut récupérer un parametre de widget par son id en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const addedResponse = await httpClient.post("/api/widget-parameters/", sampleWidgetParameter, {
      headers: bearerToken,
    })

    // Check API Response
    assert.deepStrictEqual(addedResponse.status, 200)
    assert.ok(addedResponse.data._id)
    assert.deepStrictEqual(addedResponse.data.etablissement_siret, sampleWidgetParameter.etablissement_siret)
    assert.deepStrictEqual(addedResponse.data.formation_intitule, sampleWidgetParameter.formation_intitule)
    assert.deepStrictEqual(addedResponse.data.formation_cfd, sampleWidgetParameter.formation_cfd)
    assert.deepStrictEqual(addedResponse.data.email_rdv, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(addedResponse.data.referrers.includes(referrers.LBA.code), true)

    // Check query db
    const getByIdResponse = await httpClient.get(`/api/widget-parameters/${addedResponse.data._id}`, {
      headers: bearerToken,
    })
    assert.deepStrictEqual(getByIdResponse.status, 200)
    assert.deepStrictEqual(getByIdResponse.data.etablissement_siret, sampleWidgetParameter.etablissement_siret)
    assert.deepStrictEqual(getByIdResponse.data.formation_intitule, sampleWidgetParameter.formation_intitule)
    assert.deepStrictEqual(getByIdResponse.data.formation_cfd, sampleWidgetParameter.formation_cfd)
    assert.deepStrictEqual(getByIdResponse.data.email_rdv, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(getByIdResponse.data.referrers.includes(referrers.LBA.code), true)
  })

  it("Vérifie qu'on peut mettre à jour un parametre de widget par son id en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const addedResponse = await httpClient.post("/api/widget-parameters/", sampleWidgetParameter, {
      headers: bearerToken,
    })

    // Check API Response
    assert.deepStrictEqual(addedResponse.status, 200)
    assert.ok(addedResponse.data._id)
    assert.deepStrictEqual(addedResponse.data.etablissement_siret, sampleWidgetParameter.etablissement_siret)
    assert.deepStrictEqual(addedResponse.data.formation_intitule, sampleWidgetParameter.formation_intitule)
    assert.deepStrictEqual(addedResponse.data.formation_cfd, sampleWidgetParameter.formation_cfd)
    assert.deepStrictEqual(addedResponse.data.email_rdv, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(addedResponse.data.referrers.includes(referrers.LBA.code), true)

    // Check query db
    const updateResponse = await httpClient.put(`/api/widget-parameters/${addedResponse.data._id}`, sampleUpdateParameter, {
      headers: bearerToken,
    })
    assert.deepStrictEqual(updateResponse.status, 200)
    assert.deepStrictEqual(updateResponse.data.etablissement_siret, sampleUpdateParameter.etablissement_siret)
    assert.deepStrictEqual(updateResponse.data.formation_intitule, sampleUpdateParameter.formation_intitule)
    assert.deepStrictEqual(updateResponse.data.formation_cfd, sampleUpdateParameter.formation_cfd)
    assert.deepStrictEqual(updateResponse.data.email_rdv, sampleUpdateParameter.email_rdv)
    assert.deepStrictEqual(updateResponse.data.referrers.includes(referrers.PARCOURSUP.code), true)
  })

  it("Vérifie qu'on peut supprimer un parametre de widget par son id en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const addedResponse = await httpClient.post("/api/widget-parameters/", sampleWidgetParameter, {
      headers: bearerToken,
    })

    // Check API Response
    assert.deepStrictEqual(addedResponse.status, 200)
    assert.ok(addedResponse.data._id)
    assert.deepStrictEqual(addedResponse.data.etablissement_siret, sampleWidgetParameter.etablissement_siret)
    assert.deepStrictEqual(addedResponse.data.formation_intitule, sampleWidgetParameter.formation_intitule)
    assert.deepStrictEqual(addedResponse.data.formation_cfd, sampleWidgetParameter.formation_cfd)
    assert.deepStrictEqual(addedResponse.data.email_rdv, sampleWidgetParameter.email_rdv)
    assert.deepStrictEqual(addedResponse.data.referrers.includes(referrers.LBA.code), true)

    // Check query db
    const deleteResponse = await httpClient.delete(`/api/widget-parameters/${addedResponse.data._id}`, {
      headers: bearerToken,
    })
    assert.deepStrictEqual(deleteResponse.status, 200)

    // Check deletion
    const found = await WidgetParameter.findById(addedResponse.data._id)
    assert.strictEqual(found, null)
  })

  it("Vérifie qu'on peut mettre à jours l'ensemble des referrers de toutes les formations", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    await components.widgetParameters.createParameter({
      etablissement_siret: sampleWidgetParameter.etablissement_siret,
      formation_intitule: sampleWidgetParameter.formation_intitule,
      formation_cfd: sampleWidgetParameter.formation_cfd,
      email_rdv: sampleWidgetParameter.email_rdv,
      referrers: sampleWidgetParameter.referrers,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const updateResponse = await httpClient.put("/api/widget-parameters/referrers", { referrers: [referrers.LBA.code, referrers.PARCOURSUP.code] }, { headers: bearerToken })

    // Check API Response
    assert.ok(updateResponse.data.ok)
    assert.deepStrictEqual(updateResponse.status, 200)
  })

  it("Vérifie qu'on ne peut pas mettre à jours l'ensemble des referrers de toutes les formations avec un referrer non existant", async () => {
    const { httpClient, createAndLogUser } = await startServer()

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const updateResponse = await httpClient.put("/api/widget-parameters/referrers", { referrers: [9999999] }, { headers: bearerToken })

    // Check API Response
    assert.deepStrictEqual(updateResponse.status, 500)
  })

  it("Vérifie qu'on peut exporter les paramètres en csv", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    await components.widgetParameters.createParameter({
      etablissement_siret: sampleWidgetParameter.etablissement_siret,
      formation_intitule: sampleWidgetParameter.formation_intitule,
      formation_cfd: sampleWidgetParameter.formation_cfd,
      email_rdv: sampleWidgetParameter.email_rdv,
      referrers: sampleWidgetParameter.referrers,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/widget-parameters/parameters/export", { headers: bearerToken })

    // Check API response
    assert.deepStrictEqual(response.status, 200)
  })
})
