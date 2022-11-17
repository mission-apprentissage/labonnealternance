import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import { sampleAppointment, sampleUpdateAppointment } from "../../data/samples.js"
import { Appointment } from "../../../src/common/model/index.js"
import { roles } from "../../../src/common/roles.js"
import { referrers } from "../../../src/common/model/constants/referrers.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie qu'on peut consulter la liste des rdvs en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    // Add item
    await components.appointments.createAppointment({
      candidat_id: sampleAppointment.candidat_id,
      etablissement_id: sampleAppointment.etablissement_id,
      formation_id: sampleAppointment.formation_id,
      motivations: sampleAppointment.motivations,
      referrer: sampleAppointment.referrer,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/appointment/appointments", { headers: bearerToken })

    // Check API response
    assert.deepStrictEqual(response.status, 200)
    assert.ok(response.data.appointments)
    assert.deepStrictEqual(response.data.appointments.length, 1)
    assert.ok(response.data.pagination)
  })

  it("Vérifie qu'on peut consulter la liste en détail des rdvs en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    const candidat = await components.users.createUser("Marc", "N/A", {
      firstname: "firstname",
      lastname: "password",
      phone: "",
      email: "test@gmail.com",
      role: roles.candidat,
    })

    // Add item
    await components.appointments.createAppointment({
      id_rco_formation: sampleAppointment.id_rco_formation,
      candidat_id: candidat._id,
      etablissement_id: sampleAppointment.etablissement_id,
      formation_id: sampleAppointment.formation_id,
      motivations: sampleAppointment.motivations,
      referrer: referrers.LBA.code,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/appointment/appointments/details", { headers: bearerToken })

    // Check API response
    assert.deepStrictEqual(response.status, 200)
    assert.ok(response.data.appointments)
    assert.ok(response.data.pagination)
  })

  it("Vérifie qu'on peut décompter les rdvs en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    // Add item
    await components.appointments.createAppointment({
      candidat_id: sampleAppointment.candidat_id,
      etablissement_id: sampleAppointment.etablissement_id,
      formation_id: sampleAppointment.formation_id,
      motivations: sampleAppointment.motivations,
      referrer: sampleAppointment.referrer,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/appointment/appointments/count", { headers: bearerToken })

    // Check API response
    assert.deepStrictEqual(response.status, 200)
    assert.deepStrictEqual(response.data, { total: 1 })
  })

  it("Vérifie qu'on peut ajouter un rdv en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.post("/api/appointment/", sampleAppointment, { headers: bearerToken })

    // Check API Response
    assert.deepStrictEqual(response.status, 200)
    assert.ok(response.data._id)
    assert.deepStrictEqual(response.data.candidat_id, sampleAppointment.candidat_id)
    assert.deepStrictEqual(response.data.etablissement_id, sampleAppointment.etablissement_id)
    assert.deepStrictEqual(response.data.formation_id, sampleAppointment.formation_id)
    assert.deepStrictEqual(response.data.motivations, sampleAppointment.motivations)
    assert.deepStrictEqual(response.data.referrer, sampleAppointment.referrer)

    // Check query db
    const found = await Appointment.findById(response.data._id)
    assert.deepStrictEqual(found.candidat_id, sampleAppointment.candidat_id)
    assert.deepStrictEqual(found.etablissement_id, sampleAppointment.etablissement_id)
    assert.deepStrictEqual(found.formation_id, sampleAppointment.formation_id)
    assert.deepStrictEqual(found.motivations, sampleAppointment.motivations)
    assert.deepStrictEqual(found.referrer, sampleAppointment.referrer)
  })

  it("Vérifie qu'on peut récupérer un rdv avec une requete en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    // Add item
    await components.appointments.createAppointment({
      candidat_id: sampleAppointment.candidat_id,
      etablissement_id: sampleAppointment.etablissement_id,
      formation_id: sampleAppointment.formation_id,
      motivations: sampleAppointment.motivations,
      referrer: sampleAppointment.referrer,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/appointment/", { headers: bearerToken }, { data: { etablissement_id: sampleAppointment.etablissement_id } })

    // Check API Response
    assert.deepStrictEqual(response.status, 200)
    assert.ok(response.data._id)
    assert.deepStrictEqual(response.data.candidat_id, sampleAppointment.candidat_id)
    assert.deepStrictEqual(response.data.etablissement_id, sampleAppointment.etablissement_id)
    assert.deepStrictEqual(response.data.formation_id, sampleAppointment.formation_id)
    assert.deepStrictEqual(response.data.motivations, sampleAppointment.motivations)
    assert.deepStrictEqual(response.data.referrer, sampleAppointment.referrer)
  })

  it("Vérifie qu'on peut récupérer un rdv par son id en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const addedResponse = await httpClient.post("/api/appointment/", sampleAppointment, { headers: bearerToken })

    // Check API Response
    assert.deepStrictEqual(addedResponse.status, 200)
    assert.ok(addedResponse.data._id)
    assert.deepStrictEqual(addedResponse.data.candidat_id, sampleAppointment.candidat_id)
    assert.deepStrictEqual(addedResponse.data.etablissement_id, sampleAppointment.etablissement_id)
    assert.deepStrictEqual(addedResponse.data.formation_id, sampleAppointment.formation_id)
    assert.deepStrictEqual(addedResponse.data.motivations, sampleAppointment.motivations)
    assert.deepStrictEqual(addedResponse.data.referrer, sampleAppointment.referrer)

    // Check query db
    const getByIdResponse = await httpClient.get(`/api/appointment/${addedResponse.data._id}`, {
      headers: bearerToken,
    })
    assert.deepStrictEqual(getByIdResponse.status, 200)
    assert.deepStrictEqual(getByIdResponse.data.candidat_id, sampleAppointment.candidat_id)
    assert.deepStrictEqual(getByIdResponse.data.etablissement_id, sampleAppointment.etablissement_id)
    assert.deepStrictEqual(getByIdResponse.data.formation_id, sampleAppointment.formation_id)
    assert.deepStrictEqual(getByIdResponse.data.motivations, sampleAppointment.motivations)
    assert.deepStrictEqual(getByIdResponse.data.referrer, sampleAppointment.referrer)
  })

  it("Vérifie qu'on peut mettre à jour un rdv  par son id en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const addedResponse = await httpClient.post("/api/appointment/", sampleAppointment, { headers: bearerToken })

    // Check API Response
    assert.deepStrictEqual(addedResponse.status, 200)
    assert.ok(addedResponse.data._id)
    assert.deepStrictEqual(addedResponse.data.candidat_id, sampleAppointment.candidat_id)
    assert.deepStrictEqual(addedResponse.data.etablissement_id, sampleAppointment.etablissement_id)
    assert.deepStrictEqual(addedResponse.data.formation_id, sampleAppointment.formation_id)
    assert.deepStrictEqual(addedResponse.data.motivations, sampleAppointment.motivations)
    assert.deepStrictEqual(addedResponse.data.referrer, sampleAppointment.referrer)

    // Check query db
    const updateResponse = await httpClient.put(`/api/appointment/${addedResponse.data._id}`, sampleUpdateAppointment, {
      headers: bearerToken,
    })
    assert.deepStrictEqual(updateResponse.status, 200)
    assert.deepStrictEqual(updateResponse.data.candidat_id, sampleUpdateAppointment.candidat_id)
    assert.deepStrictEqual(updateResponse.data.etablissement_id, sampleUpdateAppointment.etablissement_id)
    assert.deepStrictEqual(updateResponse.data.formation_id, sampleUpdateAppointment.formation_id)
    assert.deepStrictEqual(updateResponse.data.motivations, sampleUpdateAppointment.motivations)
    assert.deepStrictEqual(updateResponse.data.referrer, sampleUpdateAppointment.referrer)
  })

  it("Vérifie qu'on peut supprimer un parametre de widget par son id en tant qu'admin via la Route", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const addedResponse = await httpClient.post("/api/appointment/", sampleAppointment, { headers: bearerToken })

    // Check API Response
    assert.deepStrictEqual(addedResponse.status, 200)
    assert.ok(addedResponse.data._id)
    assert.deepStrictEqual(addedResponse.data.candidat_id, sampleAppointment.candidat_id)
    assert.deepStrictEqual(addedResponse.data.etablissement_id, sampleAppointment.etablissement_id)
    assert.deepStrictEqual(addedResponse.data.formation_id, sampleAppointment.formation_id)
    assert.deepStrictEqual(addedResponse.data.motivations, sampleAppointment.motivations)
    assert.deepStrictEqual(addedResponse.data.referrer, sampleAppointment.referrer)

    // Check query db
    const deleteResponse = await httpClient.delete(`/api/appointment/${addedResponse.data._id}`, {
      headers: bearerToken,
    })
    assert.deepStrictEqual(deleteResponse.status, 200)

    // Check deletion
    const found = await Appointment.findById(addedResponse.data._id)
    assert.strictEqual(found, null)
  })

  it("Vérifie qu'on peut exporter les rendez-vous en csv", async () => {
    const { httpClient, createAndLogUser, components } = await startServer()

    const candidat = await components.users.createUser("Jean", "N/A", {
      firstname: "firstname",
      lastname: "password",
      phone: "",
      email: "test@gmail.com",
      role: roles.candidat,
    })

    await components.appointments.createAppointment({
      id_rco_formation: sampleAppointment.id_rco_formation,
      candidat_id: candidat._id,
      etablissement_id: sampleAppointment.etablissement_id,
      formation_id: sampleAppointment.formation_id,
      motivations: sampleAppointment.motivations,
      referrer: referrers.LBA.code,
    })

    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })
    const response = await httpClient.get("/api/appointment/appointments/details/export", { headers: bearerToken })

    // Check API response
    assert.deepStrictEqual(response.status, 200)
  })
})
