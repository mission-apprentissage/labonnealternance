import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateRoleManagementFixture, generateRoleManagementStatusEventFixture } from "shared/fixtures/roleManagement.fixture"
import { AccessStatus } from "shared/models/roleManagement.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { hasActiveRoleOnAnotherOrganization } from "./userWithAccount.service"

useMongo()

describe("userWithAccount.service", () => {
  describe("hasActiveRoleOnAnotherOrganization", () => {
    const userId = new ObjectId()
    const organizationId = "org-A"

    beforeEach(async () => {
      await getDbCollection("rolemanagements").deleteMany({})
    })

    const seedRole = async (props: Parameters<typeof generateRoleManagementFixture>[0]) => {
      await getDbCollection("rolemanagements").insertOne(generateRoleManagementFixture(props))
    }

    it("retourne true si un rôle GRANTED existe sur une autre organisation", async () => {
      await seedRole({
        user_id: userId,
        authorized_id: "org-B",
        status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.GRANTED })],
      })
      expect(await hasActiveRoleOnAnotherOrganization(userId, organizationId)).toBe(true)
    })

    it("retourne false si le seul rôle GRANTED est sur la même organisation", async () => {
      await seedRole({
        user_id: userId,
        authorized_id: organizationId,
        status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.GRANTED })],
      })
      expect(await hasActiveRoleOnAnotherOrganization(userId, organizationId)).toBe(false)
    })

    it("retourne false si le rôle sur une autre organisation est DENIED", async () => {
      await seedRole({
        user_id: userId,
        authorized_id: "org-B",
        status: [
          generateRoleManagementStatusEventFixture({ status: AccessStatus.GRANTED }),
          generateRoleManagementStatusEventFixture({ status: AccessStatus.DENIED, validation_type: VALIDATION_UTILISATEUR.MANUAL, date: new Date(Date.now() + 1000) }),
        ],
      })
      expect(await hasActiveRoleOnAnotherOrganization(userId, organizationId)).toBe(false)
    })

    it("retourne false si le rôle sur une autre organisation est AWAITING_VALIDATION", async () => {
      await seedRole({
        user_id: userId,
        authorized_id: "org-B",
        status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.AWAITING_VALIDATION })],
      })
      expect(await hasActiveRoleOnAnotherOrganization(userId, organizationId)).toBe(false)
    })

    it("retourne false si l'utilisateur n'a aucun rôle", async () => {
      expect(await hasActiveRoleOnAnotherOrganization(userId, organizationId)).toBe(false)
    })

    it("ignore les rôles GRANTED appartenant à un autre utilisateur", async () => {
      await seedRole({
        user_id: new ObjectId(),
        authorized_id: "org-B",
        status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.GRANTED })],
      })
      expect(await hasActiveRoleOnAnotherOrganization(userId, organizationId)).toBe(false)
    })
  })
})
