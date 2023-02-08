import assert from "assert"
import integrationTests from "../../utils/integrationTests.js"
import widgetParameters from "../../../src/common/components/widgetParameters.js"
import { WidgetParameter } from "../../../src/common/model/index.js"
import { referrers } from "../../../src/common/model/constants/referrers.js"
import { sampleParameter, sampleUpdateParameter } from "../../data/samples.js"
import __filename from "../../../src/common/filename.js"

integrationTests(__filename(import.meta.url), () => {
  it("Permet de créer un paramètre de Widget", async () => {
    const { createParameter } = await widgetParameters()

    const created = await createParameter({
      etablissement_siret: sampleParameter.etablissement_siret,
      formation_intitule: sampleParameter.formation_intitule,
      formation_cfd: sampleParameter.formation_cfd,
      email_rdv: sampleParameter.email_rdv,
      referrers: sampleParameter.referrers,
    })

    // Check creation
    assert.deepStrictEqual(created.etablissement_siret, sampleParameter.etablissement_siret)
    assert.deepStrictEqual(created.formation_intitule, sampleParameter.formation_intitule)
    assert.deepStrictEqual(created.formation_cfd, sampleParameter.formation_cfd)
    assert.deepStrictEqual(created.email_rdv, sampleParameter.email_rdv)
    assert.deepStrictEqual(created.referrers.includes(referrers.LBA.code), true)

    // Check query db
    const found = await WidgetParameter.findById(created._id)
    assert.deepStrictEqual(found.etablissement_siret, sampleParameter.etablissement_siret)
    assert.deepStrictEqual(found.formation_intitule, sampleParameter.formation_intitule)
    assert.deepStrictEqual(found.formation_cfd, sampleParameter.formation_cfd)
    assert.deepStrictEqual(found.email_rdv, sampleParameter.email_rdv)
    assert.deepStrictEqual(found.referrers.includes(referrers.LBA.code), true)
  })

  it("Permet de supprimer un paramètres de Widget", async () => {
    const { createParameter, deleteParameter } = await widgetParameters()

    const created = await createParameter({
      etablissement_siret: sampleParameter.etablissement_siret,
      formation_intitule: sampleParameter.formation_intitule,
      formation_cfd: sampleParameter.formation_cfd,
      email_rdv: sampleParameter.email_rdv,
      referrers: sampleParameter.referrers,
    })

    // Check creation
    assert.deepStrictEqual(created.etablissement_siret, sampleParameter.etablissement_siret)
    assert.deepStrictEqual(created.formation_intitule, sampleParameter.formation_intitule)
    assert.deepStrictEqual(created.formation_cfd, sampleParameter.formation_cfd)
    assert.deepStrictEqual(created.email_rdv, sampleParameter.email_rdv)
    assert.deepStrictEqual(created.referrers.includes(referrers.LBA.code), true)

    await deleteParameter(created._id)

    // Check deletion
    const found = await WidgetParameter.findById(created._id)
    assert.strictEqual(found, null)
  })

  it("Permet de modifier un paramètre de Widget", async () => {
    const { createParameter, updateParameter } = await widgetParameters()

    const created = await createParameter({
      etablissement_siret: sampleParameter.etablissement_siret,
      formation_intitule: sampleParameter.formation_intitule,
      formation_cfd: sampleParameter.formation_cfd,
      email_rdv: sampleParameter.email_rdv,
      referrers: sampleParameter.referrers,
    })

    // Check creation
    assert.deepStrictEqual(created.etablissement_siret, sampleParameter.etablissement_siret)
    assert.deepStrictEqual(created.formation_intitule, sampleParameter.formation_intitule)
    assert.deepStrictEqual(created.formation_cfd, sampleParameter.formation_cfd)
    assert.deepStrictEqual(created.email_rdv, sampleParameter.email_rdv)
    assert.deepStrictEqual(created.referrers.includes(referrers.LBA.code), true)

    await updateParameter(created._id, sampleUpdateParameter)

    // Check update
    const found = await WidgetParameter.findById(created._id)
    assert.deepStrictEqual(found.etablissement_siret, sampleUpdateParameter.etablissement_siret)
    assert.deepStrictEqual(found.formation_intitule, sampleUpdateParameter.formation_intitule)
    assert.deepStrictEqual(found.formation_cfd, sampleUpdateParameter.formation_cfd)
    assert.deepStrictEqual(found.email_rdv, sampleUpdateParameter.email_rdv)
    assert.deepStrictEqual(found.referrers.includes(referrers.PARCOURSUP.code), true)
  })

  it("Permet de vérifier que le widget doit etre visible pour un paramètre valide", async () => {
    const { createParameter, isWidgetVisible } = await widgetParameters()

    const created = await createParameter({
      etablissement_siret: sampleParameter.etablissement_siret,
      formation_intitule: sampleParameter.formation_intitule,
      formation_cfd: sampleParameter.formation_cfd,
      email_rdv: sampleParameter.email_rdv,
      id_rco_formation: sampleParameter.id_rco_formation,
      referrers: sampleParameter.referrers,
    })

    // Check creation
    assert.deepStrictEqual(created.etablissement_siret, sampleParameter.etablissement_siret)
    assert.deepStrictEqual(created.formation_intitule, sampleParameter.formation_intitule)
    assert.deepStrictEqual(created.formation_cfd, sampleParameter.formation_cfd)
    assert.deepStrictEqual(created.email_rdv, sampleParameter.email_rdv)
    assert.deepStrictEqual(created.id_rco_formation, sampleParameter.id_rco_formation)
    assert.deepStrictEqual(created.referrers.includes(referrers.LBA.code), true)

    // Check update
    const isVisible = await isWidgetVisible({
      idRcoFormation: sampleParameter.id_rco_formation,
      referrer: referrers.LBA.code,
    })
    assert.deepStrictEqual(isVisible, true)
  })

  it("Permet de vérifier que le widget ne doit pas etre visible pour de mauvais paramètres", async () => {
    const { createParameter, isWidgetVisible } = await widgetParameters()

    const created = await createParameter({
      etablissement_siret: sampleParameter.etablissement_siret,
      formation_intitule: sampleParameter.formation_intitule,
      formation_cfd: sampleParameter.formation_cfd,
      email_rdv: sampleParameter.email_rdv,
      id_rco_formation: sampleParameter.id_rco_formation,
      referrers: sampleParameter.referrers,
    })

    // Check creation
    assert.deepStrictEqual(created.etablissement_siret, sampleParameter.etablissement_siret)
    assert.deepStrictEqual(created.formation_intitule, sampleParameter.formation_intitule)
    assert.deepStrictEqual(created.formation_cfd, sampleParameter.formation_cfd)
    assert.deepStrictEqual(created.email_rdv, sampleParameter.email_rdv)
    assert.deepStrictEqual(created.id_rco_formation, sampleParameter.id_rco_formation)
    assert.deepStrictEqual(created.referrers.includes(referrers.LBA.code), true)

    // Check if widget is visible
    const isNotVisibleForBadReferrer = await isWidgetVisible({
      id_rco_formation: sampleParameter.id_rco_formation,
      referrer: "KO",
    })

    const isNotVisibleForBadRcoId = await isWidgetVisible({
      id_rco_formation: `${sampleParameter.id_rco_formation}00`,
      referrer: sampleParameter.referrers[0],
    })

    assert.deepStrictEqual(isNotVisibleForBadReferrer, false)
    assert.deepStrictEqual(isNotVisibleForBadRcoId, false)
  })
})
