import { beforeEach, describe, expect, it, vi } from "vitest"

const getAttributes = vi.fn()
const createAttribute = vi.fn()

vi.mock("@getbrevo/brevo", () => {
  class ContactsApi {
    setApiKey() {
      // le SDK est entièrement mocké : la clé n'est jamais utilisée
    }
    getAttributes = getAttributes
    createAttribute = createAttribute
  }
  class WebhooksApi {
    setApiKey() {
      // le SDK est entièrement mocké : la clé n'est jamais utilisée
    }
  }
  return {
    default: {
      ContactsApi,
      WebhooksApi,
      ContactsApiApiKeys: { apiKey: "apiKey" },
      WebhooksApiApiKeys: { apiKey: "apiKey" },
      CreateAttribute: { TypeEnum: { Text: "text", Date: "date", Float: "float", Boolean: "boolean" } },
    },
    CreateWebhook: { TypeEnum: {}, EventsEnum: {} },
  }
})

vi.mock("@/common/logger", async (importOriginal) => {
  const mod = await importOriginal<{ logger: Record<string, unknown> }>()
  return { ...mod, logger: { ...mod.logger, error: vi.fn(), warn: vi.fn(), info: vi.fn() } }
})

const { BREVO_CONTACT_ATTRIBUTES, diffBrevoContactAttributes, syncBrevoContactAttributes } = await import("./brevo-contact-attributes")

const conformAccount = () => Object.entries(BREVO_CONTACT_ATTRIBUTES).map(([name, type]) => ({ name, category: "normal", type }))
const without = (attributes: ReturnType<typeof conformAccount>, name: string) => attributes.filter((attribute) => attribute.name !== name)

describe("diffBrevoContactAttributes", () => {
  it("ne signale rien sur un compte conforme qui contient aussi des centaines d'autres attributs", () => {
    const foreign = Array.from({ length: 200 }, (_, i) => ({ name: `LIEN_PRDV_${i + 1}`, category: "normal", type: "text" }))

    expect(diffBrevoContactAttributes([...foreign, ...conformAccount()])).toEqual({ missing: [], mismatches: [] })
  })

  it("signale un attribut absent avec le type à créer", () => {
    expect(diffBrevoContactAttributes(without(conformAccount(), "DATE_DERNIERE_OFFRE"))).toEqual({
      missing: [{ name: "DATE_DERNIERE_OFFRE", type: "date" }],
      mismatches: [],
    })
  })

  it("ne prend pas un attribut au nom voisin pour l'attribut attendu", () => {
    const account = [...without(conformAccount(), "METIER"), { name: "METIER_1", category: "normal", type: "text" }, { name: "JOB_TITLE", category: "normal", type: "text" }]

    expect(diffBrevoContactAttributes(account).missing).toEqual([{ name: "METIER", type: "text" }])
  })

  it("signale un attribut présent au mauvais type sans le compter comme absent", () => {
    const account = [...without(conformAccount(), "ROLE_CREATEDAT"), { name: "ROLE_CREATEDAT", category: "normal", type: "text" }]

    expect(diffBrevoContactAttributes(account)).toEqual({
      missing: [],
      mismatches: [{ name: "ROLE_CREATEDAT", expected: "normal/date", actual: "normal/text" }],
    })
  })

  it("signale un attribut du bon nom mais d'une autre catégorie", () => {
    const account = [...without(conformAccount(), "USER_ORIGIN"), { name: "USER_ORIGIN", category: "category" }]

    expect(diffBrevoContactAttributes(account).mismatches).toEqual([{ name: "USER_ORIGIN", expected: "normal/text", actual: "category/-" }])
  })
})

describe("syncBrevoContactAttributes", () => {
  beforeEach(() => {
    getAttributes.mockReset()
    createAttribute.mockReset()
  })

  it("passe sans rien créer sur un compte conforme", async () => {
    getAttributes.mockResolvedValue({ body: { attributes: conformAccount() } })

    await expect(syncBrevoContactAttributes({ apply: true })).resolves.toEqual({ missing: [], mismatches: [] })
    expect(createAttribute).not.toHaveBeenCalled()
  })

  it("échoue sans rien créer quand un attribut manque et que --apply est absent", async () => {
    getAttributes.mockResolvedValue({ body: { attributes: without(conformAccount(), "METIER") } })

    await expect(syncBrevoContactAttributes()).rejects.toMatchObject({ data: { unresolved: ["METIER"] } })
    expect(createAttribute).not.toHaveBeenCalled()
  })

  it("crée les attributs manquants avec --apply", async () => {
    getAttributes.mockResolvedValue({ body: { attributes: without(without(conformAccount(), "METIER"), "LAST_ACTION_DATE") } })
    createAttribute.mockResolvedValue({})

    await syncBrevoContactAttributes({ apply: true })

    expect(createAttribute).toHaveBeenCalledWith("normal", "LAST_ACTION_DATE", { type: "date" })
    expect(createAttribute).toHaveBeenCalledWith("normal", "METIER", { type: "text" })
    expect(createAttribute).toHaveBeenCalledTimes(2)
  })

  it("échoue en nommant l'attribut quand Brevo refuse la création (limite d'attributs atteinte)", async () => {
    getAttributes.mockResolvedValue({ body: { attributes: without(conformAccount(), "METIER") } })
    createAttribute.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 400"), {
        response: { status: 400, data: { code: "invalid_parameter", message: "You have reached the limit on the number of attributes you can create." } },
      })
    )

    await expect(syncBrevoContactAttributes({ apply: true })).rejects.toMatchObject({
      data: {
        unresolved: ["METIER"],
        failures: [{ name: "METIER", status: 400, message: "You have reached the limit on the number of attributes you can create." }],
      },
    })
  })

  it("échoue sur un attribut au mauvais type sans tenter de le recréer", async () => {
    getAttributes.mockResolvedValue({ body: { attributes: [...without(conformAccount(), "JOB_COUNT"), { name: "JOB_COUNT", category: "normal", type: "text" }] } })

    await expect(syncBrevoContactAttributes({ apply: true })).rejects.toMatchObject({
      data: { unresolved: [], mismatches: [{ name: "JOB_COUNT", expected: "normal/float", actual: "normal/text" }] },
    })
    expect(createAttribute).not.toHaveBeenCalled()
  })
})
