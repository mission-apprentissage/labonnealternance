import { generateRoleManagementFixture } from "shared/fixtures/roleManagement.fixture"
import type { IRoleManagement } from "shared/models/index"
import { AccessStatus } from "shared/models/index"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { describe, expect, it } from "vitest"

import { isGrantedAndAutoValidatedRole } from "./roleManagement.service"
import { roleManagementEventFactory } from "@tests/utils/user.test.utils"

const roleWithEventsFactory = (events: IRoleManagement["status"]) => {
  return generateRoleManagementFixture({
    status: events,
  })
}

describe("roleManagement.service", () => {
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
})
