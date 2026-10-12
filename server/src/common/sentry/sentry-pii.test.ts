// Premier import : Sentry doit être initialisé avant le chargement de mongodb (cf. sentry-capture.test.utils).
import "@tests/utils/sentry-capture.test.utils"

import assert from "node:assert"
import * as Sentry from "@sentry/node"
import { getConnectedInfos } from "@tests/fixture/connectedUser.fixture"
import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { findSentryLeaks, sentEvents, sentryEnvelopes } from "@tests/utils/sentry-capture.test.utils"
import { createCredentialTest, entrepriseStatusEventFactory, saveEntrepriseUserTest, validatedUserStatus } from "@tests/utils/user.test.utils"
import axios from "axios"
import { MongoBulkWriteError, MongoServerError, ObjectId } from "mongodb"
import nock from "nock"
import { JobCollectionName, zRoutes } from "shared"
import { ENTREPRISE, OPCOS_LABEL } from "shared/constants/index"
import { applicationTestFile } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { s3WriteString } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import type { Server } from "@/http/server"
import { bindFastifyServer } from "@/http/server"
import { createAccessLog } from "@/security/access-log.service"
import { generateAccessToken, generateScope } from "@/security/access-token.service"
import { getRecipientID } from "@/services/jobs/job-opportunity/job-opportunity.service"
import mailer from "@/services/mailer.service"

vi.mock("@/common/utils/aws-utils", () => ({ s3WriteString: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/security/access-log.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/security/access-log.service")>()
  return { ...actual, createAccessLog: vi.fn(actual.createAccessLog) }
})
vi.mock("@/services/mailer.service", () => ({
  default: {
    sendEmail: vi.fn().mockResolvedValue({ messageId: "id", accepted: [] }),
    renderEmail: vi.fn().mockResolvedValue("<html></html>"),
  },
}))

const applicant = {
  email: "candidat.fictif@exemple.fr",
  firstName: "Prenomcandidat",
  lastName: "Nomcandidat",
  phone: "0639981234",
  message: "Message de motivation fictif",
}
const partner = { email: "partenaire.fictif@exemple.fr", organisation: "Partenaire fictif" }
const newRecruiter = { email: "nouveau.recruteur@exemple.fr", firstName: "Prenomrecruteur", lastName: "Nomrecruteur", phone: "0639982345", siret: "98765432400001" }
const connectedRecruiter = { email: "recruteur.connecte@exemple.fr", firstName: "Prenomconnecte", lastName: "Nomconnecte", phone: "0639983456" }
const outgoingApiToken = "JETON-FICTIF"
const apiAccount = { email: "compte.api@exemple.fr", apiKey: "CLE-API-FICTIVE" }
const magicLinkUser = { email: "lien.magique@exemple.fr", firstName: "Prenommagique", lastName: "Nommagique" }

// Le SIRET n'en fait pas partie : il est gardé pour le diagnostic des appels à API Entreprise.
const personalData: Record<string, string> = {
  "applicant.email": applicant.email,
  "applicant.firstName": applicant.firstName,
  "applicant.lastName": applicant.lastName,
  "applicant.phone": applicant.phone,
  "applicant.message": applicant.message,
  "applicant.cv": applicationTestFile.slice(400, 460),
  "partner.email": partner.email,
  "newRecruiter.email": newRecruiter.email,
  "newRecruiter.firstName": newRecruiter.firstName,
  "newRecruiter.lastName": newRecruiter.lastName,
  "newRecruiter.phone": newRecruiter.phone,
  "connectedRecruiter.email": connectedRecruiter.email,
  "connectedRecruiter.firstName": connectedRecruiter.firstName,
  "connectedRecruiter.lastName": connectedRecruiter.lastName,
  "connectedRecruiter.phone": connectedRecruiter.phone,
  "magicLinkUser.email": magicLinkUser.email,
  "apiAccount.email": apiAccount.email,
}

const job = generateJobsPartnersOfferPrivate({ apply_email: "offre.fictive@exemple.fr" })

const applicationBody = () =>
  JSON.stringify({
    applicant_attachment_name: "cv.pdf",
    applicant_attachment_content: applicationTestFile,
    applicant_email: applicant.email,
    applicant_first_name: applicant.firstName,
    applicant_last_name: applicant.lastName,
    applicant_phone: applicant.phone,
    applicant_message: applicant.message,
    recipient_id: getRecipientID(JobCollectionName.partners, job._id.toString()),
  })

describe("Sentry : aucune donnée personnelle envoyée", () => {
  useMongo()
  let app: Server
  let baseUrl: string

  beforeAll(async () => {
    nock.disableNetConnect()
    nock.enableNetConnect("127.0.0.1")
    app = await bindFastifyServer()
    baseUrl = await app.listen({ port: 0, host: "127.0.0.1" })
  }, 20_000)

  beforeEach(async () => {
    await getDbCollection("jobs_partners").insertOne(job)
    nock.cleanAll()
    await Sentry.flush(2_000)
    sentryEnvelopes.length = 0
    return () => {
      vi.mocked(mailer.sendEmail).mockReset()
    }
  })

  afterAll(async () => {
    nock.enableNetConnect()
    await app.close()
    await Sentry.close(2_000)
  })

  const send = async (path: string, init: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, init)
    const body = await response.text()
    // La transaction se termine après la réponse : une fois envoyée, tous les envois de la requête sont partis.
    await vi.waitFor(() => assert.ok(sentEvents("transaction").length > 0, `aucune transaction capturée (${response.status} ${body})`))
    await Sentry.flush(2_000)
    return response
  }

  const assertNoPersonalDataSent = async (secrets: Record<string, string> = {}) => {
    await vi.waitFor(() => assert.ok(sentEvents("event").length > 0, "aucun événement Sentry capturé"))
    await Sentry.flush(2_000)
    expect(findSentryLeaks({ ...personalData, ...secrets })).toEqual([])
  }

  it("candidature : ni le corps, ni le CV, ni le jeton du partenaire", async () => {
    vi.mocked(s3WriteString).mockRejectedValueOnce(new Error("S3 indisponible"))
    const token = await getApiApprentissageTestingToken({
      email: partner.email,
      organisation: partner.organisation,
      habilitations: { "applications:write": true, "appointments:write": false, "jobs:write": false },
    })

    const response = await send("/api/v2/application", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: applicationBody(),
    })

    expect(s3WriteString, `statut ${response.status}`).toHaveBeenCalledOnce()
    await assertNoPersonalDataSent({ partnerToken: token })
    // Spans MongoDB présents : leur `db.statement` est bien couvert par le contrôle.
    expect(
      sentEvents("transaction")
        .flatMap((transaction) => transaction.spans ?? [])
        .some((span) => span.op === "db")
    ).toBe(true)
    const event = sentEvents("event").find((sent) => sent.exception?.values?.[0]?.value === "S3 indisponible")
    expect(event?.user).toEqual({ segment: "api-apprentissage", organisation: partner.organisation, ip_address: "127.0.0.1" })
    expect(event?.extra?.body_keys).toEqual(expect.arrayContaining(["applicant_email", "applicant_attachment_content", "recipient_id"]))
    expect(event?.tags?.reqId).toEqual(expect.any(String))
    expect(event?.request?.url).toBe(`${baseUrl}/api/v2/application`)
  })

  it("candidature avec un jeton d'accès sans compte : l'utilisateur est identifié par le type de jeton, sans e-mail", async () => {
    vi.mocked(s3WriteString).mockRejectedValueOnce(new Error("S3 indisponible"))
    // Identité sans `_id` : seul son e-mail pourrait servir d'identifiant.
    const token = generateAccessToken({ type: "candidat", email: applicant.email }, [
      generateScope({ schema: zRoutes.post["/v2/_private/application"], options: { params: undefined, querystring: undefined } }),
    ])

    const response = await send("/api/v2/_private/application", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: applicationBody(),
    })

    expect(s3WriteString, `statut ${response.status}`).toHaveBeenCalledOnce()
    await assertNoPersonalDataSent({ accessToken: token })
    const event = sentEvents("event").find((sent) => sent.exception?.values?.[0]?.value === "S3 indisponible")
    expect(event?.user).toEqual({ segment: "access-token", identity: "candidat", ip_address: "127.0.0.1" })
  })

  it("clé d'API : une erreur entre l'authentification et le handler porte déjà l'utilisateur, sans e-mail", async () => {
    const credential = await createCredentialTest({ email: apiAccount.email, api_key: apiAccount.apiKey, actif: true })
    vi.mocked(createAccessLog).mockRejectedValueOnce(new Error("base indisponible"))

    await send("/api/v3/jobs/multi-partner", { method: "POST", headers: { "content-type": "application/json", authorization: apiAccount.apiKey }, body: "{}" })

    await assertNoPersonalDataSent({ apiKey: apiAccount.apiKey })
    const event = sentEvents("event").find((sent) => sent.exception?.values?.[0]?.value === "base indisponible")
    expect(event?.user).toEqual({ segment: "api-key", id: credential._id.toString(), ip_address: "127.0.0.1" })
  })

  it("query entrante : les valeurs des paramètres déclarés par la route restent, les autres sont masquées", async () => {
    await send(`/api/_private/geo/commune/reverse?latitude=48.85&longitude=2.35&email=${encodeURIComponent(applicant.email)}`, { method: "GET" })

    await assertNoPersonalDataSent()
    const event = sentEvents("event").find((sent) => sent.exception?.values?.[0]?.value === "No commune found for this point")
    expect(event?.extra?.query).toEqual({ latitude: "48.85", longitude: "2.35", email: "[Filtered]" })
    expect(event?.request?.url).toBe(`${baseUrl}/api/_private/geo/commune/reverse`)
  })

  it("création de compte : ni le corps ni les captures explicites, le SIRET des appels à API Entreprise reste", async () => {
    nock("https://entreprise.api.gouv.fr")
      .persist()
      .get(/.*/)
      .reply(500, { errors: [{ detail: "indisponible" }] })
    nock("https://bal.apprentissage.beta.gouv.fr").persist().post(/.*/).reply(200, { is_valid: false })
    nock("https://data.geopf.fr").persist().get(/.*/).reply(200, { features: [] })
    vi.mocked(mailer.sendEmail).mockRejectedValue(new Error("SMTP indisponible"))

    await send("/api/etablissement/creation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: ENTREPRISE,
        email: newRecruiter.email,
        first_name: newRecruiter.firstName,
        last_name: newRecruiter.lastName,
        phone: newRecruiter.phone,
        establishment_siret: newRecruiter.siret,
        origin: "Labonnealternance",
        opco: OPCOS_LABEL.AKTO,
        idcc: "3248",
        handiEngagement: "non",
      }),
    })

    await assertNoPersonalDataSent()
    const apiEntrepriseSpan = sentEvents("transaction")
      .flatMap((transaction) => transaction.spans ?? [])
      .find((span) => span.op === "http.client" && String(span.data?.["url.full"]).includes("entreprise.api.gouv.fr"))
    expect(apiEntrepriseSpan?.data?.["url.full"]).toBe(`https://entreprise.api.gouv.fr/v3/insee/sirene/etablissements/diffusibles/${newRecruiter.siret}`)
    expect(apiEntrepriseSpan?.data).not.toHaveProperty(["url.query"])
  })

  it("lien magique, route sans authentification : pas l'e-mail saisi, utilisateur anonyme", async () => {
    await saveEntrepriseUserTest(
      { email: magicLinkUser.email, first_name: magicLinkUser.firstName, last_name: magicLinkUser.lastName, status: validatedUserStatus },
      {},
      { status: [entrepriseStatusEventFactory()] }
    )
    vi.mocked(mailer.sendEmail).mockRejectedValueOnce(new Error("SMTP indisponible"))

    await send("/api/login/magiclink", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: magicLinkUser.email }) })

    await assertNoPersonalDataSent()
    const event = sentEvents("event").find((sent) => sent.exception?.values?.[0]?.value === "SMTP indisponible")
    expect(event?.user).toEqual({ segment: "anonymous", ip_address: "127.0.0.1" })
  })

  it("espace pro : ni le corps, ni la query, ni le referer, ni le cookie de session ; l'utilisateur est identifié sans e-mail", async () => {
    const { user, role, entreprise } = await saveEntrepriseUserTest(
      {
        email: connectedRecruiter.email,
        first_name: connectedRecruiter.firstName,
        last_name: connectedRecruiter.lastName,
        phone: connectedRecruiter.phone,
        status: validatedUserStatus,
      },
      {},
      { status: [entrepriseStatusEventFactory()] }
    )
    // Le premier rôle ENTREPRISE accordé pointe vers une entreprise absente : la route échoue en 500.
    await getDbCollection("rolemanagements").updateOne({ _id: role._id }, { $set: { authorized_id: new ObjectId().toString() } })
    await getDbCollection("rolemanagements").insertOne({ ...role, _id: new ObjectId(), authorized_id: entreprise._id.toString() })
    const { token } = await getConnectedInfos(user.email)
    const query = `email=${encodeURIComponent(connectedRecruiter.email)}&telephone=${connectedRecruiter.phone}`

    // La route ne lit pas cette query : elle sert à vérifier qu'une valeur de query entrante ne part pas.
    await send(`/api/user/${user._id}?${query}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie: `${config.auth.session.cookieName}=${token}`,
        referer: `https://labonnealternance.exemple.fr/espace-pro/compte?${query}`,
      },
      body: JSON.stringify({
        email: connectedRecruiter.email,
        first_name: connectedRecruiter.firstName,
        last_name: connectedRecruiter.lastName,
        phone: connectedRecruiter.phone,
        handiEngagement: "oui",
      }),
    })

    await assertNoPersonalDataSent({ sessionToken: token })
    const [event] = sentEvents("event")
    expect(event?.user).toEqual({ segment: "session", id: user._id.toString(), ip_address: "127.0.0.1" })
    // PUT /user/:userId ne déclare aucune query : toutes les valeurs sont masquées.
    expect(event?.extra?.query).toEqual({ email: "[Filtered]", telephone: "[Filtered]" })
    expect(event?.request?.headers?.referer).toBe("https://labonnealternance.exemple.fr/espace-pro/compte")
  })

  it("erreurs MongoDB : ni le document refusé, ni la valeur en doublon", async () => {
    const applicantDocument = {
      email: applicant.email,
      firstname: applicant.firstName,
      lastname: applicant.lastName,
      phone: applicant.phone,
      last_connection: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await getDbCollection("applicants").createIndex({ email: 1 }, { unique: true })
    await getDbCollection("applicants").insertOne({ _id: new ObjectId(), ...applicantDocument })
    const duplicateKeyError = await getDbCollection("applicants")
      .insertOne({ _id: new ObjectId(), ...applicantDocument })
      .catch((error: unknown) => error)
    const bulkWriteError = await getDbCollection("applicants")
      .insertMany([{ _id: new ObjectId(), ...applicantDocument }])
      .catch((error: unknown) => error)

    assert.ok(duplicateKeyError instanceof MongoServerError && bulkWriteError instanceof MongoBulkWriteError)
    Sentry.captureException(duplicateKeyError)
    Sentry.captureException(bulkWriteError)
    await Sentry.flush(2_000)

    await assertNoPersonalDataSent()
    expect(sentEvents("event").map((event) => event.exception?.values?.[0]?.value)).toEqual([
      expect.stringContaining("index: email_1 dup key"),
      expect.stringContaining("index: email_1 dup key"),
    ])
  })

  it("erreur axios brute d'un appel sortant : ni le corps, ni la query, ni le jeton", async () => {
    nock("https://api.exemple.fr").post("/contacts").query(true).reply(400, { message: "contact refusé" })

    await Sentry.startSpan({ name: "job fictif", op: "processor.job" }, async () => {
      const error = await axios
        .post(
          `https://api.exemple.fr/contacts?telephone=${applicant.phone}`,
          { email: applicant.email, firstname: applicant.firstName, lastname: applicant.lastName, phone: applicant.phone },
          { params: { contact: applicant.email }, headers: { Authorization: `Bearer ${outgoingApiToken}` } }
        )
        .catch((err: unknown) => err)
      Sentry.captureException(error)
    })
    await Sentry.flush(2_000)

    assert.ok(sentEvents("transaction").length > 0, "aucune transaction capturée")
    await assertNoPersonalDataSent({ outgoingApiToken })
    expect(JSON.stringify(sentEvents("event"))).toContain("contact refusé")
  })

  it("ne modifie pas les objets de l'application en masquant ce qui part vers Sentry", async () => {
    const payload = { contact: applicant.email }
    const args = [applicant.email]
    console.info(payload, args)
    console.error(`échec pour ${applicant.email}`)
    console.warn(new Error(`échec pour ${applicant.email}`))
    const error = Object.assign(new Error(`échec pour ${applicant.email}`), { config: { data: { nom: applicant.lastName }, params: { email: applicant.email } } })
    const extra = { payload: { contact: applicant.email } }

    Sentry.captureException(error, { extra })
    await Sentry.flush(2_000)

    expect(payload).toEqual({ contact: applicant.email })
    expect(args).toEqual([applicant.email])
    expect(error.message).toBe(`échec pour ${applicant.email}`)
    expect(error.config).toEqual({ data: { nom: applicant.lastName }, params: { email: applicant.email } })
    expect(extra).toEqual({ payload: { contact: applicant.email } })
    await assertNoPersonalDataSent()
  })
})
