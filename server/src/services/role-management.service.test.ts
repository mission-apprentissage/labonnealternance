import { useMongo } from "@tests/utils/mongo.test.utils"
import { roleManagementEventFactory, saveEntreprise } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateRoleManagementFixture } from "shared/fixtures/role-management.fixture"
import type { IRoleManagement } from "shared/models/index"
import { AccessEntityType, AccessStatus } from "shared/models/index"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import * as organizationServiceModule from "./organization.service"
import { isGrantedAndAutoValidatedRole, modifyPermissionToUser } from "./role-management.service"

vi.mock("./organization.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./organization.service")>()
  return { ...actual, applyPendingHandiEngagementIfGranted: vi.fn(actual.applyPendingHandiEngagementIfGranted) }
})

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

    beforeEach(() => {
      vi.mocked(organizationServiceModule.applyPendingHandiEngagementIfGranted).mockClear()
    })

    it("applique handiEngagement au référentiel dès la création directe d'un rôle GRANTED (branche insert)", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })

      await modifyPermissionToUser(
        { user_id: new ObjectId(), authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE, handiEngagement: "oui" },
        { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création par clef API" }
      )

      expect.soft(organizationServiceModule.applyPendingHandiEngagementIfGranted).toHaveBeenCalledTimes(1)
      const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })
      expect.soft(referentiel?.sources).toEqual([EntrepriseEngagementSources.LBA])
    })

    it("n'applique rien tant qu'un rôle existant reste AWAITING_VALIDATION, puis applique au passage réel à GRANTED (branche update)", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })
      const userId = new ObjectId()

      await modifyPermissionToUser(
        { user_id: userId, authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE, handiEngagement: "oui" },
        { status: AccessStatus.AWAITING_VALIDATION, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création de compte" }
      )
      expect.soft(organizationServiceModule.applyPendingHandiEngagementIfGranted).not.toHaveBeenCalled()
      expect.soft(await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })).toBeNull()

      await modifyPermissionToUser(
        { user_id: userId, authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE },
        { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.MANUAL, reason: "validation admin" }
      )

      expect.soft(organizationServiceModule.applyPendingHandiEngagementIfGranted).toHaveBeenCalledTimes(1)
      const referentiel = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })
      expect.soft(referentiel?.sources).toEqual([EntrepriseEngagementSources.LBA])
    })

    it("ne réapplique rien sur une réaffirmation no-op du même statut GRANTED", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })
      const userId = new ObjectId()
      const roleProps = { user_id: userId, authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE }

      await modifyPermissionToUser({ ...roleProps, handiEngagement: "oui" }, { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création" })
      expect.soft(organizationServiceModule.applyPendingHandiEngagementIfGranted).toHaveBeenCalledTimes(1)

      await modifyPermissionToUser(roleProps, { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.MANUAL, reason: "reconfirmation" })

      // toujours 1 : le early-return sur statut inchangé (lastEvent === eventProps.status) empêche tout
      // second appel, il ne doit donc pas y avoir de second write vers le référentiel.
      expect.soft(organizationServiceModule.applyPendingHandiEngagementIfGranted).toHaveBeenCalledTimes(1)
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

      expect.soft(organizationServiceModule.applyPendingHandiEngagementIfGranted).not.toHaveBeenCalled()
      expect.soft(await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: "42476141900045" })).toBeNull()
    })

    it("n'écrit rien dans le référentiel quand handiEngagement n'a pas été déclaré sur le rôle, même une fois GRANTED", async () => {
      const entreprise = await saveEntreprise({ siret: "42476141900045" })

      await modifyPermissionToUser(
        { user_id: new ObjectId(), authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE },
        { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création" }
      )

      // le hook est bien invoqué à chaque passage GRANTED (comportement générique, indépendant du type
      // d'entité) : c'est applyPendingHandiEngagementIfGranted elle-même qui no-op sans handiEngagement.
      expect.soft(organizationServiceModule.applyPendingHandiEngagementIfGranted).toHaveBeenCalledTimes(1)
      expect.soft(await getDbCollection("referentiel_engagement_entreprise").countDocuments({})).toBe(0)
    })

    it("n'écrit rien dans le référentiel pour un rôle CFA, même avec handiEngagement à oui", async () => {
      await modifyPermissionToUser(
        { user_id: new ObjectId(), authorized_id: new ObjectId().toString(), authorized_type: AccessEntityType.CFA, handiEngagement: "oui" },
        { status: AccessStatus.GRANTED, validation_type: VALIDATION_UTILISATEUR.AUTO, reason: "création" }
      )

      expect.soft(organizationServiceModule.applyPendingHandiEngagementIfGranted).toHaveBeenCalledTimes(1)
      expect.soft(await getDbCollection("referentiel_engagement_entreprise").countDocuments({})).toBe(0)
    })
  })
})
