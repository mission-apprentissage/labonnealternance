import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateSearchItemFixture } from "shared/fixtures/searchItems.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { fillSearchItemsCollection } from "./generateSearchItemsCollection"

describe("fillSearchItemsCollection — réconciliation nightly (streamée)", () => {
  useMongo()

  beforeEach(async () => {
    await getDbCollection("search_items").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it("indexe les offres actives et les recruteurs, purge les orphelins, préserve les keywords", async () => {
    const active = generateJobsPartnersOfferPrivate({ offer_title: "Offre active" })
    const cancelled = generateJobsPartnersOfferPrivate({ offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    const recruteur = generateJobsPartnersOfferPrivate({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, workplace_siret: "42476141900045", workplace_name: "Recruteur Algo" })
    await getDbCollection("jobs_partners").insertMany([active, cancelled, recruteur])

    // Doc déjà indexé avec keywords Mistral (doit être conservé, keywords compris) + orphelin (doit être purgé).
    await getDbCollection("search_items").insertMany([
      generateSearchItemFixture({ _id: active._id, title: "Ancien titre", keywords: ["mot-clé-mistral"] }),
      generateSearchItemFixture({ title: "Orphelin (plus dans les sources)" }),
    ])

    await fillSearchItemsCollection()

    const docs = await getDbCollection("search_items").find({}).toArray()
    expect(docs).toHaveLength(2)

    const activeDoc = docs.find((doc) => doc._id.equals(active._id))
    // Doc existant conservé : keywords préservés, champs contrat resynchronisés.
    expect(activeDoc?.keywords).toEqual(["mot-clé-mistral"])
    expect(activeDoc?.title).toBe("Offre active")

    const recruteurDoc = docs.find((doc) => doc._id.equals(recruteur._id))
    expect(recruteurDoc).toMatchObject({ sub_type: "recruteurs_lba", is_algo_company: true, url_id: "42476141900045" })

    // L'offre annulée n'est pas indexée, l'orphelin a été purgé.
    expect(docs.some((doc) => doc._id.equals(cancelled._id))).toBe(false)
  })
})
