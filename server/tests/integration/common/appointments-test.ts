import assert from "assert"
import integrationTests from "../../utils/integrationTests.js"
import appointments from "../../../src/common/components/appointments.js"
import users from "../../../src/common/components/users.js"
import { Appointment } from "../../../src/common/model/index.js"
import { roles } from "../../../src/common/roles.js"
import __filename from "../../../src/common/filename.js"

integrationTests(__filename(import.meta.url), () => {
  it("Permet de créer un appointment", async () => {
    const { createAppointment } = await appointments()
    const { createUser } = await users()

    const createdCandidat = await createUser("userCandidat", "password", { role: roles.candidat })

    const created = await createAppointment({
      candidat_id: createdCandidat._id,
      motivations: "Test Motivation",
      etablissement_id: "0751475W",
      formation_id: "45025516",
      referrer: "TEST",
    })
    assert.strictEqual(created.motivations, "Test Motivation")
    assert.strictEqual(created.etablissement_id, "0751475W")
    assert.strictEqual(created.formation_id, "45025516")
    assert.strictEqual(created.referrer, "TEST")

    const foundAppointment = await Appointment.findOne({
      etablissement_id: "0751475W",
      formation_id: "45025516",
      referrer: "TEST",
    })
    assert.notStrictEqual(foundAppointment, null)
  })

  it("Permet de récupérer un appointment", async () => {
    const { createAppointment, getAppointmentById } = await appointments()
    const { createUser } = await users()

    const createdCandidat = await createUser("userCandidat", "password", { role: roles.candidat })
    const created = await createAppointment({
      candidatId: createdCandidat._id,
      motivations: "Test Motivation",
      etablissement_id: "0751475W",
      formation_id: "45025516",
      referrer: "TEST",
    })

    const found = await getAppointmentById(created._id)
    assert.strictEqual(found.motivations, "Test Motivation")
    assert.strictEqual(found.etablissement_id, "0751475W")
    assert.strictEqual(found.formation_id, "45025516")
    assert.strictEqual(found.referrer, "TEST")
  })

  it("Permet de mettre à jour un appointment", async () => {
    const { createAppointment, updateAppointment } = await appointments()
    const { createUser } = await users()

    const createdCandidat = await createUser("userCandidat", "password", { role: roles.candidat })
    const created = await createAppointment({
      candidatId: createdCandidat._id,
      motivations: "Test Motivation",
      etablissement_id: "0751475W",
      formation_id: "45025516",
      referrer: "TEST",
    })

    const updated = await updateAppointment(created._id, {
      candidatId: createdCandidat._id,
      motivations: "Updated",
      etablissement_id: "Updated",
      formation_id: "Updated",
      referrer: "Updated",
    })
    assert.strictEqual(updated.motivations, "Updated")
    assert.strictEqual(updated.etablissement_id, "Updated")
    assert.strictEqual(updated.formation_id, "Updated")
    assert.strictEqual(updated.referrer, "Updated")
  })
})
