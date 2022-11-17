import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import { sampleAppointment } from "../../data/samples.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie qu'on peut prendre en compte des notifications via webhook pour le premier email cfa", async () => {
    const { httpClient, components } = await startServer()
    const messageId = "60ae479632bd2611ce1bfd54@domain.com"
    const emailStatus = "delivered"

    const appointment = await components.appointments.createAppointment({
      candidat_id: sampleAppointment.candidat_id,
      etablissement_id: sampleAppointment.etablissement_id,
      formation_id: sampleAppointment.formation_id,
      motivations: sampleAppointment.motivations,
      referrer: sampleAppointment.referrer,
    })

    await components.appointments.updateAppointment(appointment._id, {
      email_premiere_demande_candidat_message_id: messageId,
    })

    const response = await httpClient.post(`/api/emails/webhook?apikey=1234`, {
      event: emailStatus,
      "message-id": messageId,
      id: 385857,
      date: "2021-05-26 17:19:32",
      ts: 1622042372,
      email: "test@apprentissage.beta.gouv.fr",
      ts_event: 1622042372,
    })

    const appointmentUpdated = await components.appointments.getAppointmentById(appointment._id)

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.data, {})
    assert.strictEqual(appointmentUpdated.email_premiere_demande_candidat_statut, emailStatus)
  })

  it("Vérifie qu'on peut prendre en compte des notifications via webhook pour le premier email candidat", async () => {
    const { httpClient, components } = await startServer()
    const messageId = "60ae479632bd2611ce1bfd55@domain.com"
    const emailStatus = "delivered"

    const appointment = await components.appointments.createAppointment({
      candidat_id: sampleAppointment.candidat_id,
      etablissement_id: sampleAppointment.etablissement_id,
      formation_id: sampleAppointment.formation_id,
      motivations: sampleAppointment.motivations,
      referrer: sampleAppointment.referrer,
    })

    await components.appointments.updateAppointment(appointment._id, {
      email_premiere_demande_cfa_message_id: messageId,
    })

    const response = await httpClient.post(`/api/emails/webhook?apikey=1234`, {
      event: emailStatus,
      "message-id": messageId,
      id: 385857,
      date: "2021-05-26 17:19:32",
      ts: 1622042372,
      email: "test@apprentissage.beta.gouv.fr",
      ts_event: 1622042372,
    })

    const appointmentUpdated = await components.appointments.getAppointmentById(appointment._id)

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.data, {})
    assert.strictEqual(appointmentUpdated.email_premiere_demande_cfa_statut, emailStatus)
  })

  it("Vérifie qu'on ne peut pas recevoir des notifications sans webhook key", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.post(`/api/emails/webhook`, {})

    assert.strictEqual(response.status, 401)
    assert.deepStrictEqual(response.data, {
      error: "Unauthorized",
      message: "Unauthorized",
      statusCode: 401,
    })
  })
})
