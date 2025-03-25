import dayjs from "dayjs"
import { generateRoleManagementFixture } from "shared/fixtures/roleManagement.fixture"
import { AccessStatus, IRoleManagement } from "shared/models/index"
import { describe, expect, it } from "vitest"

import { roleManagementEventFactory } from "@tests/utils/user.test.utils"

import { isGrantedAndAutoValidatedRole } from "./roleManagement.service"

const roleWithEventsFactory = (events: IRoleManagement["status"]) => {
  return generateRoleManagementFixture({
    status: events,
  })
}

const creationDate = new Date("2025-01-23T15:30:20.975+00:00")

describe("roleManagement.service", () => {
  describe("isGrantedAndAutoValidatedRole", () => {
    it("should return true if role is validated fastly", () => {
      expect(
        isGrantedAndAutoValidatedRole(
          roleWithEventsFactory([
            roleManagementEventFactory({
              status: AccessStatus.AWAITING_VALIDATION,
              date: creationDate,
            }),
            roleManagementEventFactory({
              status: AccessStatus.GRANTED,
              date: dayjs(creationDate).add(500, "ms").toDate(),
            }),
          ])
        )
      ).toEqual(true)
    })
    it("should return true if role is only granted", () => {
      expect(
        isGrantedAndAutoValidatedRole(
          roleWithEventsFactory([
            roleManagementEventFactory({
              status: AccessStatus.GRANTED,
            }),
          ])
        )
      ).toEqual(true)
    })
    it("should return false if role is not granted", () => {
      expect(
        isGrantedAndAutoValidatedRole(
          roleWithEventsFactory([
            roleManagementEventFactory({
              status: AccessStatus.AWAITING_VALIDATION,
            }),
            roleManagementEventFactory({
              status: AccessStatus.GRANTED,
            }),
            roleManagementEventFactory({
              status: AccessStatus.DENIED,
            }),
          ])
        )
      ).toEqual(false)
    })
    it("should return false if role is granted in a slow manner", () => {
      expect(
        isGrantedAndAutoValidatedRole(
          roleWithEventsFactory([
            roleManagementEventFactory({
              status: AccessStatus.AWAITING_VALIDATION,
              date: creationDate,
            }),
            roleManagementEventFactory({
              status: AccessStatus.GRANTED,
              date: dayjs(creationDate).add(1, "hour").toDate(),
            }),
          ])
        )
      ).toEqual(false)
    })
  })
})
