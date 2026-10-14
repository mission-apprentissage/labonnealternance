import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveEntreprise, saveUserWithAccount } from "@tests/utils/user.test.utils"
import nock from "nock"
import { ENTREPRISE, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateRoleManagementFixture, generateRoleManagementStatusEventFixture } from "shared/fixtures/role-management.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IRoleManagement } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import config from "@/config"
import { autoValidateUserRoleOnCompany } from "@/services/etablissement.service"
import type { IWindowStats } from "./auto-validation-rate-alert"
import {
  autoValidationRateAlert,
  classifyRole,
  computeWindowStats,
  evaluateAutoValidation,
  getRolesWindowFilter,
  replayAutoValidationRateAlert,
} from "./auto-validation-rate-alert"

vi.mock("@/common/utils/slack-utils")
vi.mock("@/common/utils/sentry-utils")

const DAY_MS = 24 * 60 * 60 * 1000
const thresholds = { minVolume: 30, dropThresholdPoints: 10, indeterminateThresholdPercent: 5 }

const event = (status: AccessStatus, reason: string, validation_type = VALIDATION_UTILISATEUR.AUTO) => generateRoleManagementStatusEventFixture({ status, reason, validation_type })

const creation = event(AccessStatus.AWAITING_VALIDATION, "création de compte")

const stats = (counts: Partial<IWindowStats>): IWindowStats => ({ auto: 0, refused: 0, indeterminate: 0, excluded: 0, breakdown: {}, ...counts })

describe("classifyRole", () => {
  it.each([
    ["validation par : recruteurs LBA (correspondance : email)", "recruteurs LBA"],
    ["validaton par : bonnes boites ou referentiel opco", "recruteurs LBA (ancienne raison)"],
    ["validation par : BAL (sources : akto ; correspondance : email)", "BAL (akto)"],
    ["validation par : BAL (sources : catalogue, deca ; correspondance : domaine)", "BAL (catalogue, deca)"],
    ["validaton par : BAL", "BAL (ancienne raison)"],
    ["l'email correspond à un contact", "contact CFA"],
    ["le nom de domaine de l'email correspond à celui d'un contact", "contact CFA"],
  ])("classe « %s » en auto-validation", (reason, category) => {
    expect(classifyRole([creation, event(AccessStatus.GRANTED, reason)])).toEqual({ outcome: "auto", category })
  })

  it("exclut une création par clé API, qui ne passe par aucune validation", () => {
    expect(classifyRole([creation, event(AccessStatus.GRANTED, "création par clef API")])).toEqual({ outcome: "excluded", category: "création par clé API" })
  })

  it("compte comme refus un rôle accordé ensuite à la main", () => {
    const events = [
      creation,
      event(AccessStatus.AWAITING_VALIDATION, "pas de validation automatique possible"),
      event(AccessStatus.GRANTED, "validé", VALIDATION_UTILISATEUR.MANUAL),
    ]
    expect(classifyRole(events)).toEqual({ outcome: "refused", category: "refus ou validation manuelle" })
  })

  it("distingue un résultat indéterminé d'un refus", () => {
    const events = [creation, event(AccessStatus.AWAITING_VALIDATION, "validation automatique indéterminée : akto, opco_ep indisponibles")]
    expect(classifyRole(events)).toEqual({ outcome: "indeterminate", category: "indéterminé (akto, opco_ep indisponibles)" })
  })

  it("retient l'auto-validation quand un rôle indéterminé est revalidé automatiquement", () => {
    const events = [
      creation,
      event(AccessStatus.AWAITING_VALIDATION, "validation automatique indéterminée : BAL indisponible"),
      event(AccessStatus.GRANTED, "validation par : BAL (sources : akto ; correspondance : email)"),
    ]
    expect(classifyRole(events).outcome).toBe("auto")
  })
})

describe("evaluateAutoValidation", () => {
  it("ne déclenche pas sous le volume minimum, même sur une forte chute", () => {
    const evaluation = evaluateAutoValidation(stats({ auto: 2, refused: 18 }), stats({ auto: 18, refused: 2 }), thresholds)
    expect(evaluation).toMatchObject({ rateDrop: false, indeterminateSpike: false })
  })

  it("ne déclenche pas sur une baisse inférieure au seuil", () => {
    expect(evaluateAutoValidation(stats({ auto: 71, refused: 29 }), stats({ auto: 80, refused: 20 }), thresholds).rateDrop).toBe(false)
  })

  // 0,6 − 0,5 vaut 0,0999… en virgule flottante : une chute de 10 points pile doit quand même déclencher.
  it("déclenche à partir du seuil de chute, frontière comprise", () => {
    const evaluation = evaluateAutoValidation(stats({ auto: 50, refused: 50 }), stats({ auto: 60, refused: 40 }), thresholds)
    expect(evaluation).toMatchObject({ rateDrop: true, dropPoints: 10, recentRate: 0.5, baselineRate: 0.6 })
  })

  it("sort les indéterminés du taux et les signale à part", () => {
    const evaluation = evaluateAutoValidation(stats({ auto: 80, refused: 20, indeterminate: 30 }), stats({ auto: 80, refused: 20 }), thresholds)
    expect(evaluation).toMatchObject({ rateDrop: false, indeterminateSpike: true, recentRate: 0.8 })
  })

  it("ne signale pas les indéterminés sous le volume minimum", () => {
    expect(evaluateAutoValidation(stats({ auto: 10, refused: 5, indeterminate: 5 }), stats({ auto: 80, refused: 20 }), thresholds).indeterminateSpike).toBe(false)
  })
})

describe("autoValidationRateAlert", () => {
  useMongo()

  const asOf = new Date("2026-10-09T07:00:00Z")
  const daysAgo = (days: number) => new Date(asOf.getTime() - days * DAY_MS)

  const insertRoles = async (count: number, createdAt: Date, reason: string, status = AccessStatus.GRANTED, authorized_type = AccessEntityType.ENTREPRISE) => {
    const roles: IRoleManagement[] = Array.from({ length: count }, () =>
      generateRoleManagementFixture({ authorized_type, createdAt, updatedAt: createdAt, status: [creation, event(status, reason)] })
    )
    if (roles.length) await getDbCollection("rolemanagements").insertMany(roles)
  }

  const seed = async ({ recentAuto, recentRefused, baselineAuto, baselineRefused }: Record<string, number>) => {
    await insertRoles(recentAuto, daysAgo(2), "validation par : BAL (sources : akto ; correspondance : email)")
    await insertRoles(recentRefused, daysAgo(3), "pas de validation automatique possible", AccessStatus.AWAITING_VALIDATION)
    await insertRoles(baselineAuto, daysAgo(15), "validation par : BAL (sources : akto ; correspondance : email)")
    await insertRoles(baselineRefused, daysAgo(20), "pas de validation automatique possible", AccessStatus.AWAITING_VALIDATION)
  }

  beforeEach(() => {
    vi.mocked(notifyToSlack).mockClear()
  })

  it("n'alerte pas quand le taux est stable", async () => {
    await seed({ recentAuto: 32, recentRefused: 8, baselineAuto: 80, baselineRefused: 20 })

    await autoValidationRateAlert({ asOf })

    expect(notifyToSlack).not.toHaveBeenCalled()
  })

  it("alerte sur une chute, avec les taux, les volumes et la répartition, sans donnée de compte", async () => {
    await seed({ recentAuto: 20, recentRefused: 20, baselineAuto: 80, baselineRefused: 20 })
    await insertRoles(5, daysAgo(1), "création par clef API")
    await insertRoles(50, daysAgo(40), "pas de validation automatique possible", AccessStatus.AWAITING_VALIDATION)
    await insertRoles(50, daysAgo(1), "pas de validation automatique possible", AccessStatus.AWAITING_VALIDATION, AccessEntityType.OPCO)

    await autoValidationRateAlert({ asOf })

    expect(notifyToSlack).toHaveBeenCalledTimes(1)
    const { message } = vi.mocked(notifyToSlack).mock.calls[0]?.[0] ?? { message: "" }
    expect(message).toContain("50 % sur les 7 derniers jours (40 rôles), contre 80 % sur les 28 jours précédents (100 rôles), soit 30 points de moins")
    expect(message).toContain("Répartition sur 7 jours : BAL (akto) 20 · refus ou validation manuelle 20 · création par clé API 5")
    expect(message).not.toContain("@")
  })

  it("rejoue les jours passés sans notifier", async () => {
    await seed({ recentAuto: 20, recentRefused: 20, baselineAuto: 80, baselineRefused: 20 })

    const days = await replayAutoValidationRateAlert({ from: daysAgo(30).toISOString().slice(0, 10), to: asOf.toISOString().slice(0, 10) })

    expect(notifyToSlack).not.toHaveBeenCalled()
    expect(days.at(-1)).toMatchObject({ rateDrop: true })
    expect(days.at(0)).toMatchObject({ rateDrop: false })
  })

  it("lit la fenêtre par l'index { authorized_type, createdAt }", async () => {
    const explain = await getDbCollection("rolemanagements")
      .find(getRolesWindowFilter(daysAgo(35), asOf))
      .explain()
    const plan = JSON.stringify(explain.queryPlanner.winningPlan)

    expect(plan).toContain("authorized_type_1_createdAt_1")
    expect(plan).not.toContain("COLLSCAN")
  })
})

describe("classement des raisons écrites par la validation automatique", () => {
  useMongo()

  const siret = "42476141900045"
  const email = "contact@entreprise.exemple.fr"
  const balUrl = new URL(config.bal.baseUrl)
  const mockBal = () => nock(balUrl.origin).post(`${balUrl.pathname.replace(/\/$/, "")}/organisation/validation`)

  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  const validateAndClassify = async () => {
    const entreprise = await saveEntreprise({ siret })
    const user = await saveUserWithAccount({ email })
    await autoValidateUserRoleOnCompany({ user, organization: { type: ENTREPRISE, entreprise } })
    const role = await getDbCollection("rolemanagements").findOne({ user_id: user._id })
    return computeWindowStats(role ? [role] : []).breakdown
  }

  it("reconnaît une validation par les recruteurs LBA", async () => {
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, workplace_siret: siret, apply_email: email })
    )
    expect(await validateAndClassify()).toEqual({ "recruteurs LBA": 1 })
  })

  it.each([
    [{ status: "valid", is_valid: true, on: "email", sources: ["akto"] }, 200, { "BAL (akto)": 1 }],
    [{ status: "invalid", is_valid: false, is_company_email: true }, 200, { "refus ou validation manuelle": 1 }],
    [{ status: "indeterminate", is_valid: false, is_company_email: true, unavailable_sources: ["opco_ep"] }, 200, { "indéterminé (opco_ep indisponible)": 1 }],
    [{}, 503, { "indéterminé (BAL indisponible)": 1 }],
  ])("reconnaît la raison écrite pour la réponse BAL %j (HTTP %i)", async (body, httpStatus, expected) => {
    mockBal().reply(httpStatus, body)
    expect(await validateAndClassify()).toEqual(expected)
  })
})
