import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import type { IFormationCatalogue } from "shared"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { syncEtablissementsAndFormations } from "./sync-etablissements-and-formations"

const GESTIONNAIRE_SIRET = "11000001500013"
const FORMATEUR_SIRET = "13002526500013"

const givenFormation = (overrides: Partial<IFormationCatalogue> = {}): IFormationCatalogue =>
  ({
    _id: new ObjectId(),
    cle_ministere_educatif: "cle-1",
    cfd: "40025214",
    num_tel: null,
    intitule_long: "BTS Management commercial opérationnel",
    published: true,
    email: null,
    parcoursup_id: null,
    parcoursup_visible: false,
    affelnet_visible: false,
    id_rco_formation: "rco-1",
    lieu_formation_adresse: "2 rue du Lieu",
    localite: "Lyon",
    code_postal: "69001",
    etablissement_gestionnaire_siret: GESTIONNAIRE_SIRET,
    etablissement_gestionnaire_courriel: null,
    etablissement_formateur_siret: FORMATEUR_SIRET,
    etablissement_formateur_adresse: "1 rue du Formateur",
    etablissement_formateur_code_postal: "75001",
    etablissement_formateur_localite: "Paris",
    etablissement_formateur_nom_departement: "Paris",
    etablissement_formateur_entreprise_raison_sociale: "CFA TEST",
    ...overrides,
  }) as IFormationCatalogue

describe("sync-etablissements-and-formations", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      await getDbCollection("formationcatalogues").deleteMany({})
      await getDbCollection("eligible_trainings_for_appointments").deleteMany({})
      await getDbCollection("etablissements").deleteMany({})
    }
  })

  it("crée la fiche eligible_trainings_for_appointments avec tous les champs projetés", async () => {
    await getDbCollection("formationcatalogues").insertOne(givenFormation())

    const stats = await syncEtablissementsAndFormations()

    expect(stats).toMatchObject({ processed: 1, inserted: 1, updated: 0, errors: 0 })

    const etfa = await getDbCollection("eligible_trainings_for_appointments").findOne({ cle_ministere_educatif: "cle-1" })
    // Champs couvrant les deux extrémités de la projection du curseur : un champ oublié dans
    // FORMATION_PROJECTION arriverait ici en null.
    expect(etfa).toMatchObject({
      training_intitule_long: "BTS Management commercial opérationnel",
      training_code_formation_diplome: "40025214",
      is_catalogue_published: true,
      lieu_formation_street: "2 rue du Lieu",
      lieu_formation_city: "Lyon",
      lieu_formation_zip_code: "69001",
      etablissement_formateur_raison_sociale: "CFA TEST",
      etablissement_formateur_street: "1 rue du Formateur",
      etablissement_formateur_zip_code: "75001",
      etablissement_formateur_city: "Paris",
      departement_etablissement_formateur: "Paris",
      etablissement_formateur_siret: FORMATEUR_SIRET,
      etablissement_gestionnaire_siret: GESTIONNAIRE_SIRET,
      rco_formation_id: "rco-1",
      referrers: [],
    })
  })

  it("met à jour la fiche existante sans en créer une seconde", async () => {
    const existingId = new ObjectId()
    await getDbCollection("eligible_trainings_for_appointments").insertOne({
      _id: existingId,
      cle_ministere_educatif: "cle-1",
      training_id_catalogue: "ancien",
      training_intitule_long: "Ancien intitulé",
      training_code_formation_diplome: "00000000",
      lieu_formation_email: null,
      parcoursup_id: null,
      rco_formation_id: "rco-origine",
      is_catalogue_published: false,
      referrers: [],
      lieu_formation_street: "ancienne rue",
      lieu_formation_city: "ancienne ville",
      lieu_formation_zip_code: "00000",
      etablissement_formateur_raison_sociale: "ANCIEN",
      etablissement_formateur_street: null,
      departement_etablissement_formateur: null,
      created_at: new Date("2020-01-01"),
      last_catalogue_sync_date: new Date("2020-01-01"),
    })
    await getDbCollection("formationcatalogues").insertOne(givenFormation())

    const stats = await syncEtablissementsAndFormations()

    expect(stats).toMatchObject({ processed: 1, inserted: 0, updated: 1, errors: 0 })

    const fiches = await getDbCollection("eligible_trainings_for_appointments").find({ cle_ministere_educatif: "cle-1" }).toArray()
    expect(fiches).toHaveLength(1)
    expect(fiches[0]._id).toEqual(existingId)
    expect(fiches[0].training_intitule_long).toBe("BTS Management commercial opérationnel")
    // rco_formation_id n'appartient pas au `$set` de mise à jour, comme avant le passage en bulk.
    expect(fiches[0].rco_formation_id).toBe("rco-origine")
  })

  it("ne crée qu'une fiche quand deux formations partagent une cle_ministere_educatif", async () => {
    await getDbCollection("formationcatalogues").insertMany([
      givenFormation({ intitule_long: "Première" }),
      givenFormation({ intitule_long: "Seconde", id_rco_formation: "rco-2" }),
    ])

    const stats = await syncEtablissementsAndFormations()

    expect(stats.errors).toBe(0)
    const fiches = await getDbCollection("eligible_trainings_for_appointments").find({ cle_ministere_educatif: "cle-1" }).toArray()
    expect(fiches).toHaveLength(1)
    // Dernière formation lue gagne sur les champs partagés, mais pas sur les champs propres à la
    // création : même arbitrage que l'ancien insert-puis-update.
    expect(fiches[0].training_intitule_long).toBe("Seconde")
    expect(fiches[0].rco_formation_id).toBe("rco-1")
  })

  it("n'active aucun referrer tant que l'établissement n'a ni opt-out ni premium", async () => {
    await getDbCollection("etablissements").insertOne({
      _id: new ObjectId(),
      gestionnaire_siret: GESTIONNAIRE_SIRET,
      formateur_siret: FORMATEUR_SIRET,
      raison_sociale: "CFA TEST",
      gestionnaire_email: null,
    })
    await getDbCollection("formationcatalogues").insertOne(givenFormation())

    await syncEtablissementsAndFormations()

    const etfa = await getDbCollection("eligible_trainings_for_appointments").findOne({ cle_ministere_educatif: "cle-1" })
    expect(etfa?.referrers).toEqual([])
  })

  it("active LBA et 1jeune1solution quand l'opt-out est activé sans refus", async () => {
    await getDbCollection("etablissements").insertOne({
      _id: new ObjectId(),
      gestionnaire_siret: GESTIONNAIRE_SIRET,
      formateur_siret: FORMATEUR_SIRET,
      raison_sociale: "CFA TEST",
      gestionnaire_email: null,
      optout_activation_date: new Date("2026-01-01"),
    })
    await getDbCollection("formationcatalogues").insertOne(givenFormation())

    await syncEtablissementsAndFormations()

    const etfa = await getDbCollection("eligible_trainings_for_appointments").findOne({ cle_ministere_educatif: "cle-1" })
    expect(etfa?.referrers).toEqual(["LBA", "JEUNE_1_SOLUTION"])
  })

  it("écrit les formations valides d'un lot même si l'une d'elles est rejetée, et échoue à la fin", async () => {
    await getDbCollection("formationcatalogues").insertMany([
      givenFormation({ cle_ministere_educatif: "cle-ok-1" }),
      // intitule_long absent -> training_intitule_long null -> rejeté par le validateur de schéma.
      givenFormation({ cle_ministere_educatif: "cle-ko", intitule_long: undefined }),
      givenFormation({ cle_ministere_educatif: "cle-ok-2" }),
    ])

    // Message asserté au caractère près : le dénominateur doit être le nombre de formations
    // parcourues (3), pas `processed + errors` qui compte deux fois celle qui a été rejetée.
    await expect(syncEtablissementsAndFormations()).rejects.toThrow("syncEtablissementsAndFormations: 1 erreur(s) sur 3 formation(s) parcourue(s)")

    // Le cœur de la régression évitée : en lot ordonné, le document rejeté aurait emporté tout ce
    // qui le suit dans le même bulkWrite.
    const cles = (await getDbCollection("eligible_trainings_for_appointments").find({}).toArray()).map((f) => f.cle_ministere_educatif).sort()
    expect(cles).toEqual(["cle-ok-1", "cle-ok-2"])
  })
})
