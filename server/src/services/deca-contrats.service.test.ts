import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getHiringCountLastFullYears } from "./deca-contrats.service"

const SIRET = "42476141900045"

useMongo()

describe("getHiringCountLastFullYears", () => {
  it("retourne null quand le SIRET est inconnu de deca_contrats", async () => {
    const result = await getHiringCountLastFullYears(SIRET, new Date("2026-08-20"))
    expect(result).toBeNull()
  })

  it("additionne les 3 années civiles pleines précédant referenceDate, année en cours exclue", async () => {
    await getDbCollection("deca_contrats").insertOne({
      _id: new ObjectId(),
      siret: SIRET,
      contrats_par_annee: { "2022": 1, "2023": 2, "2024": 3, "2025": 4, "2026": 5 },
      created_at: new Date(),
      updated_at: new Date(),
    })

    // 2026 (année en cours) exclue : 2023 + 2024 + 2025 = 9
    const result = await getHiringCountLastFullYears(SIRET, new Date("2026-08-20"))
    expect(result).toBe(9)
  })

  it("compte les années manquantes comme 0 sans faire échouer le calcul", async () => {
    await getDbCollection("deca_contrats").insertOne({
      _id: new ObjectId(),
      siret: SIRET,
      contrats_par_annee: { "2024": 3 },
      created_at: new Date(),
      updated_at: new Date(),
    })

    const result = await getHiringCountLastFullYears(SIRET, new Date("2026-08-20"))
    expect(result).toBe(3)
  })

  it("retourne 0 (et non null) quand le SIRET est connu mais sans aucun contrat sur la période", async () => {
    await getDbCollection("deca_contrats").insertOne({
      _id: new ObjectId(),
      siret: SIRET,
      contrats_par_annee: { "2018": 7 },
      created_at: new Date(),
      updated_at: new Date(),
    })

    const result = await getHiringCountLastFullYears(SIRET, new Date("2026-08-20"))
    expect(result).toBe(0)
  })

  // Documents historiques possibles malgré la validation zod à l'import (écrits avant son ajout, ou en
  // base malgré le validationAction "warn" en prod) : le service doit rester défensif plutôt que planter.
  // bypassDocumentValidation: en environnement de test, le validateur JSON schema de la collection est en
  // mode "error" (mongodb-utils.ts, validationAction "warn" uniquement en prod) : ces documents malformés
  // seraient normalement rejetés à l'insertion. On force leur écriture pour reproduire fidèlement un
  // document historique déjà présent en base (écrit avant l'ajout de la validation zod à l'import, ou
  // en base malgré le mode "warn" en prod).
  it("retourne 0 quand contrats_par_annee est absent du document", async () => {
    await getDbCollection("deca_contrats").insertOne(
      {
        _id: new ObjectId(),
        siret: SIRET,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
      { bypassDocumentValidation: true }
    )

    await expect(getHiringCountLastFullYears(SIRET, new Date("2026-08-20"))).resolves.toBe(0)
  })

  it("retourne 0 quand contrats_par_annee est null", async () => {
    await getDbCollection("deca_contrats").insertOne(
      {
        _id: new ObjectId(),
        siret: SIRET,
        contrats_par_annee: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
      { bypassDocumentValidation: true }
    )

    await expect(getHiringCountLastFullYears(SIRET, new Date("2026-08-20"))).resolves.toBe(0)
  })

  it("ignore une valeur de type string pour une année (0 pour cette année, pas de crash ni de concaténation)", async () => {
    await getDbCollection("deca_contrats").insertOne(
      {
        _id: new ObjectId(),
        siret: SIRET,
        contrats_par_annee: { "2023": "72", "2024": 3 },
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
      { bypassDocumentValidation: true }
    )

    // "72" ignorée (0) ; seule 2024 (3) compte -> pas de concaténation "0" + "72" -> "072"
    await expect(getHiringCountLastFullYears(SIRET, new Date("2026-08-20"))).resolves.toBe(3)
  })

  it("ignore une valeur négative pour une année", async () => {
    await getDbCollection("deca_contrats").insertOne({
      _id: new ObjectId(),
      siret: SIRET,
      contrats_par_annee: { "2023": -5, "2024": 3 },
      created_at: new Date(),
      updated_at: new Date(),
    })

    await expect(getHiringCountLastFullYears(SIRET, new Date("2026-08-20"))).resolves.toBe(3)
  })
})
