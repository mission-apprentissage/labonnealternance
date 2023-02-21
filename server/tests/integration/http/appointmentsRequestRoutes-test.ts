import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import widgetParameters from "../../../src/common/components/widgetParameters.js"
import { sampleParameter } from "../../data/samples.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie qu'on peut récupérer les infos de context via idRcoFormation and cleMinistereEducatif", async () => {
    const { createParameter } = widgetParameters()

    await createParameter(sampleParameter)

    const { httpClient } = await startServer()

    const { status, data } = await httpClient.post(`/api/appointment-request/context/create`, {
      idRcoFormation: sampleParameter.id_rco_formation,
      idCleMinistereEducatif: sampleParameter.cle_ministere_educatif,
      referrer: "lba",
    })

    assert.strictEqual(status, 200)
    assert.deepStrictEqual(data, {
      cfd: "26033206",
      code_postal: "75000",
      etablissement_formateur_entreprise_raison_sociale: "TEST RAISON SOCIALE",
      etablissement_formateur_siret: "32922456200234",
      form_url: "http://localhost/form?referrer=lba&cleMinistereEducatif=064256P01111968000310005219680003100052-68287%23L01",
      id_rco_formation: "14_AF_0000091719|14_SE_0000494236|18894",
      cle_ministere_educatif: "064256P01111968000310005219680003100052-68287#L01",
      intitule_long: "Test Formation",
      lieu_formation_adresse: null,
      localite: null,
    })
  })

  it("Vérifie qu'on peut récupérer les infos de context via idRcoFormation", async () => {
    const { createParameter } = widgetParameters()

    await createParameter(sampleParameter)
    const { httpClient } = await startServer()

    const { status, data } = await httpClient.post(`/api/appointment-request/context/create`, {
      idRcoFormation: sampleParameter.id_rco_formation,
      referrer: "lba",
    })

    assert.strictEqual(status, 200)
    assert.deepStrictEqual(data, {
      cfd: "26033206",
      code_postal: "75000",
      etablissement_formateur_entreprise_raison_sociale: "TEST RAISON SOCIALE",
      etablissement_formateur_siret: "32922456200234",
      form_url: "http://localhost/form?referrer=lba&cleMinistereEducatif=064256P01111968000310005219680003100052-68287%23L01",
      id_rco_formation: "14_AF_0000091719|14_SE_0000494236|18894",
      cle_ministere_educatif: "064256P01111968000310005219680003100052-68287#L01",
      intitule_long: "Test Formation",
      lieu_formation_adresse: null,
      localite: null,
    })
  })

  it("Vérifie qu'on peut récupérer les infos de context via idCleMinistereEducatif", async () => {
    const { createParameter } = widgetParameters()

    await createParameter(sampleParameter)
    const { httpClient } = await startServer()

    const { status, data } = await httpClient.post(`/api/appointment-request/context/create`, {
      idCleMinistereEducatif: sampleParameter.cle_ministere_educatif,
      referrer: "lba",
    })

    assert.strictEqual(status, 200)
    assert.deepStrictEqual(data, {
      cfd: "26033206",
      code_postal: "75000",
      etablissement_formateur_entreprise_raison_sociale: "TEST RAISON SOCIALE",
      etablissement_formateur_siret: "32922456200234",
      form_url: "http://localhost/form?referrer=lba&cleMinistereEducatif=064256P01111968000310005219680003100052-68287%23L01",
      id_rco_formation: "14_AF_0000091719|14_SE_0000494236|18894",
      cle_ministere_educatif: "064256P01111968000310005219680003100052-68287#L01",
      intitule_long: "Test Formation",
      lieu_formation_adresse: null,
      localite: null,
    })
  })

  it("Vérifie qu'on peut récupérer les infos de context via idParcoursup", async () => {
    const { createParameter } = widgetParameters()

    await createParameter(sampleParameter)
    const { httpClient } = await startServer()

    const response = await httpClient.post(`/api/appointment-request/context/create`, {
      idParcoursup: sampleParameter.id_parcoursup,
      referrer: "parcoursup",
    })

    assert.strictEqual(response.status, 200)
    assert.ok(response.data.etablissement_formateur_entreprise_raison_sociale)
    assert.ok(response.data.intitule_long)
    assert.strictEqual(response.data.lieu_formation_adresse, null)
    assert.ok(response.data.code_postal)
    assert.ok(response.data.etablissement_formateur_siret)
    assert.ok(response.data.cfd)
    assert.ok(response.data.id_rco_formation)
    assert.ok(response.data.cle_ministere_educatif)
    assert.ok(response.data.form_url)
  })

  it("Vérifie que le context n'est pas retourné si la prise de rendez-vous n'est pas activée (idRcoFormation)", async () => {
    const { httpClient } = await startServer()

    const { status, data } = await httpClient.post(`/api/appointment-request/context/create`, {
      idRcoFormation: "KO",
      referrer: "lba",
    })

    assert.strictEqual(status, 404)
    assert.deepStrictEqual(data, {
      statusCode: 404,
      error: "Not Found",
      message: "Formation introuvable.",
    })
  })

  it("Vérifie que le context n'est pas retourné si la prise de rendez-vous n'est pas activée (idParcoursup)", async () => {
    const { httpClient } = await startServer()

    const { status, data } = await httpClient.post(`/api/appointment-request/context/create`, {
      idParcoursup: "KO",
      referrer: "parcoursup",
    })

    assert.strictEqual(status, 404)
    assert.deepStrictEqual(data, {
      statusCode: 404,
      error: "Not Found",
      message: "Formation introuvable.",
    })
  })

  it("Vérifie que le context n'est pas retourné si la prise de rendez-vous n'est pas activée (idParcoursup)", async () => {
    const { httpClient } = await startServer()

    const { status, data } = await httpClient.post(`/api/appointment-request/context/create`, {
      idActionFormation: "KO",
      referrer: "onisep",
    })

    assert.strictEqual(status, 404)
    assert.deepStrictEqual(data, {
      statusCode: 404,
      error: "Not Found",
      message: "Formation introuvable.",
    })
  })
})
