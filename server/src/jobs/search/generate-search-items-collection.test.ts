import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import type { IFormationCatalogue } from "shared"
import { JOB_STATUS_ENGLISH } from "shared"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import { fillSearchItemsCollection } from "./generate-search-items-collection"

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

  it("répartit les items dans la collection de leur mode et y purge les orphelins (#5389)", async () => {
    const offre = generateJobsPartnersOfferPrivate({ offer_title: "Vendeur" })
    const deleguee = generateJobsPartnersOfferPrivate({ offer_title: "BTS MCO en alternance", is_delegated: true, cfa_legal_name: "CFA Commerce" })
    const formation = {
      _id: new ObjectId(),
      cle_ministere_educatif: "cle-formation-1",
      intitule_rco: "BTS Négociation et digitalisation de la relation client",
      lieu_formation_adresse: "2 rue du Lieu",
      localite: "Lyon",
      code_postal: "69001",
      lieu_formation_geopoint: { type: "Point", coordinates: [4.83, 45.76] },
      etablissement_formateur_entreprise_raison_sociale: "CFA TEST",
    } as unknown as IFormationCatalogue
    await getDbCollection("jobs_partners").insertMany([offre, deleguee])
    // Formation réduite aux champs projetés par le nightly : le validateur exigerait tout le catalogue.
    await getDbCollection("formationcatalogues").insertOne(formation, { bypassDocumentValidation: true })

    // L'offre déléguée était indexée en emplois (is_delegated modifié depuis) ; orphelin présent seulement dans search_jobs.
    const orphelin = generateSearchItemFixture({ title: "Orphelin" })
    await getDbCollection("search_jobs").insertMany([generateSearchItemFixture({ _id: deleguee._id, keywords: ["gardé"] }), orphelin])

    await fillSearchItemsCollection()

    const idsOf = async (name: "search_jobs" | "search_jobs_with_training" | "search_trainings") =>
      (await getDbCollection(name).find({}).toArray()).map((doc) => doc._id.toString()).sort()
    expect(await idsOf("search_jobs")).toEqual([offre._id.toString()])
    expect(await idsOf("search_jobs_with_training")).toEqual([deleguee._id.toString()])
    expect(await idsOf("search_trainings")).toEqual([formation._id.toString()])
    expect(await getDbCollection("search_items").countDocuments({})).toBe(3)
  })
})
