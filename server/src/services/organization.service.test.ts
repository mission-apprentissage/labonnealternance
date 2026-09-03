import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { AccessEntityType } from "shared/models/role-management.model"
import { describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import * as sentryUtils from "@/common/utils/sentry-utils"
import { applyPendingHandiEngagementIfGranted, updateEntrepriseHandiEngagement } from "./organization.service"

const SIRET = "42476141900045"

useMongo()

describe("updateEntrepriseHandiEngagement", () => {
  it('alimente referentiel_engagement_entreprise (source lba) quand le choix est "oui", sans toucher à entreprises', async () => {
    await updateEntrepriseHandiEngagement(SIRET, "oui")

    const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET })
    expect(referentiel?.sources).toEqual([EntrepriseEngagementSources.LBA])
    expect(referentiel?.engagement).toBe("handicap")

    // aucune entreprise n'a été créée ni modifiée : ce référentiel est la seule source de vérité
    expect(await getDbCollection("entreprises").countDocuments({ siret: SIRET })).toBe(0)
  })

  it('n\'écrit rien (ni entreprises, ni referentiel_engagement_entreprise) quand le choix est "non"', async () => {
    await updateEntrepriseHandiEngagement(SIRET, "non")

    expect(await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET })).toBeNull()
    expect(await getDbCollection("entreprises").countDocuments({ siret: SIRET })).toBe(0)
  })

  it('ne duplique pas la source lba si le choix "oui" est enregistré plusieurs fois', async () => {
    await updateEntrepriseHandiEngagement(SIRET, "oui")
    await updateEntrepriseHandiEngagement(SIRET, "oui")

    const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET })
    expect(referentiel?.sources).toEqual([EntrepriseEngagementSources.LBA])
  })

  it("préserve une source déjà présente (ex: france-travail) en ajoutant lba à côté", async () => {
    const now = new Date()
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: SIRET,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
      created_at: now,
      updated_at: now,
    })

    await updateEntrepriseHandiEngagement(SIRET, "oui")

    const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET })
    expect(referentiel?.sources).toEqual(expect.arrayContaining([EntrepriseEngagementSources.FRANCE_TRAVAIL, EntrepriseEngagementSources.LBA]))
    expect(referentiel?.sources).toHaveLength(2)
  })
})

describe("applyPendingHandiEngagementIfGranted", () => {
  it('alimente referentiel_engagement_entreprise quand le rôle ENTREPRISE porte handiEngagement "oui"', async () => {
    const entreprise = generateEntrepriseFixture({ siret: SIRET })
    await getDbCollection("entreprises").insertOne(entreprise)

    await applyPendingHandiEngagementIfGranted({ authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE, handiEngagement: "oui" })

    const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET })
    expect(referentiel?.sources).toEqual([EntrepriseEngagementSources.LBA])
  })

  it('n\'écrit rien quand handiEngagement vaut "non"', async () => {
    const entreprise = generateEntrepriseFixture({ siret: SIRET })
    await getDbCollection("entreprises").insertOne(entreprise)

    await applyPendingHandiEngagementIfGranted({ authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE, handiEngagement: "non" })

    expect(await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET })).toBeNull()
  })

  it("n'écrit rien quand handiEngagement n'a jamais été déclaré (undefined/null)", async () => {
    const entreprise = generateEntrepriseFixture({ siret: SIRET })
    await getDbCollection("entreprises").insertOne(entreprise)

    await applyPendingHandiEngagementIfGranted({ authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE, handiEngagement: null })

    expect(await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET })).toBeNull()
  })

  it("n'écrit rien pour un rôle non-ENTREPRISE, même avec handiEngagement à oui", async () => {
    const entreprise = generateEntrepriseFixture({ siret: SIRET })
    await getDbCollection("entreprises").insertOne(entreprise)

    await applyPendingHandiEngagementIfGranted({ authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.CFA, handiEngagement: "oui" })

    expect(await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: SIRET })).toBeNull()
  })

  it("ne plante pas, n'écrit rien, mais capture l'anomalie si l'entreprise référencée par authorized_id n'existe pas (near-miss)", async () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: test
    const sentrySpy = vi.spyOn(sentryUtils, "sentryCaptureException").mockImplementation(() => {})

    await applyPendingHandiEngagementIfGranted({ authorized_id: new ObjectId().toString(), authorized_type: AccessEntityType.ENTREPRISE, handiEngagement: "oui" })

    expect(await getDbCollection("referentiel_engagement_entreprise").countDocuments({})).toBe(0)
    expect(sentrySpy).toHaveBeenCalledTimes(1)
  })
})
