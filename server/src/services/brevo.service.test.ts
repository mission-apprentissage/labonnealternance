import { beforeEach, describe, expect, it, vi } from "vitest"

const importContacts = vi.fn()

vi.mock("@getbrevo/brevo", () => {
  class ContactsApi {
    setApiKey() {
      // le SDK est entièrement mocké : la clé n'est jamais utilisée
    }
    importContacts = importContacts
  }
  class WebhooksApi {
    setApiKey() {
      // le SDK est entièrement mocké : la clé n'est jamais utilisée
    }
    createWebhook = createWebhook
  }
  class RequestContactImport {
    fileBody?: string
    listIds?: number[]
    updateExistingContacts?: boolean
    emptyContactsAttributes?: boolean
  }
  return {
    default: { ContactsApi, WebhooksApi, RequestContactImport, ContactsApiApiKeys: { apiKey: "apiKey" }, WebhooksApiApiKeys: { apiKey: "apiKey" } },
    CreateWebhook: { TypeEnum: { Transactional: "transactional", Marketing: "marketing" }, EventsEnum: {} },
  }
})

const createWebhook = vi.fn()
const loggerError = vi.fn()

vi.mock("@/common/logger", async (importOriginal) => {
  const mod = await importOriginal<{ logger: Record<string, unknown> }>()
  return { ...mod, logger: { ...mod.logger, error: loggerError, warn: vi.fn(), info: vi.fn() } }
})

vi.mock("@/config", async (importOriginal) => {
  const mod = await importOriginal<{ default: Record<string, unknown> }>()
  // initBrevoWebhooks sort immédiatement hors production : il faut ce mock pour couvrir le handler.
  return { default: { ...mod.default, env: "production" } }
})

const { initBrevoWebhooks, uploadContactListToBrevo } = await import("./brevo.service")

// L'erreur du SDK Brevo porte `config.data`, c'est-à-dire le corps CSV complet de l'import : des
// adresses email nominatives de recruteurs et de candidats. Relevée telle quelle, elle était
// sérialisée dans Sentry par extraErrorDataIntegration (Sentry LBA-SERVER-5J7KF4ZZZTAAB).
describe("uploadContactListToBrevo", () => {
  const contacts = [
    { EMAIL: "recruteur@exemple-entreprise.fr", PRENOM: "Camille", NOM: "Martin" },
    { EMAIL: "candidat@exemple-perso.fr", PRENOM: "Dominique", NOM: "Bernard" },
  ]
  const contactMapper = [{ key: "EMAIL" }, { key: "PRENOM" }, { key: "NOM" }]

  // Reproduit la forme réelle : l'AxiosError rejeté embarque la requête envoyée, corps inclus.
  const erreurBrevo = (status: number, message: string) =>
    Object.assign(new Error(`Request failed with status code ${status}`), {
      isAxiosError: true,
      config: { url: "https://api.brevo.com/v3/contacts/import", data: JSON.stringify({ fileBody: contacts.map((c) => Object.values(c).join(";")).join("\n") }) },
      response: { status, data: { code: "unauthorized", message } },
    })

  const televerser = () => uploadContactListToBrevo("TRANSACTIONAL", contacts, contactMapper, "628")

  beforeEach(() => {
    importContacts.mockReset()
  })

  it("ne relève aucune adresse email de l'import dans l'erreur", async () => {
    importContacts.mockRejectedValue(erreurBrevo(401, "Key not found"))

    const error = await televerser().then(
      () => null,
      (e) => e
    )

    expect(error).not.toBeNull()
    // Sérialisation large : message, data Boom, et toute propriété propre de l'erreur.
    const serialise = JSON.stringify({ message: error.message, data: error.data, ...error })
    expect(serialise).not.toContain("recruteur@exemple-entreprise.fr")
    expect(serialise).not.toContain("candidat@exemple-perso.fr")
    expect(serialise).not.toContain("fileBody")
  })

  it("conserve de quoi diagnostiquer", async () => {
    importContacts.mockRejectedValue(erreurBrevo(401, "Key not found"))

    const error = await televerser().then(
      () => null,
      (e) => e
    )

    expect(error.message).toContain("Key not found")
    expect(error.data).toMatchObject({ account: "TRANSACTIONAL", listId: "628", status: 401, contactCount: 2 })
  })

  it("assainit aussi l'erreur après épuisement des retries sur 429", async () => {
    importContacts.mockRejectedValue(erreurBrevo(429, "Rate limit"))

    const error = await televerser().then(
      () => null,
      (e) => e
    )

    expect(JSON.stringify({ message: error.message, data: error.data, ...error })).not.toContain("recruteur@exemple-entreprise.fr")
    expect(error.data).toMatchObject({ status: 429 })
    expect(importContacts).toHaveBeenCalledTimes(5)
  }, 20_000)

  it("n'échoue pas quand l'import réussit", async () => {
    importContacts.mockResolvedValue({})
    await expect(televerser()).resolves.toBeUndefined()
  })
})

// `error.response.res.text` était lu sans garde dans le handler de rejet : sur un échec réseau
// (pas de `response`), le handler levait lui-même un TypeError que plus rien ne rattrapait — rejet
// non rattrapé à chaque démarrage du serveur en production (Sentry LBA-SERVER-5J7KF4ZZZTA8E).
describe("initBrevoWebhooks", () => {
  const attendreLesRejets = () => new Promise((resolve) => setImmediate(resolve))

  beforeEach(() => {
    createWebhook.mockReset()
  })

  it("ne lève pas de rejet non rattrapé quand l'erreur n'a pas de response", async () => {
    const rejetsNonRattrapes: unknown[] = []
    const capture = (raison: unknown) => rejetsNonRattrapes.push(raison)
    process.on("unhandledRejection", capture)
    createWebhook.mockRejectedValue(Object.assign(new Error("getaddrinfo ENOTFOUND api.brevo.com"), { code: "ENOTFOUND" }))

    try {
      initBrevoWebhooks()
      await attendreLesRejets()
      await attendreLesRejets()
    } finally {
      process.off("unhandledRejection", capture)
    }

    expect(createWebhook).toHaveBeenCalledTimes(3)
    expect(rejetsNonRattrapes).toEqual([])
  })

  it("journalise le message de l'API quand la response est présente", async () => {
    loggerError.mockClear()
    createWebhook.mockRejectedValue({ response: { status: 401, data: { message: "Key not found" } }, message: "Request failed with status code 401" })

    initBrevoWebhooks()
    await attendreLesRejets()
    await attendreLesRejets()

    const logged = loggerError.mock.calls.map(([message]) => String(message))
    expect(logged).toHaveLength(3)
    expect(logged[0]).toContain("status=401")
    expect(logged[0]).toContain("Key not found")
  })
})
