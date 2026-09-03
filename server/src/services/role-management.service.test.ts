import { useMongo } from "@tests/utils/mongo.test.utils"
import { roleManagementEventFactory, saveEntreprise } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateRoleManagementFixture } from "shared/fixtures/role-management.fixture"
import type { IRoleManagement } from "shared/models/index"
import { AccessEntityType, AccessStatus } from "shared/models/index"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { isGrantedAndAutoValidatedRole, modifyPermissionToUser } from "./role-management.service"

const roleWithEventsFactory = (events: IRoleManagement["status"]) => {
  return generateRoleManagementFixture({
    status: events,
  })
}

describe("role-management.service", () => {
  describe("isGrantedAndAutoValidatedRole", () => {
    it("should return true if role is auto-validated (AWAITING then GRANTED with AUTO)", () => {
      expect(
        isGrantedAndAutoValidatedRole(
          roleWithEventsFactory([
            roleManagementEventFactory({
              status: AccessStatus.AWAITING_VALIDATION,
              validation_type: VALIDATION_UTILISATEUR.AUTO,
            }),
            roleManagementEventFactory({
              status: AccessStatus.GRANTED,
              validation_type: VALIDATION_UTILISATEUR.AUTO,
            }),
          ])
        )
      ).toEqual(true)
    })
    it("should return true if role is only granted with AUTO validation", () => {
      expect(
        isGrantedAndAutoValidatedRole(
          roleWithEventsFactory([
            roleManagementEventFactory({
              status: AccessStatus.GRANTED,
              validation_type: VALIDATION_UTILISATEUR.AUTO,
            }),
          ])
        )
      ).toEqual(true)
    })
    it("should return false if last status is not granted", () => {
      expect(
        isGrantedAndAutoValidatedRole(
          roleWithEventsFactory([
            roleManagementEventFactory({
              status: AccessStatus.AWAITING_VALIDATION,
            }),
            roleManagementEventFactory({
              status: AccessStatus.GRANTED,
              validation_type: VALIDATION_UTILISATEUR.AUTO,
            }),
            roleManagementEventFactory({
              status: AccessStatus.DENIED,
              validation_type: VALIDATION_UTILISATEUR.MANUAL,
            }),
          ])
        )
      ).toEqual(false)
    })
    it("should return false if role is granted manually", () => {
      expect(
        isGrantedAndAutoValidatedRole(
          roleWithEventsFactory([
            roleManagementEventFactory({
              status: AccessStatus.AWAITING_VALIDATION,
              validation_type: VALIDATION_UTILISATEUR.AUTO,
            }),
            roleManagementEventFactory({
              status: AccessStatus.GRANTED,
              validation_type: VALIDATION_UTILISATEUR.MANUAL,
            }),
          ])
        )
      ).toEqual(false)
    })
  })

  describe("modifyPermissionToUser", () => {
    useMongo()

    // Vérifié sur l'état DB (referentiel_engagement_entreprise), pas sur un spy de
    // applyPendingHandiEngagementIfGranted : en présence du cycle d'imports
    // role-management.service.ts → organization.service.ts → etablissement.service.ts →
    // role-management.service.ts, un vi.mock("./organization.service") côté test n'est pas garanti
    // d'être la même instance de module que celle liée par role-management.service.ts au chargement
    // (observé : le mock reste à 0 appel alors que l'écriture réelle a bien lieu). L'état DB est
    // la source de vérité, indépendante de cette subtilité de résolution de module.

    it("applique handiEngagement au référentiel dès la création directe d'un rôle GRANTED (branche insert)", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })

      await modifyPermissionToUser(
        { user_id: new ObjectId(), authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE, handiEngagement: "oui" },
        { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création par clef API" }
      )

      const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })
      expect(referentiel?.sources).toEqual([EntrepriseEngagementSources.LBA])
    })

    it("n'applique rien tant qu'un rôle existant reste AWAITING_VALIDATION, puis applique au passage réel à GRANTED (branche update)", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })
      const userId = new ObjectId()

      await modifyPermissionToUser(
        { user_id: userId, authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE, handiEngagement: "oui" },
        { status: AccessStatus.AWAITING_VALIDATION, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création de compte" }
      )
      expect.soft(await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })).toBeNull()

      await modifyPermissionToUser(
        { user_id: userId, authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE },
        { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.MANUAL, reason: "validation admin" }
      )

      const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })
      expect.soft(referentiel?.sources).toEqual([EntrepriseEngagementSources.LBA])
    })

    it("ne réapplique rien sur une réaffirmation no-op du même statut GRANTED", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })
      const userId = new ObjectId()
      const roleProps = { user_id: userId, authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE }

      await modifyPermissionToUser({ ...roleProps, handiEngagement: "oui" }, { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création" })
      const afterFirstGrant = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })

      await modifyPermissionToUser(roleProps, { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.MANUAL, reason: "reconfirmation" })
      const afterReaffirmation = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })

      // updated_at inchangé : le early-return sur statut inchangé (lastEvent === eventProps.status)
      // empêche tout second appel au hook, donc tout second $set du référentiel.
      expect.soft(afterReaffirmation?.updated_at).toEqual(afterFirstGrant?.updated_at)
    })

    it("n'applique rien quand le rôle transitionne vers un statut autre que GRANTED", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })
      const userId = new ObjectId()
      const roleProps = { user_id: userId, authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE }

      await modifyPermissionToUser(
        { ...roleProps, handiEngagement: "oui" },
        { status: AccessStatus.AWAITING_VALIDATION, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création" }
      )
      await modifyPermissionToUser(roleProps, { status: AccessStatus.DENIED, validation_type: VALIDATION_UTILISATEUR.MANUAL, reason: "refus" })

      expect.soft(await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })).toBeNull()
    })

    it("n'écrit rien dans le référentiel quand handiEngagement n'a pas été déclaré sur le rôle, même une fois GRANTED", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })

      await modifyPermissionToUser(
        { user_id: new ObjectId(), authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE },
        { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création" }
      )

      expect.soft(await getDbCollection("referentiel_engagement_entreprise").countDocuments({})).toBe(0)
    })

    it("n'écrit rien dans le référentiel pour un rôle CFA, même avec handiEngagement à oui", async () => {
      await modifyPermissionToUser(
        { user_id: new ObjectId(), authorized_id: new ObjectId().toString(), authorized_type: AccessEntityType.CFA, handiEngagement: "oui" },
        { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création" }
      )

      expect.soft(await getDbCollection("referentiel_engagement_entreprise").countDocuments({})).toBe(0)
    })
  })
})
