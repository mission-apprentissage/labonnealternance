import { describe, it, expect } from "vitest"
import { getSimulationInformation, getChargesSalariales } from "./simulateurAlternant"
import {
  TAUX_APPRENTISSAGE,
  TAUX_PROFESSIONNALISATION,
  SMIC,
  DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE,
  TAUX_COTISATIONS_SALARIALES_AVANT_EXONERATION_APPRENTISSAGE_PRIVE,
  TAUX_COTISATIONS_SALARIALES_AVANT_EXONERATION_APPRENTISSAGE_PUBLIC,
  TAUX_COTISATIONS_SALARIALES_CONTRAT_PROFESSIONNALISATION,
  TAUX_EXONERATION_CHARGES_SALARIALES_APPRENTISSAGE_PUBLIC,
} from "@/config/simulateur-alternant"

// ============================================
// HELPERS POUR LES TESTS
// ============================================

const createDateNaissance = (age: number, referenceDate: Date = new Date("2024-09-01")): Date => {
  const dateNaissance = new Date(referenceDate)
  dateNaissance.setFullYear(dateNaissance.getFullYear() - age)
  return dateNaissance
}

// ============================================
// TESTS: Tranches d'âge
// ============================================

describe("Tranches d'âge", () => {
  describe("Apprentissage", () => {
    it.each([
      { age: 15, expectedTranche: "14-17", annee: 1, expectedTaux: TAUX_APPRENTISSAGE[0][1] },
      { age: 17, expectedTranche: "14-17", annee: 1, expectedTaux: TAUX_APPRENTISSAGE[0][1] },
      { age: 18, expectedTranche: "18-20", annee: 1, expectedTaux: TAUX_APPRENTISSAGE[1][1] },
      { age: 20, expectedTranche: "18-20", annee: 1, expectedTaux: TAUX_APPRENTISSAGE[1][1] },
      { age: 21, expectedTranche: "21-25", annee: 1, expectedTaux: TAUX_APPRENTISSAGE[2][1] },
      { age: 25, expectedTranche: "21-25", annee: 1, expectedTaux: TAUX_APPRENTISSAGE[2][1] },
      { age: 26, expectedTranche: "26+", annee: 1, expectedTaux: TAUX_APPRENTISSAGE[3][1] },
      { age: 30, expectedTranche: "26+", annee: 1, expectedTaux: TAUX_APPRENTISSAGE[3][1] },
    ])("$age ans → tranche $expectedTranche", ({ age, expectedTaux }) => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 4,
        dureeContrat: 1,
        dateSignature: new Date("2024-09-01"),
        dateNaissance: createDateNaissance(age),
        isRegionMayotte: false,
        secteur: "privé",
      })

      expect(result[0].tauxSmic).toBe(expectedTaux)
    })
  })

  describe("Professionnalisation", () => {
    it.each([
      { age: 16, expectedTranche: "14-20", niveau: 5, expectedTaux: TAUX_PROFESSIONNALISATION[0].bacEtPlus },
      { age: 20, expectedTranche: "14-20", niveau: 5, expectedTaux: TAUX_PROFESSIONNALISATION[0].bacEtPlus },
      { age: 21, expectedTranche: "21-25", niveau: 5, expectedTaux: TAUX_PROFESSIONNALISATION[1].bacEtPlus },
      { age: 25, expectedTranche: "21-25", niveau: 5, expectedTaux: TAUX_PROFESSIONNALISATION[1].bacEtPlus },
      { age: 26, expectedTranche: "26+", niveau: 5, expectedTaux: TAUX_PROFESSIONNALISATION[2].bacEtPlus },
    ])("$age ans → tranche $expectedTranche", ({ age, niveau, expectedTaux }) => {
      const result = getSimulationInformation({
        typeContrat: "professionnalisation",
        niveauDiplome: niveau,
        dureeContrat: 1,
        dateSignature: new Date("2024-09-01"),
        dateNaissance: createDateNaissance(age),
        isRegionMayotte: false,
        secteur: "privé",
      })

      expect(result[0].tauxSmic).toBe(expectedTaux)
    })
  })
})

// ============================================
// TESTS: Groupes de niveau de diplôme
// ============================================

describe("Groupes de niveau de diplôme", () => {
  it.each([
    { niveau: 1, expectedGroup: "inferieurBac" },
    { niveau: 2, expectedGroup: "inferieurBac" },
    { niveau: 3, expectedGroup: "inferieurBac" },
    { niveau: 4, expectedGroup: "bacEtPlus" },
    { niveau: 5, expectedGroup: "bacEtPlus" },
    { niveau: 6, expectedGroup: "bacEtPlus" },
    { niveau: 7, expectedGroup: "bacEtPlus" },
    { niveau: 8, expectedGroup: "bacEtPlus" },
  ])("niveau $niveau → $expectedGroup", ({ niveau, expectedGroup }) => {
    const tauxAttendu = expectedGroup === "bacEtPlus" ? TAUX_PROFESSIONNALISATION[0].bacEtPlus : TAUX_PROFESSIONNALISATION[0].inferieurBac

    const result = getSimulationInformation({
      typeContrat: "professionnalisation",
      niveauDiplome: niveau,
      dureeContrat: 1,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(18),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].tauxSmic).toBe(tauxAttendu)
  })
})

// ============================================
// TESTS: Durée de contrat
// ============================================

describe("Durée de contrat", () => {
  it("retourne les taux pour chaque année du contrat (apprentissage)", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 3,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(21), // reste dans la même tranche 21-25
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result).toHaveLength(3)
    expect(result[0].tauxSmic).toBe(TAUX_APPRENTISSAGE[2][1]) // 21 ans, 1ère année
    expect(result[1].tauxSmic).toBe(TAUX_APPRENTISSAGE[2][2]) // 22 ans, 2ème année
    expect(result[2].tauxSmic).toBe(TAUX_APPRENTISSAGE[2][3]) // 23 ans, 3ème année
  })

  it("retourne le même taux pour chaque année (professionnalisation)", () => {
    const result = getSimulationInformation({
      typeContrat: "professionnalisation",
      niveauDiplome: 5,
      dureeContrat: 2,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(22), // reste dans la même tranche 21-25
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result).toHaveLength(2)
    expect(result[0].tauxSmic).toBe(result[1].tauxSmic)
  })

  it("change de tranche d'âge si l'alternant vieillit (apprentissage 17→18)", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 2,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(17),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].tauxSmic).toBe(TAUX_APPRENTISSAGE[0][1]) // 17 ans → tranche 14-17
    expect(result[1].tauxSmic).toBe(TAUX_APPRENTISSAGE[1][2]) // 18 ans → tranche 18-20
  })

  it("change de tranche d'âge si l'alternant vieillit (apprentissage 20→21)", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 2,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(20),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].tauxSmic).toBe(TAUX_APPRENTISSAGE[1][1]) // 20 ans → tranche 18-20
    expect(result[1].tauxSmic).toBe(TAUX_APPRENTISSAGE[2][2]) // 21 ans → tranche 21-25
  })

  it("change de tranche d'âge si l'alternant vieillit (apprentissage 25→26)", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 2,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(25),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].tauxSmic).toBe(TAUX_APPRENTISSAGE[2][1]) // 25 ans → tranche 21-25
    expect(result[1].tauxSmic).toBe(TAUX_APPRENTISSAGE[3][2]) // 26 ans → tranche 26+
  })

  it("change de tranche d'âge si l'alternant vieillit (professionnalisation 20→21)", () => {
    const result = getSimulationInformation({
      typeContrat: "professionnalisation",
      niveauDiplome: 5,
      dureeContrat: 2,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(20),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].tauxSmic).toBe(TAUX_PROFESSIONNALISATION[0].bacEtPlus) // 20 ans → tranche 14-20
    expect(result[1].tauxSmic).toBe(TAUX_PROFESSIONNALISATION[1].bacEtPlus) // 21 ans → tranche 21-25
  })
})

// ============================================
// TESTS: Calcul salaire brut
// ============================================

describe("Calcul du salaire brut", () => {
  it("calcule correctement le salaire brut métropole", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(26),
      isRegionMayotte: false,
      secteur: "privé",
    })

    const salaireHoraireBrutAttendu = SMIC.metropole.brut.horaire
    expect(result[0].salaireHoraireBrut.max).toBeCloseTo(salaireHoraireBrutAttendu, 2)
  })

  it("calcule correctement le salaire brut Mayotte", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(26),
      isRegionMayotte: true,
      secteur: "privé",
    })

    const salaireHoraireBrutAttendu = SMIC.mayotte.brut.horaire
    expect(result[0].salaireHoraireBrut.max).toBeCloseTo(salaireHoraireBrutAttendu, 2)
  })

  it("applique la cohérence horaire → mensuel → annuel", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(20),
      isRegionMayotte: false,
      secteur: "privé",
    })

    const horaire = result[0].salaireHoraireBrut.max
    const annuelAttendu = horaire * 35 * 52
    const mensuelAttendu = annuelAttendu / 12

    expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(annuelAttendu, 0)
    expect(result[0].salaireMensuelBrut.max).toBeCloseTo(mensuelAttendu, 0)
  })
})

// ============================================
// TESTS: Calcul salaire net et exonérations
// ============================================

describe("Calcul du salaire net", () => {
  describe("Apprentissage - Exonération charges", () => {
    it("exonération totale avant la date limite", () => {
      const dateAvantExoneration = new Date(DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE)
      dateAvantExoneration.setDate(dateAvantExoneration.getDate() - 1)

      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 4,
        dureeContrat: 1,
        dateSignature: dateAvantExoneration,
        dateNaissance: createDateNaissance(20),
        isRegionMayotte: false,
        secteur: "privé",
      })

      expect(result[0].salaireHoraireNet.max).toBeCloseTo(result[0].salaireHoraireBrut.max, 2)
    })
  })

  describe("Professionnalisation", () => {
    it("applique les cotisations salariales", () => {
      const result = getSimulationInformation({
        typeContrat: "professionnalisation",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2024-09-01"),
        dateNaissance: createDateNaissance(22),
        isRegionMayotte: false,
        secteur: "privé",
      })

      expect(result[0].salaireHoraireNet.max).toBeLessThan(result[0].salaireHoraireBrut.max)
    })
  })
})

// ============================================
// TESTS: Tranche de salaire (min/max)
// ============================================

describe("Tranche de salaire", () => {
  it("calcule min = 97% et max = 100%", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(20),
      isRegionMayotte: false,
      secteur: "privé",
    })

    const { min, max } = result[0].salaireMensuelBrut
    expect(min).toBeCloseTo(max * 0.97, 2)
  })
})

// ============================================
// TESTS: Structure de retour
// ============================================

describe("Structure de retour", () => {
  it("contient toutes les propriétés requises", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: new Date("2024-09-01"),
      dateNaissance: createDateNaissance(20),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0]).toMatchObject({
      tauxSmic: expect.any(Number),
      salaireHoraireBrut: { min: expect.any(Number), max: expect.any(Number) },
      salaireMensuelBrut: { min: expect.any(Number), max: expect.any(Number) },
      salaireAnnuelBrut: { min: expect.any(Number), max: expect.any(Number) },
      salaireHoraireNet: { min: expect.any(Number), max: expect.any(Number) },
      salaireMensuelNet: { min: expect.any(Number), max: expect.any(Number) },
      salaireAnnuelNet: { min: expect.any(Number), max: expect.any(Number) },
      dateMiseAJour: expect.any(Date),
    })
  })
})

// ============================================
// TESTS: Cas d'erreur
// ============================================

describe("Cas d'erreur", () => {
  it("lève une erreur pour un âge < 14 ans", () => {
    expect(() => {
      getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 4,
        dureeContrat: 1,
        dateSignature: new Date("2024-09-01"),
        dateNaissance: createDateNaissance(13),
        isRegionMayotte: false,
        secteur: "privé",
      })
    }).toThrow(/hors des tranches définies/)
  })

  it("lève une erreur pour un niveau de diplôme invalide (0)", () => {
    expect(() => {
      getSimulationInformation({
        typeContrat: "professionnalisation",
        niveauDiplome: 0,
        dureeContrat: 1,
        dateSignature: new Date("2024-09-01"),
        dateNaissance: createDateNaissance(20),
        isRegionMayotte: false,
        secteur: "privé",
      })
    }).toThrow(/invalide/)
  })

  it("lève une erreur pour un niveau de diplôme invalide (9)", () => {
    expect(() => {
      getSimulationInformation({
        typeContrat: "professionnalisation",
        niveauDiplome: 9,
        dureeContrat: 1,
        dateSignature: new Date("2024-09-01"),
        dateNaissance: createDateNaissance(20),
        isRegionMayotte: false,
        secteur: "privé",
      })
    }).toThrow(/invalide/)
  })
})

// ============================================
// TESTS: Secteur public vs privé (après exonération)
// ============================================

describe("Calcul charges salariales par secteur (après date exonération)", () => {
  const dateApresExoneration = new Date(DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE)
  dateApresExoneration.setDate(dateApresExoneration.getDate() + 1)

  it("secteur public : exhonération totale", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(20),
      isRegionMayotte: false,
      secteur: "public",
    })

    expect(result[0].salaireHoraireNet.max).toEqual(result[0].salaireHoraireBrut.max)
  })

  it("secteur privé : n'applique pas le taux après exonération partielle car taux > 50%", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(20),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].salaireHoraireNet.max).toEqual(result[0].salaireHoraireBrut.max)
  })

  it("secteur privé : applique le taux après exonération partielle", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(22),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].salaireHoraireNet.max).toBeLessThan(result[0].salaireHoraireBrut.max)
  })

  it("secteur public vs privé : les charges diffèrent", () => {
    const resultPublic = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(22),
      isRegionMayotte: false,
      secteur: "public",
    })

    const resultPrive = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(22),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(resultPublic[0].salaireHoraireBrut.max).toBe(resultPrive[0].salaireHoraireBrut.max)
    expect(resultPublic[0].salaireHoraireNet.max).not.toBe(resultPrive[0].salaireHoraireNet.max)
  })
})

// ============================================
// TESTS: Règle taux > 50% vs <= 50% (secteur privé)
// ============================================

describe("Règle du seuil 50% SMIC (secteur privé, après exonération)", () => {
  const dateApresExoneration = new Date(DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE)
  dateApresExoneration.setDate(dateApresExoneration.getDate() + 1)

  it("taux <= 50% : exonération totale des charges (net = brut)", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(15),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].salaireHoraireNet.max).toBeCloseTo(result[0].salaireHoraireBrut.max, 2)
  })

  it("taux > 50% : charges calculées sur la part excédentaire", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(22),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].salaireHoraireNet.max).toBeLessThan(result[0].salaireHoraireBrut.max)
  })

  it("taux 43% (< 50%) : pas de charges", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 1,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(18),
      isRegionMayotte: false,
      secteur: "privé",
    })

    expect(result[0].salaireHoraireNet.max).toBeCloseTo(result[0].salaireHoraireBrut.max, 2)
  })

  it("progression des charges avec le taux", () => {
    const result = getSimulationInformation({
      typeContrat: "apprentissage",
      niveauDiplome: 4,
      dureeContrat: 3,
      dateSignature: dateApresExoneration,
      dateNaissance: createDateNaissance(22),
      isRegionMayotte: false,
      secteur: "privé",
    })

    const ratio1 = result[0].salaireHoraireNet.max / result[0].salaireHoraireBrut.max
    const ratio2 = result[1].salaireHoraireNet.max / result[1].salaireHoraireBrut.max
    const ratio3 = result[2].salaireHoraireNet.max / result[2].salaireHoraireBrut.max

    expect(ratio1).toBeGreaterThan(ratio2)
    expect(ratio2).toBeGreaterThan(ratio3)
  })
})

// ============================================
// TESTS: getChargesSalariales
// ============================================

describe("getChargesSalariales", () => {
  const salaireHoraireBrut = 10 // valeur de test fixe

  describe("Contrat de professionnalisation", () => {
    it("applique le taux de cotisations salariales sur le salaire brut", () => {
      const charges = getChargesSalariales({
        typeContrat: "professionnalisation",
        dateSignature: new Date("2024-09-01"),
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.7,
      })

      const expectedCharges = salaireHoraireBrut * TAUX_COTISATIONS_SALARIALES_CONTRAT_PROFESSIONNALISATION
      expect(charges).toBeCloseTo(expectedCharges, 4)
    })

    it("ignore le secteur pour la professionnalisation", () => {
      const chargesPublic = getChargesSalariales({
        typeContrat: "professionnalisation",
        dateSignature: new Date("2024-09-01"),
        secteur: "public",
        salaireHoraireBrut,
        tauxSmic: 0.7,
      })

      const chargesPrive = getChargesSalariales({
        typeContrat: "professionnalisation",
        dateSignature: new Date("2024-09-01"),
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.7,
      })

      expect(chargesPublic).toBe(chargesPrive)
    })
  })

  describe("Apprentissage - Exonération totale (avant date limite)", () => {
    it("retourne 0 si date signature <= date fin exonération", () => {
      const charges = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.6,
      })

      expect(charges).toBe(0)
    })

    it("exonération totale indépendante du secteur et du tauxSmic", () => {
      const chargesPublic = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE,
        secteur: "public",
        salaireHoraireBrut,
        tauxSmic: 0.8,
      })

      const chargesPrive = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.3,
      })

      expect(chargesPublic).toBe(0)
      expect(chargesPrive).toBe(0)
    })
  })

  describe("Apprentissage - Secteur public (après date limite)", () => {
    const dateApresExoneration = new Date(DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE)
    dateApresExoneration.setDate(dateApresExoneration.getDate() + 1)

    it("applique le taux avec exonération partielle", () => {
      const charges = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "public",
        salaireHoraireBrut,
        tauxSmic: 0.6,
      })

      const tauxApresExoneration = TAUX_COTISATIONS_SALARIALES_AVANT_EXONERATION_APPRENTISSAGE_PUBLIC * (1 - TAUX_EXONERATION_CHARGES_SALARIALES_APPRENTISSAGE_PUBLIC)
      const expectedCharges = salaireHoraireBrut * tauxApresExoneration

      expect(charges).toBeCloseTo(expectedCharges, 4)
    })

    it("ignore le tauxSmic pour le secteur public", () => {
      const charges30 = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "public",
        salaireHoraireBrut,
        tauxSmic: 0.3,
      })

      const charges80 = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "public",
        salaireHoraireBrut,
        tauxSmic: 0.8,
      })

      expect(charges30).toBe(charges80)
    })
  })

  describe("Apprentissage - Secteur privé (après date limite)", () => {
    const dateApresExoneration = new Date(DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE)
    dateApresExoneration.setDate(dateApresExoneration.getDate() + 1)

    it("retourne 0 si tauxSmic <= 50%", () => {
      const charges = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.43,
      })

      expect(charges).toBe(0)
    })

    it("retourne 0 si tauxSmic = 50% exactement", () => {
      const charges = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.5,
      })

      expect(charges).toBe(0)
    })

    it("applique les charges sur la part > 50% si tauxSmic > 50%", () => {
      const tauxSmic = 0.53
      const charges = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic,
      })

      const tauxApresExoneration = ((tauxSmic - 0.5) / tauxSmic) * TAUX_COTISATIONS_SALARIALES_AVANT_EXONERATION_APPRENTISSAGE_PRIVE
      const expectedCharges = salaireHoraireBrut * tauxApresExoneration

      expect(charges).toBeCloseTo(expectedCharges, 4)
      expect(charges).toBeGreaterThan(0)
    })

    it("les charges augmentent avec le tauxSmic (à salaire brut égal)", () => {
      const charges53 = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.53,
      })

      const charges78 = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.78,
      })

      const charges100 = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 1.0,
      })

      expect(charges53).toBeLessThan(charges78)
      expect(charges78).toBeLessThan(charges100)
    })
  })

  describe("Comparaison entre secteurs et types de contrat", () => {
    const dateApresExoneration = new Date(DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE)
    dateApresExoneration.setDate(dateApresExoneration.getDate() + 1)

    it("charges public != charges privé pour apprentissage (tauxSmic > 50%)", () => {
      const chargesPublic = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "public",
        salaireHoraireBrut,
        tauxSmic: 0.6,
      })

      const chargesPrive = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: dateApresExoneration,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.6,
      })

      expect(chargesPublic).not.toBe(chargesPrive)
    })

    it("charges professionnalisation > charges apprentissage exonéré", () => {
      const chargesPro = getChargesSalariales({
        typeContrat: "professionnalisation",
        dateSignature: new Date("2024-09-01"),
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.7,
      })

      const chargesApprentissageExonere = getChargesSalariales({
        typeContrat: "apprentissage",
        dateSignature: DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE,
        secteur: "privé",
        salaireHoraireBrut,
        tauxSmic: 0.7,
      })

      expect(chargesPro).toBeGreaterThan(chargesApprentissageExonere)
    })
  })
})

describe("Cas de tests", () => {
  describe("Cas de tests hors Mayotte", () => {
    it("Test 1 - apprentissage - 25 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2000-05-15"),
        isRegionMayotte: false,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 11594.0
      const salaireAnnuelNetMiniAttendu = 11118.0
      const salaireAnnuelNetMaxiAttendu = 11462.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 2 - apprentissage - 19 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2006-05-15"),
        isRegionMayotte: false,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 9407.0
      const salaireAnnuelNetMiniAttendu = 9125.0
      const salaireAnnuelNetMaxiAttendu = 9407.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 3 - apprentissage - 18 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2008-05-15"),
        isRegionMayotte: false,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 5907.0
      const salaireAnnuelNetMiniAttendu = 5730.0
      const salaireAnnuelNetMaxiAttendu = 5907.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 4 - apprentissage - 27 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("1998-05-15"),
        isRegionMayotte: false,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 21876.0
      const salaireAnnuelNetMiniAttendu = 19136.0
      const salaireAnnuelNetMaxiAttendu = 19728.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 5 - apprentissage - 25 ans - niveau 5 - public", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2000-05-15"),
        isRegionMayotte: false,
        secteur: "public",
      })

      const salaireAnnuelBrutAttendu = 11594.0
      const salaireAnnuelNetMiniAttendu = 11118.0
      const salaireAnnuelNetMaxiAttendu = 11462.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 6 - apprentissage - 25 ans - niveau 3 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 3,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2000-05-15"),
        isRegionMayotte: false,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 11594.0
      const salaireAnnuelNetMiniAttendu = 11118.0
      const salaireAnnuelNetMaxiAttendu = 11462.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 7 - apprentissage - 25 ans - niveau 7 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 7,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2000-05-15"),
        isRegionMayotte: false,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 11594.0
      const salaireAnnuelNetMiniAttendu = 11118.0
      const salaireAnnuelNetMaxiAttendu = 11462.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 8 - professionnalisation - 25 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "professionnalisation",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2000-05-15"),
        isRegionMayotte: false,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 17501.0
      // TODO: pas dans la liste des cas de test fournie
      // const salaireAnnuelNetMiniAttendu =
      const salaireAnnuelNetMaxiAttendu = 16128.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      // expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })
  })

  describe("Cas de tests Mayotte", () => {
    it("Test 1 - apprentissage - 25 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2000-05-15"),
        isRegionMayotte: true,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 9000.0
      const salaireAnnuelNetMiniAttendu = 8625.0
      const salaireAnnuelNetMaxiAttendu = 8892.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 2 - apprentissage - 19 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2006-05-15"),
        isRegionMayotte: true,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 7302.0
      const salaireAnnuelNetMiniAttendu = 7083.0
      const salaireAnnuelNetMaxiAttendu = 7302.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 3 - apprentissage - 17 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2008-05-15"),
        isRegionMayotte: true,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 4585.0
      const salaireAnnuelNetMiniAttendu = 4447.0
      const salaireAnnuelNetMaxiAttendu = 4585.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 4 - apprentissage - 27 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("1998-05-15"),
        isRegionMayotte: true,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 16981.0
      const salaireAnnuelNetMiniAttendu = 14790.0
      const salaireAnnuelNetMaxiAttendu = 15217.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 5 - apprentissage - 25 ans - niveau 5 - public", () => {
      const result = getSimulationInformation({
        typeContrat: "apprentissage",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2000-05-15"),
        isRegionMayotte: true,
        secteur: "public",
      })

      const salaireAnnuelBrutAttendu = 9000.0
      const salaireAnnuelNetMiniAttendu = 8625.0
      const salaireAnnuelNetMaxiAttendu = 8892.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })

    it("Test 6 - professionnalisation - 25 ans - niveau 5 - privé", () => {
      const result = getSimulationInformation({
        typeContrat: "professionnalisation",
        niveauDiplome: 5,
        dureeContrat: 1,
        dateSignature: new Date("2026-01-12"),
        dateNaissance: new Date("2000-05-15"),
        isRegionMayotte: true,
        secteur: "privé",
      })

      const salaireAnnuelBrutAttendu = 13584.0
      // TODO: pas dans la liste des cas de test fournie
      // const salaireAnnuelNetMiniAttendu =
      const salaireAnnuelNetMaxiAttendu = 12528.0

      expect(result[0].salaireAnnuelBrut.max).toBeCloseTo(salaireAnnuelBrutAttendu, 0)
      // expect(result[0].salaireAnnuelNet.min).toBeCloseTo(salaireAnnuelNetMiniAttendu, 0)
      expect(result[0].salaireAnnuelNet.max).toBeCloseTo(salaireAnnuelNetMaxiAttendu, 0)
    })
  })
})
