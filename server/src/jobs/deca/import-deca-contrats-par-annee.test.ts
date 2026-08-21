import { useMongo } from "@tests/utils/mongo.test.utils"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { stringToStream } from "@/common/utils/stream-utils"
import { importDecaContratsParAnnee } from "./import-deca-contrats-par-annee"

describe("importDecaContratsParAnnee", () => {
  useMongo()

  it("importe les documents valides mais fait échouer le job (throw) dès qu'une ligne est rejetée, pour ne pas sortir en succès silencieux", async () => {
    const lines = [
      // Valide : upserté tel quel
      JSON.stringify({ siret: "42476141900045", contrats_par_annee: { "2023": 2, "2024": 3 } }),
      // SIRET invalide (échec Luhn) : ignoré
      JSON.stringify({ siret: "12345678901234", contrats_par_annee: { "2023": 1 } }),
      // Clé "année" invalide (pas 4 chiffres) : document entier ignoré
      JSON.stringify({ siret: "39837261500128", contrats_par_annee: { "23": 1 } }),
      // Valeur négative : document entier ignoré
      JSON.stringify({ siret: "11000001500013", contrats_par_annee: { "2023": -5 } }),
      // Ligne non-JSON : ignorée par ndjsonToObjectStream lui-même, sans interrompre le flux
      "ceci n'est pas du json",
      "",
    ]

    // Le document valide est tout de même upserté avant que l'échec global ne soit remonté : seul le
    // statut final du job (throw) signale l'anomalie, pas une absence d'écriture.
    await expect(importDecaContratsParAnnee(stringToStream(lines.join("\n") + "\n"))).rejects.toThrow(/4\/4 document\(s\) rejeté\(s\)/)

    const documents = await getDbCollection("deca_contrats")
      .find({}, { projection: { _id: 0, created_at: 0, updated_at: 0 } })
      .toArray()
    expect(documents).toEqual([{ siret: "42476141900045", contrats_par_annee: { "2023": 2, "2024": 3 } }])
  })

  it("ne fait pas échouer le job quand toutes les lignes sont valides", async () => {
    const counters = await importDecaContratsParAnnee(stringToStream(JSON.stringify({ siret: "42476141900045", contrats_par_annee: { "2023": 2 } }) + "\n"))
    expect(counters).toEqual({ total: 1, upserted: 1, errors: 0 })
  })

  it("propage (throw) l'échec de lecture du flux source, sans sortir en succès", async () => {
    const brokenStream = stringToStream("")
    // Force une erreur de flux après le branchement, pour reproduire un fichier S3 devenu inaccessible
    // en cours de lecture (droits perdus, connexion coupée…) plutôt qu'à l'ouverture.
    queueMicrotask(() => brokenStream.emit("error", new Error("stream cassé")))

    await expect(importDecaContratsParAnnee(brokenStream)).rejects.toThrow("stream cassé")
  })

  it("met à jour un document existant (upsert) sans toucher aux autres champs", async () => {
    await importDecaContratsParAnnee(stringToStream(JSON.stringify({ siret: "42476141900045", contrats_par_annee: { "2023": 2 } }) + "\n"))
    const firstWrite = await getDbCollection("deca_contrats").findOne({ siret: "42476141900045" })
    expect(firstWrite?.contrats_par_annee).toEqual({ "2023": 2 })

    const counters = await importDecaContratsParAnnee(stringToStream(JSON.stringify({ siret: "42476141900045", contrats_par_annee: { "2023": 2, "2024": 5 } }) + "\n"))

    expect(counters).toEqual({ total: 1, upserted: 1, errors: 0 })
    const documents = await getDbCollection("deca_contrats").find({}).toArray()
    expect(documents).toHaveLength(1)
    expect(documents[0].contrats_par_annee).toEqual({ "2023": 2, "2024": 5 })
    expect(documents[0]._id).toEqual(firstWrite?._id)
    expect(documents[0].created_at).toEqual(firstWrite?.created_at)
  })
})
