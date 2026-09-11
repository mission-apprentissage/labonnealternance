import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared"
import { generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import {
  controlSearchItemsDrift,
  dedupeRepeatedTitle,
  removeJobPartnersFromSearchItems,
  resetSearchItemBuildContextCache,
  syncSearchItemsDelta,
  upsertJobPartnersToSearchItems,
} from "./search-items.service"

describe("dedupeRepeatedTitle", () => {
  it("supprime la duplication d'intitulé", () => {
    expect(dedupeRepeatedTitle("BTS bâtiment BTS bâtiment")).toBe("BTS bâtiment")
  })

  it("détecte la duplication malgré des entités HTML", () => {
    expect(dedupeRepeatedTitle("Achat &amp; vente Achat & vente")).toBe("Achat & vente")
  })

  it("laisse intact un titre non dupliqué", () => {
    expect(dedupeRepeatedTitle("Conseiller de vente en alternance")).toBe("Conseiller de vente en alternance")
  })
})

describe("searchItems.service — synchronisation jobs_partners → search_items", () => {
  useMongo()

  beforeEach(async () => {
    // Le contexte de build (référentiel ROME, canonicalisation) est mémoïsé avec TTL :
    // invalidation entre chaque test pour que les seeds de referentielromes soient visibles.
    resetSearchItemBuildContextCache()
    await getDbCollection("search_items").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("referentielromes").deleteMany({})
    await getDbCollection("applications").deleteMany({})
  })

  const seedRome = async () => {
    await getDbCollection("referentielromes").insertMany([
      generateReferentielRome({ rome: { code_rome: "M1805", intitule: "Études et développement informatique", code_ogr: "1" } }),
      generateReferentielRome({ rome: { code_rome: "D1102", intitule: "Boulangerie - viennoiserie", code_ogr: "2" } }),
    ])
  }

  describe("upsertJobPartnersToSearchItems", () => {
    it("indexe une offre ACTIVE avec ses champs dérivés", async () => {
      await seedRome()
      const job = generateJobsPartnersOfferPrivate({
        offer_title: "Développeur web en alternance",
        offer_rome_codes: ["M1805"],
        apply_email: "recruteur@entreprise.fr",
        workplace_name: "Entreprise Test",
      })
      await getDbCollection("jobs_partners").insertOne(job)

      const result = await upsertJobPartnersToSearchItems([job._id])

      expect(result).toEqual({ upserted: 1, removed: 0 })
      const doc = await getDbCollection("search_items").findOne({ _id: job._id })
      expect(doc).toMatchObject({
        type: "offre",
        sub_type: "offres_emploi_partenaires",
        title: "Développeur web en alternance",
        smart_apply: true,
        application_count: 0,
        is_algo_company: false,
        rome_labels: ["Études et développement informatique"],
        keywords: null,
      })
    })

    it("compte les candidatures d'une offre via job_id (ObjectId ↔ ObjectId)", async () => {
      const job = generateJobsPartnersOfferPrivate({ apply_email: "recruteur@entreprise.fr" })
      const autreJob = generateJobsPartnersOfferPrivate({})
      await getDbCollection("jobs_partners").insertMany([job, autreJob])
      await getDbCollection("applications").insertMany([
        generateApplicationFixture({ job_id: job._id }),
        generateApplicationFixture({ job_id: job._id }),
        // Near-miss : candidature d'une autre offre — ne doit pas être comptée.
        generateApplicationFixture({ job_id: autreJob._id }),
      ])

      await upsertJobPartnersToSearchItems([job._id, autreJob._id])

      const doc = await getDbCollection("search_items").findOne({ _id: job._id })
      expect(doc?.application_count).toBe(2)
      const autreDoc = await getDbCollection("search_items").findOne({ _id: autreJob._id })
      expect(autreDoc?.application_count).toBe(1)
    })

    it("compte les candidatures d'un recruteur LBA via le siret", async () => {
      const recruteur = generateJobsPartnersOfferPrivate({
        partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        workplace_siret: "42476141900045",
      })
      await getDbCollection("jobs_partners").insertOne(recruteur)
      await getDbCollection("applications").insertMany([
        generateApplicationFixture({ company_siret: "42476141900045", job_id: null }),
        // Near-miss : autre siret — ne doit pas être comptée.
        generateApplicationFixture({ company_siret: "34268752200066", job_id: null }),
      ])

      await upsertJobPartnersToSearchItems([recruteur._id])

      const doc = await getDbCollection("search_items").findOne({ _id: recruteur._id })
      expect(doc?.application_count).toBe(1)
    })

    it("indexe une offre déléguée sous le nom du CFA, pas celui de l'entreprise d'accueil", async () => {
      const job = generateJobsPartnersOfferPrivate({
        is_delegated: true,
        cfa_legal_name: "CFA des Métiers du Numérique",
        cfa_siret: "42476141900045",
        cfa_address_label: "12 rue de la Formation 75011 Paris",
        workplace_name: "Boulangerie du Marché",
        workplace_brand: "Aux Bons Pains",
        workplace_legal_name: "SARL BOULANGERIE DU MARCHE",
        workplace_address_label: "3 place du Four 75012 Paris",
      })
      await getDbCollection("jobs_partners").insertOne(job)

      await upsertJobPartnersToSearchItems([job._id])

      const doc = await getDbCollection("search_items").findOne({ _id: job._id })
      expect(doc?.organization_name).toBe("CFA des Métiers du Numérique")
      expect(doc?.type_filter_label).toBe("Offres d'emploi postées par des écoles")
      // L'adresse de l'entreprise d'accueil la réidentifierait : c'est celle du CFA qui est indexée.
      expect(doc?.address).toBe("12 rue de la Formation 75011 Paris")
      // Le geopoint reste celui de l'entreprise — pertinence géographique et distance affichée.
      expect(doc?.location?.coordinates).toEqual(job.workplace_geopoint.coordinates)
    })

    it("n'affiche aucun nom plutôt que celui de l'entreprise quand le CFA d'une offre déléguée est inconnu", async () => {
      const job = generateJobsPartnersOfferPrivate({
        is_delegated: true,
        cfa_legal_name: null,
        workplace_name: "Boulangerie du Marché",
        workplace_legal_name: "SARL BOULANGERIE DU MARCHE",
      })
      await getDbCollection("jobs_partners").insertOne(job)

      await upsertJobPartnersToSearchItems([job._id])

      const doc = await getDbCollection("search_items").findOne({ _id: job._id })
      expect(doc?.organization_name).toBe("")
    })

    it("near-miss : cfa_legal_name renseigné sur une offre NON déléguée → nom de l'entreprise conservé", async () => {
      const job = generateJobsPartnersOfferPrivate({
        is_delegated: false,
        cfa_legal_name: "CFA des Métiers du Numérique",
        cfa_address_label: "12 rue de la Formation 75011 Paris",
        workplace_name: "Boulangerie du Marché",
        workplace_address_label: "3 place du Four 75012 Paris",
      })
      await getDbCollection("jobs_partners").insertOne(job)

      await upsertJobPartnersToSearchItems([job._id])

      const doc = await getDbCollection("search_items").findOne({ _id: job._id })
      expect(doc?.organization_name).toBe("Boulangerie du Marché")
      expect(doc?.address).toBe("3 place du Four 75012 Paris")
    })

    it("préserve les keywords Mistral lors d'un ré-upsert", async () => {
      const job = generateJobsPartnersOfferPrivate({ offer_title: "Titre initial" })
      await getDbCollection("jobs_partners").insertOne(job)
      await upsertJobPartnersToSearchItems([job._id])
      await getDbCollection("search_items").updateOne({ _id: job._id }, { $set: { keywords: ["javascript", "react"] } })

      await getDbCollection("jobs_partners").updateOne({ _id: job._id }, { $set: { offer_title: "Titre modifié" } })
      await upsertJobPartnersToSearchItems([job._id])

      const doc = await getDbCollection("search_items").findOne({ _id: job._id })
      expect(doc?.title).toBe("Titre modifié")
      expect(doc?.keywords).toEqual(["javascript", "react"])
    })

    it("retire une offre passée non-ACTIVE", async () => {
      const job = generateJobsPartnersOfferPrivate({})
      await getDbCollection("jobs_partners").insertOne(job)
      await upsertJobPartnersToSearchItems([job._id])
      expect(await getDbCollection("search_items").countDocuments({ _id: job._id })).toBe(1)

      await getDbCollection("jobs_partners").updateOne({ _id: job._id }, { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } })
      const result = await upsertJobPartnersToSearchItems([job._id])

      expect(result.removed).toBe(1)
      expect(await getDbCollection("search_items").countDocuments({ _id: job._id })).toBe(0)
    })

    it("retire un _id disparu de jobs_partners (suppression physique)", async () => {
      const job = generateJobsPartnersOfferPrivate({})
      await getDbCollection("jobs_partners").insertOne(job)
      await upsertJobPartnersToSearchItems([job._id])

      await getDbCollection("jobs_partners").deleteOne({ _id: job._id })
      const result = await upsertJobPartnersToSearchItems([job._id])

      expect(result.removed).toBe(1)
      expect(await getDbCollection("search_items").countDocuments({ _id: job._id })).toBe(0)
    })

    it("route les recruteurs_lba : candidature spontanée, rome via offer_rome_codes (fallback sans raw)", async () => {
      await seedRome()
      const recruteur = generateJobsPartnersOfferPrivate({
        partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        workplace_siret: "42476141900045",
        workplace_name: "Boulangerie du Marché",
        offer_rome_codes: ["D1102"],
      })
      await getDbCollection("jobs_partners").insertOne(recruteur)

      await upsertJobPartnersToSearchItems([recruteur._id])

      const doc = await getDbCollection("search_items").findOne({ _id: recruteur._id })
      expect(doc).toMatchObject({
        sub_type: "recruteurs_lba",
        url_id: "42476141900045",
        is_algo_company: true,
        description: "",
        start_date: null,
        contract_type: ["Apprentissage", "Professionnalisation"],
        rome_labels: ["Boulangerie - viennoiserie"],
      })
      expect(doc?.title).toBe("Boulangerie du Marché")
    })

    it("retire un recruteur passé inactif (même règle que le batch nightly)", async () => {
      const recruteur = generateJobsPartnersOfferPrivate({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
      await getDbCollection("jobs_partners").insertOne(recruteur)
      await upsertJobPartnersToSearchItems([recruteur._id])
      expect(await getDbCollection("search_items").countDocuments({ _id: recruteur._id })).toBe(1)

      await getDbCollection("jobs_partners").updateOne({ _id: recruteur._id }, { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } })
      const result = await upsertJobPartnersToSearchItems([recruteur._id])

      expect(result.removed).toBe(1)
      expect(await getDbCollection("search_items").countDocuments({ _id: recruteur._id })).toBe(0)
    })
  })

  describe("removeJobPartnersFromSearchItems", () => {
    it("supprime les offres demandées mais ne touche jamais les formations", async () => {
      const formation = generateSearchItemFixture({ type: "formation", sub_type: "formation" })
      const offre = generateSearchItemFixture({ type: "offre" })
      await getDbCollection("search_items").insertMany([formation, offre])

      const removed = await removeJobPartnersFromSearchItems([formation._id, offre._id])

      expect(removed).toBe(1)
      expect(await getDbCollection("search_items").countDocuments({ _id: formation._id })).toBe(1)
      expect(await getDbCollection("search_items").countDocuments({ _id: offre._id })).toBe(0)
    })
  })

  describe("syncSearchItemsDelta", () => {
    it("ne traite que les jobs_partners modifiés dans la fenêtre", async () => {
      const recent = generateJobsPartnersOfferPrivate({ updated_at: new Date() })
      const stale = generateJobsPartnersOfferPrivate({ updated_at: new Date("2020-01-01") })
      await getDbCollection("jobs_partners").insertMany([recent, stale])

      const result = await syncSearchItemsDelta({ since: new Date(Date.now() - 60_000) })

      expect(result.scanned).toBe(1)
      expect(await getDbCollection("search_items").countDocuments({ _id: recent._id })).toBe(1)
      expect(await getDbCollection("search_items").countDocuments({ _id: stale._id })).toBe(0)
    })

    it("retire de l'index les offres récemment annulées (écritures de masse)", async () => {
      const job = generateJobsPartnersOfferPrivate({})
      await getDbCollection("jobs_partners").insertOne(job)
      await upsertJobPartnersToSearchItems([job._id])

      // Simule une écriture de masse (ex. expireJobsPartners) : annulation + bump updated_at.
      await getDbCollection("jobs_partners").updateOne({ _id: job._id }, { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: new Date() } })
      const result = await syncSearchItemsDelta({ since: new Date(Date.now() - 60_000) })

      expect(result.removed).toBe(1)
      expect(await getDbCollection("search_items").countDocuments({ _id: job._id })).toBe(0)
    })
  })

  describe("controlSearchItemsDrift", () => {
    it("ne compte que les recruteurs LBA actifs dans le volume attendu", async () => {
      const recruteurActif = generateJobsPartnersOfferPrivate({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
      const recruteurInactif = generateJobsPartnersOfferPrivate({
        partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      })
      await getDbCollection("jobs_partners").insertMany([recruteurActif, recruteurInactif])
      // Seul le recruteur actif est indexé : le recruteur annulé n'a jamais été (ou plus) dans search_items.
      await upsertJobPartnersToSearchItems([recruteurActif._id, recruteurInactif._id])

      const result = await controlSearchItemsDrift()

      expect(result.expectedRecruteurs).toBe(1)
      expect(result.indexedRecruteurs).toBe(1)
      expect(result.drift).toBe(false)
    })
  })
})
