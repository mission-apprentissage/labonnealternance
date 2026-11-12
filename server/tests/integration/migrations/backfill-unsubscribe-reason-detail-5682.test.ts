import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import type { IUnsubscribedLbaCompany } from "shared"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20261112120000-backfill-unsubscribe-reason-detail-5682"

// cf. backfill-offer-status-history-lba-5429.test.ts pour l'emplacement de ce test hors du dossier migrations
describe("migration backfill-unsubscribe-reason-detail-5682", () => {
  useMongo()

  const generateUnsubscribed = (siret: string, data: Partial<IUnsubscribedLbaCompany> = {}): IUnsubscribedLbaCompany => ({
    _id: new ObjectId(),
    siret,
    raison_sociale: null,
    enseigne: "",
    naf_code: "",
    naf_label: "",
    rome_codes: [],
    insee_city_code: null,
    zip_code: null,
    city: null,
    company_size: null,
    created_at: new Date("2025-01-01"),
    last_update_at: new Date("2025-01-01"),
    unsubscribe_date: new Date("2025-06-01"),
    unsubscribe_reason: "Autre",
    ...data,
  })

  it("passe à null la précision absente, sans toucher aux précisions enregistrées", async () => {
    await getDbCollection("unsubscribedrecruteurslba").insertMany([
      generateUnsubscribed("11000001500013"),
      generateUnsubscribed("11000001500021", { unsubscribe_reason_detail: "Fermeture saisonnière" }),
    ])

    await up()
    await up()

    const docs = await getDbCollection("unsubscribedrecruteurslba").find({}).sort({ siret: 1 }).toArray()
    expect(docs.map(({ siret, unsubscribe_reason_detail }) => ({ siret, unsubscribe_reason_detail }))).toEqual([
      { siret: "11000001500013", unsubscribe_reason_detail: null },
      { siret: "11000001500021", unsubscribe_reason_detail: "Fermeture saisonnière" },
    ])
  })
})
