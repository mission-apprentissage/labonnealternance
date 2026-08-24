import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { validateSIRET } from "shared/validators/siret-validator"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiEntrepriseEtablissementFixture } from "@/common/apis/api-entreprise/api-entreprise.client.fixture"
import { s3ReadAsStream } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { stringToStream } from "@/common/utils/stream-utils"
import { updateHandiEngagement } from "./update-handi-engagement"

// Mock S3 pour fournir le flux ndjson sans appel AWS réel
vi.mock("@/common/utils/aws-utils", () => ({
  s3ReadAsStream: vi.fn(),
}))

const SIRET_1 = apiEntrepriseEtablissementFixture.dinum.data.siret
const SIRET_2 = "42476141900045"

const mockNdjson = (docs: object[]) => {
  vi.mocked(s3ReadAsStream).mockResolvedValue(stringToStream(docs.map((doc) => JSON.stringify(doc)).join("\n")))
}

// Génère un SIRET valide (regex 14 chiffres + clé de Luhn) à partir d'un index, pour construire des
// jeux de tests de taille arbitraire sans dépendre des deux seules constantes SIRET_1/SIRET_2.
const makeValidSiret = (index: number): string => {
  const base = `99999999${String(index).padStart(5, "0")}` // 13 chiffres
  for (let checkDigit = 0; checkDigit <= 9; checkDigit++) {
    const candidate = `${base}${checkDigit}`
    if (validateSIRET(candidate)) return candidate
  }
  throw new Error(`Aucun SIRET valide trouvé pour l'index ${index}`)
}

useMongo()

describe("updateHandiEngagement", () => {
  beforeEach(async () => {
    vi.mocked(s3ReadAsStream).mockReset()
    return async () => {
      await getDbCollection("referentiel_engagement_entreprise").deleteMany({})
    }
  })

  it("Cas 1 - crée une nouvelle entrée avec source FRANCE_TRAVAIL quand le SIRET est absent du référentiel", async () => {
    // given
    mockNdjson([{ siret: SIRET_1 }])
    // when
    await updateHandiEngagement()
    // then
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_1 })
    expect(doc).not.toBeNull()
    expect(doc?.engagement).toBe("handicap")
    expect(doc?.sources).toEqual([EntrepriseEngagementSources.FRANCE_TRAVAIL])
  })

  it("Cas 2 - ne duplique pas la source quand le SIRET est déjà présent avec la source FRANCE_TRAVAIL", async () => {
    // given
    const before = new Date("2020-01-01")
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: SIRET_1,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
      created_at: before,
      updated_at: before,
    })
    mockNdjson([{ siret: SIRET_1 }])
    // when
    await updateHandiEngagement()
    // then
    // Le traitement applique désormais un upsert unique ($addToSet) quel que soit l'état préalable du
    // document : updated_at est donc rafraîchi même quand la source était déjà présente.
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_1 })
    expect(doc?.sources).toEqual([EntrepriseEngagementSources.FRANCE_TRAVAIL])
    expect(doc?.updated_at.getTime()).toBeGreaterThan(before.getTime())
  })

  it("Cas 3 - complète les sources avec FRANCE_TRAVAIL quand le SIRET n'a que la source LBA, sans écraser l'existant", async () => {
    // given
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: SIRET_1,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.LBA],
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockNdjson([{ siret: SIRET_1 }])
    // when
    await updateHandiEngagement()
    // then
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_1 })
    expect(doc?.sources).toContain(EntrepriseEngagementSources.LBA)
    expect(doc?.sources).toContain(EntrepriseEngagementSources.FRANCE_TRAVAIL)
    expect(doc?.sources).toHaveLength(2)
  })

  it("traite plusieurs sirets du fichier ndjson", async () => {
    // given
    mockNdjson([{ siret: SIRET_1 }, { siret: SIRET_2 }])
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(2)
    expect(docs.map((d) => d.siret)).toContain(SIRET_1)
    expect(docs.map((d) => d.siret)).toContain(SIRET_2)
  })

  it("ignore les lignes avec un SIRET invalide sans interrompre le traitement des autres lignes", async () => {
    // given
    mockNdjson([{ siret: "invalid-siret" }, { siret: SIRET_2 }])
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(1)
    expect(docs[0].siret).toBe(SIRET_2)
  })

  it("ignore les lignes ndjson non parsables sans interrompre le traitement des autres lignes", async () => {
    // given
    vi.mocked(s3ReadAsStream).mockResolvedValue(stringToStream(["not-json", JSON.stringify({ siret: SIRET_2 })].join("\n")))
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(1)
    expect(docs[0].siret).toBe(SIRET_2)
  })

  it("ne fait rien si le fichier S3 est vide", async () => {
    // given
    mockNdjson([])
    // when
    await updateHandiEngagement()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(0)
  })

  it("propage l'erreur et n'écrit rien si la lecture S3 échoue (fichier introuvable / erreur S3)", async () => {
    // given
    vi.mocked(s3ReadAsStream).mockRejectedValue(new Error("S3 error"))
    // when / then
    // L'erreur est loguée puis relancée (cf. update-handi-engagement.ts) pour que le job soit
    // remonté en échec plutôt que silencieusement ignoré.
    await expect(updateHandiEngagement()).rejects.toThrow("S3 error")
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(0)
  })

  describe("quand un SIRET n'est plus présent dans le fichier téléchargé", () => {
    it("supprime l'entrée si la source FRANCE_TRAVAIL était sa seule source", async () => {
      // given
      await getDbCollection("referentiel_engagement_entreprise").insertOne({
        _id: new ObjectId(),
        siret: SIRET_2,
        engagement: "handicap",
        sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
        created_at: new Date(),
        updated_at: new Date(),
      })
      mockNdjson([{ siret: SIRET_1 }])
      // when
      await updateHandiEngagement()
      // then
      const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_2 })
      expect(doc).toBeNull()
    })

    it("laisse l'entrée inchangée si elle n'a que la source LBA", async () => {
      // given
      const before = new Date("2020-01-01")
      await getDbCollection("referentiel_engagement_entreprise").insertOne({
        _id: new ObjectId(),
        siret: SIRET_2,
        engagement: "handicap",
        sources: [EntrepriseEngagementSources.LBA],
        created_at: before,
        updated_at: before,
      })
      mockNdjson([{ siret: SIRET_1 }])
      // when
      await updateHandiEngagement()
      // then
      const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_2 })
      expect(doc?.sources).toEqual([EntrepriseEngagementSources.LBA])
      expect(doc?.updated_at.getTime()).toBe(before.getTime())
    })

    it("retire uniquement la source FRANCE_TRAVAIL si l'entrée a aussi la source LBA", async () => {
      // given
      await getDbCollection("referentiel_engagement_entreprise").insertOne({
        _id: new ObjectId(),
        siret: SIRET_2,
        engagement: "handicap",
        sources: [EntrepriseEngagementSources.LBA, EntrepriseEngagementSources.FRANCE_TRAVAIL],
        created_at: new Date(),
        updated_at: new Date(),
      })
      mockNdjson([{ siret: SIRET_1 }])
      // when
      await updateHandiEngagement()
      // then
      const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET_2 })
      expect(doc).not.toBeNull()
      expect(doc?.sources).toEqual([EntrepriseEngagementSources.LBA])
    })
  })

  describe("garde-fou : nettoyage inverse déclenché uniquement dans une marge de ±20% autour du nombre de SIRET FRANCE_TRAVAIL déjà en base", () => {
    // 10 SIRET déjà en base avec la source FRANCE_TRAVAIL (previousFranceTravailCount = 10) et 4 SIRET
    // supplémentaires, absents de la base, utilisés pour faire varier la taille du fichier téléchargé.
    const SIRETS = Array.from({ length: 14 }, (_, i) => makeValidSiret(i))
    const EXISTING = SIRETS.slice(0, 10)
    const NEW_SIRETS = SIRETS.slice(10)

    const seedExistingFranceTravailDocs = async () => {
      await getDbCollection("referentiel_engagement_entreprise").insertMany(
        EXISTING.map((siret) => ({
          _id: new ObjectId(),
          siret,
          engagement: "handicap" as const,
          sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
          created_at: new Date(),
          updated_at: new Date(),
        }))
      )
    }

    it("nettoie quand le fichier perd exactement 20% des SIRET (limite basse incluse : 8/10)", async () => {
      // given : previousFranceTravailCount = 10, fichier = 8 des 10 SIRET existants (perte de 2, soit -20% pile)
      await seedExistingFranceTravailDocs()
      const fileSirets = EXISTING.slice(0, 8)
      mockNdjson(fileSirets.map((siret) => ({ siret })))
      // when
      await updateHandiEngagement()
      // then : 8 >= 10*0.8 → la marge est respectée, le nettoyage s'exécute : les 2 SIRET disparus du
      // fichier (dont la seule source était FRANCE_TRAVAIL) sont supprimés
      const remaining = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
      expect(remaining.map((d) => d.siret).sort()).toEqual([...fileSirets].sort())
    })

    it("ne nettoie pas quand le fichier perd plus de 20% des SIRET (juste sous la limite basse : 7/10)", async () => {
      // given : previousFranceTravailCount = 10, fichier = 7 des 10 SIRET existants (perte de 3, soit -30%)
      await seedExistingFranceTravailDocs()
      mockNdjson(EXISTING.slice(0, 7).map((siret) => ({ siret })))
      // when
      await updateHandiEngagement()
      // then : 7 < 10*0.8 → la marge n'est pas respectée, le nettoyage est ignoré : les 10 entrées
      // d'origine subsistent, y compris les 3 SIRET absents du fichier
      const remaining = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
      expect(remaining.map((d) => d.siret).sort()).toEqual([...EXISTING].sort())
    })

    it("nettoie quand le fichier gagne exactement 20% de SIRET (limite haute incluse : 12/10)", async () => {
      // given : previousFranceTravailCount = 10. Le fichier contient 9 des 10 SIRET existants (1 disparaît)
      // et 3 nouveaux SIRET, soit 12 au total (+20% pile par rapport à 10)
      await seedExistingFranceTravailDocs()
      const fileSirets = [...EXISTING.slice(0, 9), ...NEW_SIRETS.slice(0, 3)]
      mockNdjson(fileSirets.map((siret) => ({ siret })))
      // when
      await updateHandiEngagement()
      // then : 12 <= 10*1.2 → la marge est respectée, le nettoyage s'exécute : le SIRET disparu du
      // fichier est supprimé, seuls les SIRET du fichier subsistent
      const remaining = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
      expect(remaining.map((d) => d.siret).sort()).toEqual([...fileSirets].sort())
    })

    it("ne nettoie pas quand le fichier gagne plus de 20% de SIRET (juste au-dessus de la limite haute : 13/10)", async () => {
      // given : previousFranceTravailCount = 10. Le fichier contient 9 des 10 SIRET existants (1 disparaît)
      // et 4 nouveaux SIRET, soit 13 au total (+30% par rapport à 10)
      await seedExistingFranceTravailDocs()
      const missingSiret = EXISTING[9]
      const fileSirets = [...EXISTING.slice(0, 9), ...NEW_SIRETS]
      mockNdjson(fileSirets.map((siret) => ({ siret })))
      // when
      await updateHandiEngagement()
      // then : 13 > 10*1.2 → la marge n'est pas respectée, le nettoyage est ignoré : le SIRET disparu du
      // fichier conserve tout de même sa source FRANCE_TRAVAIL
      const missingDoc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: missingSiret })
      expect(missingDoc?.sources).toEqual([EntrepriseEngagementSources.FRANCE_TRAVAIL])
    })
  })
})
