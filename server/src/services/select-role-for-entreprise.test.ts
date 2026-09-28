import { ObjectId } from "mongodb"
import { AccessEntityType } from "shared"
import { generateRoleManagementFixture } from "shared/fixtures/role-management.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

const loggerWarn = vi.fn()

// logger est un Proxy sans propriété propre : vi.spyOn ne peut pas s'y accrocher.
vi.mock("@/common/logger", async (importOriginal) => {
  const mod = await importOriginal<{ logger: Record<string, unknown> }>()
  return { ...mod, logger: { ...mod.logger, warn: loggerWarn, info: vi.fn(), error: vi.fn() } }
})

const { selectRoleForEntreprise } = await import("./formulaire.service")

describe("selectRoleForEntreprise", () => {
  const userId = new ObjectId()
  const siret = "12345678900012"
  const entreprise = { _id: new ObjectId() }
  const autreEntrepriseId = new ObjectId().toString()
  const role = (authorized_type: AccessEntityType, authorized_id: string) => generateRoleManagementFixture({ user_id: userId, authorized_type, authorized_id })

  beforeEach(() => {
    loggerWarn.mockReset()
  })

  it("should pick the role on the siret's company over a role on another company found first", () => {
    const roleAutreEntreprise = role(AccessEntityType.ENTREPRISE, autreEntrepriseId)
    const roleEntreprise = role(AccessEntityType.ENTREPRISE, entreprise._id.toString())
    expect(selectRoleForEntreprise([roleAutreEntreprise, roleEntreprise], entreprise, { userId, siret })).toBe(roleEntreprise)
    expect(loggerWarn).not.toHaveBeenCalled()
  })

  it("should pick the company role over a CFA role", () => {
    const roleCfa = role(AccessEntityType.CFA, new ObjectId().toString())
    const roleEntreprise = role(AccessEntityType.ENTREPRISE, entreprise._id.toString())
    expect(selectRoleForEntreprise([roleCfa, roleEntreprise], entreprise, { userId, siret })).toBe(roleEntreprise)
  })

  it("should pick the CFA role for a delegated offer, without a role on the company", () => {
    const roleCfa = role(AccessEntityType.CFA, new ObjectId().toString())
    expect(selectRoleForEntreprise([roleCfa], entreprise, { userId, siret })).toBe(roleCfa)
    expect(loggerWarn).not.toHaveBeenCalled()
  })

  it("should fall back to the first role, and log it, when no role matches the siret", () => {
    const roleAutreEntreprise = role(AccessEntityType.ENTREPRISE, autreEntrepriseId)
    expect(selectRoleForEntreprise([roleAutreEntreprise], entreprise, { userId, siret })).toBe(roleAutreEntreprise)
    expect(loggerWarn).toHaveBeenCalledOnce()
  })

  it("should return null without roles", () => {
    expect(selectRoleForEntreprise([], entreprise, { userId, siret })).toBe(null)
    expect(loggerWarn).not.toHaveBeenCalled()
  })
})
