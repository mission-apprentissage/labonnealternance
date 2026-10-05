import { ObjectId } from "mongodb"
import { AccessEntityType } from "shared"
import { generateRoleManagementFixture } from "shared/fixtures/role-management.fixture"
import { describe, expect, it, vi } from "vitest"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { selectRoleForEntreprise } from "./formulaire.service"

vi.mock("@/common/utils/sentry-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/utils/sentry-utils")>()),
  sentryCaptureException: vi.fn(),
}))

describe("selectRoleForEntreprise", () => {
  const userId = new ObjectId()
  const siret = "12345678900012"
  const entreprise = { _id: new ObjectId() }
  const autreEntrepriseId = new ObjectId().toString()
  const role = (authorized_type: AccessEntityType, authorized_id: string) => generateRoleManagementFixture({ user_id: userId, authorized_type, authorized_id })

  it("should pick the role on the siret's company over a role on another company found first", () => {
    const roleAutreEntreprise = role(AccessEntityType.ENTREPRISE, autreEntrepriseId)
    const roleEntreprise = role(AccessEntityType.ENTREPRISE, entreprise._id.toString())
    expect(selectRoleForEntreprise([roleAutreEntreprise, roleEntreprise], entreprise, { userId, siret })).toBe(roleEntreprise)
    expect(sentryCaptureException).not.toHaveBeenCalled()
  })

  it("should pick the company role over a CFA role", () => {
    const roleCfa = role(AccessEntityType.CFA, new ObjectId().toString())
    const roleEntreprise = role(AccessEntityType.ENTREPRISE, entreprise._id.toString())
    expect(selectRoleForEntreprise([roleCfa, roleEntreprise], entreprise, { userId, siret })).toBe(roleEntreprise)
  })

  it("should pick the CFA role for a delegated offer, without a role on the company", () => {
    const roleCfa = role(AccessEntityType.CFA, new ObjectId().toString())
    expect(selectRoleForEntreprise([roleCfa], entreprise, { userId, siret })).toBe(roleCfa)
    expect(sentryCaptureException).not.toHaveBeenCalled()
  })

  it("should fall back to the first role, and report it to Sentry, when no role matches the siret", () => {
    const roleAutreEntreprise = role(AccessEntityType.ENTREPRISE, autreEntrepriseId)
    expect(selectRoleForEntreprise([roleAutreEntreprise], entreprise, { userId, siret })).toBe(roleAutreEntreprise)
    expect(sentryCaptureException).toHaveBeenCalledOnce()
    expect(sentryCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ level: "warning", extra: { userId: userId.toString(), siret, authorizedId: autreEntrepriseId } })
    )
  })

  it("should return null without roles", () => {
    expect(selectRoleForEntreprise([], entreprise, { userId, siret })).toBe(null)
    expect(sentryCaptureException).not.toHaveBeenCalled()
  })
})
