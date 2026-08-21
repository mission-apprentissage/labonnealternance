import { useMongo } from "@tests/utils/mongo.test.utils"
import { afterEach, describe, expect, it, vi } from "vitest"
import { s3ReadAsStream } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { stringToStream } from "@/common/utils/stream-utils"
import { importDecaContratsParAnnee } from "./import-deca-contrats-par-annee"

vi.mock("@/common/utils/aws-utils", () => ({
  s3ReadAsStream: vi.fn(),
}))

describe("importDecaContratsParAnnee", () => {
  useMongo()

  afterEach(() => {
    vi.mocked(s3ReadAsStream).mockReset()
  })

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

  it("retombe sur la lecture S3 quand le 1er argument n'est pas un Readable (régression : le runner générique des jobs simples appelle fct(job.payload), qui n'est pas forcément undefined)", async () => {
    const s3Stream = stringToStream(JSON.stringify({ siret: "42476141900045", contrats_par_annee: { "2023": 2 } }) + "\n")
    vi.mocked(s3ReadAsStream).mockResolvedValueOnce(s3Stream)

    // Simule jobs.ts:478 (`handler: async (job) => fct(job.payload)`) où job.payload est un objet
    // quelconque, pas un stream : avant le fix, cet objet était passé directement à pipeline() et
    // faisait planter le job avec "The 'body' argument must be ... Received an instance of Object".
    const counters = await importDecaContratsParAnnee({ notAStream: true } as any)

    expect(s3ReadAsStream).toHaveBeenCalledWith("storage", "siretlist/lba_deca_contrats_par_annee.ndjson")
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
