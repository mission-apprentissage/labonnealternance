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
})
