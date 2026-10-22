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
import { runDetectionRules } from "@/jobs/detection/detection-engine"
import { replayDetectionRule } from "@/jobs/detection/detection-replay"
import { autoValidateUserRoleOnCompany } from "@/services/etablissement.service"
import type { IWindowStats } from "./auto-validation-rate-alert"
import {
  autoValidationBalShareRule,
  autoValidationRules,
  classifyRole,
  computeWindowStats,
  evaluateBalShare,
  evaluateIndeterminateSpike,
  evaluateRateDrop,
  getRolesWindowFilter,
} from "./auto-validation-rate-alert"

vi.mock("@/common/utils/slack-utils")
vi.mock("@/common/utils/sentry-utils")

const DAY_MS = 24 * 60 * 60 * 1000
const BAL_REASON = "validation par : BAL (sources : akto ; correspondance : email)"
const LBA_REASON = "validation par : recruteurs LBA (correspondance : email)"
const REFUSED_REASON = "pas de validation automatique possible"

const event = (status: AccessStatus, reason: string, validation_type = VALIDATION_UTILISATEUR.AUTO) => generateRoleManagementStatusEventFixture({ status, reason, validation_type })

const creation = event(AccessStatus.AWAITING_VALIDATION, "création de compte")

const stats = (counts: Partial<IWindowStats>): IWindowStats => ({
  auto: 0,
  refused: 0,
  indeterminate: 0,
  excluded: 0,
  breakdown: {},
  entrepriseDecided: 0,
  entrepriseBal: 0,
  ...counts,
})

/** `bal` validations BAL sur `decided` rôles entreprise tranchés, le reste refusé. */
const entreprise = (bal: number, decided: number) => stats({ auto: bal, refused: decided - bal, entrepriseBal: bal, entrepriseDecided: decided })

const messages = () => vi.mocked(notifyToSlack).mock.calls.map(([{ message }]) => message)

describe("classifyRole", () => {
  it.each([
    ["validation par : recruteurs LBA (correspondance : email)", "recruteurs LBA", false],
    ["validaton par : bonnes boites ou referentiel opco", "recruteurs LBA (ancienne raison)", false],
    ["validation par : BAL (sources : akto ; correspondance : email)", "BAL (akto)", true],
    ["validation par : BAL (sources : catalogue, deca ; correspondance : domaine)", "BAL (catalogue, deca)", true],
    ["validaton par : BAL", "BAL (ancienne raison)", true],
    ["l'email correspond à un contact", "contact CFA", false],
    ["le nom de domaine de l'email correspond à celui d'un contact", "contact CFA", false],
  ])("classe « %s » en auto-validation", (reason, category, bal) => {
    expect(classifyRole([creation, event(AccessStatus.GRANTED, reason)])).toEqual({ outcome: "auto", category, bal })
  })

  it("exclut une création par clé API, qui ne passe par aucune validation", () => {
    expect(classifyRole([creation, event(AccessStatus.GRANTED, "création par clef API")])).toEqual({ outcome: "excluded", category: "création par clé API", bal: false })
  })

  it("compte comme refus un rôle accordé ensuite à la main", () => {
    const events = [creation, event(AccessStatus.AWAITING_VALIDATION, REFUSED_REASON), event(AccessStatus.GRANTED, "validé", VALIDATION_UTILISATEUR.MANUAL)]
    expect(classifyRole(events)).toEqual({ outcome: "refused", category: "refus ou validation manuelle", bal: false })
  })

  it("distingue un résultat indéterminé d'un refus", () => {
    const events = [creation, event(AccessStatus.AWAITING_VALIDATION, "validation automatique indéterminée : akto, opco_ep indisponibles")]
    expect(classifyRole(events)).toEqual({ outcome: "indeterminate", category: "indéterminé (akto, opco_ep indisponibles)", bal: false })
  })

  it("retient l'auto-validation quand un rôle indéterminé est revalidé automatiquement", () => {
    const events = [creation, event(AccessStatus.AWAITING_VALIDATION, "validation automatique indéterminée : BAL indisponible"), event(AccessStatus.GRANTED, BAL_REASON)]
    expect(classifyRole(events).outcome).toBe("auto")
  })
})

describe("computeWindowStats", () => {
  it("ne compte dans la part BAL que les rôles entreprise tranchés", () => {
    const role = (reason: string, status: AccessStatus, authorized_type: AccessEntityType) => ({ authorized_type, status: [creation, event(status, reason)] })
    const result = computeWindowStats([
      role(BAL_REASON, AccessStatus.GRANTED, AccessEntityType.ENTREPRISE),
      role(LBA_REASON, AccessStatus.GRANTED, AccessEntityType.ENTREPRISE),
      role(REFUSED_REASON, AccessStatus.AWAITING_VALIDATION, AccessEntityType.ENTREPRISE),
      role("validation automatique indéterminée : BAL indisponible", AccessStatus.AWAITING_VALIDATION, AccessEntityType.ENTREPRISE),
      role("création par clef API", AccessStatus.GRANTED, AccessEntityType.ENTREPRISE),
      role("l'email correspond à un contact", AccessStatus.GRANTED, AccessEntityType.CFA),
    ])
    expect(result).toMatchObject({ entrepriseDecided: 3, entrepriseBal: 1, auto: 3, refused: 1, indeterminate: 1, excluded: 1 })
  })
})

describe("evaluateBalShare", () => {
  const thresholds = { minVolume: 50, dropRatio: 0.5 }
  const normalBaseline = entreprise(112, 280)

  it("n'alerte pas sur un jour isolé sans validation BAL, dilué dans la semaine", () => {
    expect(evaluateBalShare(entreprise(24, 70), normalBaseline, thresholds, null).alert).toBe(false)
  })

  it("n'alerte pas sous le volume minimum, même sans aucune validation BAL", () => {
    expect(evaluateBalShare(entreprise(0, 49), normalBaseline, thresholds, null).alert).toBe(false)
    expect(evaluateBalShare(entreprise(0, 50), normalBaseline, thresholds, null).alert).toBe(true)
  })

  it("n'alerte pas sur un creux saisonnier où BAL recule comme les autres sources, que le taux global signale", () => {
    const recent = stats({ auto: 50, refused: 50, entrepriseBal: 30, entrepriseDecided: 100 })
    const baseline = stats({ auto: 70, refused: 30, entrepriseBal: 40, entrepriseDecided: 100 })

    expect(evaluateBalShare(recent, baseline, thresholds, null).alert).toBe(false)
    expect(evaluateRateDrop(recent, baseline, { minVolume: 30, dropThresholdPoints: 10 }).alert).toBe(true)
  })

  it("n'alerte pas pile à la moitié de la référence", () => {
    expect(evaluateBalShare(entreprise(20, 100), entreprise(40, 100), thresholds, null).alert).toBe(false)
  })

  // cf. isBelow
  it("n'alerte pas pile au seuil quand la virgule flottante le place au-dessus", () => {
    expect(evaluateBalShare(entreprise(102, 1000), entreprise(34, 100), { minVolume: 50, dropRatio: 0.3 }, null).alert).toBe(false)
  })

  it("n'alerte pas sans part de référence", () => {
    expect(evaluateBalShare(entreprise(0, 100), entreprise(0, 100), thresholds, null).alert).toBe(false)
    expect(evaluateBalShare(entreprise(0, 100), stats({}), thresholds, null).alert).toBe(false)
  })

  it("alerte sur une panne de BAL qui répond sans valider (semaine du 08/06/2026 : 19 sur 355, contre 35 %)", () => {
    const evaluation = evaluateBalShare(entreprise(19, 355), entreprise(497, 1420), thresholds, null)
    expect(evaluation.alert).toBe(true)
    expect(evaluation.baselineShare).toBeCloseTo(0.35)
  })

  it("garde la part d'avant l'incident comme référence pendant l'alerte, quand la référence glissante l'a absorbée", () => {
    const recent = entreprise(10, 100)
    const contaminated = entreprise(8, 100)

    expect(evaluateBalShare(recent, contaminated, thresholds, null).alert).toBe(false)
    expect(evaluateBalShare(recent, contaminated, thresholds, 0.39)).toMatchObject({ alert: true, referenceShare: 0.39 })
    expect(evaluateBalShare(entreprise(36, 100), contaminated, thresholds, 0.39).alert).toBe(false)
  })

  it("reste en alerte quand le volume ne permet pas de conclure au retour de BAL", () => {
    expect(evaluateBalShare(entreprise(30, 40), normalBaseline, thresholds, 0.39).alert).toBe(true)
  })
})

describe("evaluateRateDrop", () => {
  const thresholds = { minVolume: 30, dropThresholdPoints: 10 }

  it("ne déclenche pas sous le volume minimum, même sur une forte chute", () => {
    expect(evaluateRateDrop(stats({ auto: 2, refused: 18 }), stats({ auto: 18, refused: 2 }), thresholds).alert).toBe(false)
  })

  it("ne déclenche pas sur une baisse inférieure au seuil", () => {
    expect(evaluateRateDrop(stats({ auto: 71, refused: 29 }), stats({ auto: 80, refused: 20 }), thresholds).alert).toBe(false)
  })

  // 0,6 − 0,5 vaut 0,0999… en virgule flottante : une chute de 10 points pile doit quand même déclencher.
  it("déclenche à partir du seuil de chute, frontière comprise", () => {
    expect(evaluateRateDrop(stats({ auto: 50, refused: 50 }), stats({ auto: 60, refused: 40 }), thresholds)).toMatchObject({
      alert: true,
      dropPoints: 10,
      recentRate: 0.5,
      baselineRate: 0.6,
    })
  })

  it("sort les indéterminés du taux", () => {
    expect(evaluateRateDrop(stats({ auto: 80, refused: 20, indeterminate: 30 }), stats({ auto: 80, refused: 20 }), thresholds)).toMatchObject({ alert: false, recentRate: 0.8 })
  })
})

describe("evaluateIndeterminateSpike", () => {
  const thresholds = { minVolume: 30, thresholdPercent: 5 }

  it("ne signale pas les indéterminés sous le volume minimum", () => {
    expect(evaluateIndeterminateSpike(stats({ auto: 10, refused: 5, indeterminate: 5 }), thresholds).alert).toBe(false)
  })

  it("signale les indéterminés au-delà du seuil", () => {
    expect(evaluateIndeterminateSpike(stats({ auto: 80, refused: 20, indeterminate: 30 }), thresholds).alert).toBe(true)
  })
})

describe("règles d'auto-validation dans le socle de détection", () => {
  useMongo()

  const day = (iso: string) => new Date(`${iso}T00:00:00Z`)

  const role = (createdAt: Date, reason: string, status = AccessStatus.GRANTED, authorized_type = AccessEntityType.ENTREPRISE) =>
    generateRoleManagementFixture({ authorized_type, createdAt, updatedAt: createdAt, status: [creation, event(status, reason)] })

  /** Rôles entreprise créés chaque jour de `from` à `to` : `bal` validés par BAL, `lba` par les recruteurs LBA, `refused` refusés. */
  const insertDays = async (from: string, to: string, { bal, lba, refused }: { bal: number; lba: number; refused: number }) => {
    const roles: IRoleManagement[] = []
    for (let date = day(from); date <= day(to); date = new Date(date.getTime() + DAY_MS)) {
      const createdAt = new Date(date.getTime() + DAY_MS / 2)
      roles.push(
        ...Array.from({ length: bal }, () => role(createdAt, BAL_REASON)),
        ...Array.from({ length: lba }, () => role(createdAt, LBA_REASON)),
        ...Array.from({ length: refused }, () => role(createdAt, REFUSED_REASON, AccessStatus.AWAITING_VALIDATION))
      )
    }
    await getDbCollection("rolemanagements").insertMany(roles)
  }

  const normal = { bal: 4, lba: 3, refused: 3 }
  // BAL répond sans valider : les rôles qu'il aurait validés partent en validation manuelle.
  const balDown = { bal: 0, lba: 3, refused: 7 }

  const seedBalIncident = async () => {
    await insertDays("2026-03-20", "2026-05-11", normal)
    await insertDays("2026-05-12", "2026-06-01", balDown)
    await insertDays("2026-06-02", "2026-06-30", normal)
  }

  beforeEach(() => {
    vi.mocked(notifyToSlack).mockReset()
  })

  it("rejoue une panne de BAL de trois semaines : une entrée, des rappels hebdomadaires et une sortie, pas une notification par jour", async () => {
    await seedBalIncident()

    const { lines, episodes } = await replayDetectionRule({
      rule: autoValidationBalShareRule,
      from: day("2026-05-05"),
      to: day("2026-06-21"),
      thresholds: autoValidationBalShareRule.thresholds.parse({}),
    })

    expect(episodes).toEqual([{ key: "global", opened_at: new Date("2026-05-16T05:00:00Z"), closed_at: new Date("2026-06-06T05:00:00Z"), notifications: 4 }])
    expect(lines.flatMap(({ notifications }) => notifications)).toEqual(["entree", "rappel", "rappel", "sortie"])
    expect(lines[0]).toMatchObject({
      slot: "2026-05-05T05:00:00.000Z",
      observations: { as_of: "2026-05-05", recent_entreprise_decided: 70, recent_bal: 28, baseline_entreprise_decided: 280, baseline_bal: 112, recent_share: 0.4 },
    })
    expect(notifyToSlack).not.toHaveBeenCalled()
    expect(await getDbCollection("detection_alerts").countDocuments()).toBe(0)
  })

  it("notifie la chute de la part BAL avec les volumes, puis le taux global au second constat, sans donnée de compte", async () => {
    await seedBalIncident()

    await runDetectionRules({ rules: autoValidationRules, now: new Date("2026-05-20T05:10:00Z") })
    expect(messages()).toHaveLength(1)
    expect(messages()[0]).toContain("Entrée en alerte · Part BAL des validations automatiques (gravité haute)")
    expect(messages()[0]).toContain(
      "Part des rôles entreprise tranchés validés par BAL : 0 % sur les 7 derniers jours (0 sur 70), contre 39 % sur les 28 jours précédents (108 sur 280). Seuil d'alerte : 19 %."
    )
    expect(messages()[0]).toContain("Répartition sur 7 jours : refus ou validation manuelle 49 · recruteurs LBA 21")
    expect(messages()[0]).toContain(`<${config.publicUrl}/espace-pro/administration/users|back-office des comptes>`)
    expect(messages()[0]).not.toMatch(/[^\s<]+@[^\s>]+\.[a-z]{2,}/i)

    await runDetectionRules({ rules: autoValidationRules, now: new Date("2026-05-21T05:10:00Z") })
    expect(messages()).toHaveLength(2)
    expect(messages()[1]).toContain("Entrée en alerte · Taux d'auto-validation des comptes (gravité moyenne)")
  })

  it("n'alerte sur le taux global qu'au second constat, avec les taux, les volumes et la répartition", async () => {
    const asOf = new Date("2026-10-09T05:10:00Z")
    const daysAgo = (days: number) => new Date(asOf.getTime() - days * DAY_MS)
    const insert = (count: number, createdAt: Date, reason: string, status = AccessStatus.GRANTED, authorized_type = AccessEntityType.ENTREPRISE) =>
      getDbCollection("rolemanagements").insertMany(Array.from({ length: count }, () => role(createdAt, reason, status, authorized_type)))
    await insert(20, daysAgo(2), BAL_REASON)
    await insert(20, daysAgo(3), REFUSED_REASON, AccessStatus.AWAITING_VALIDATION)
    await insert(80, daysAgo(15), BAL_REASON)
    await insert(20, daysAgo(20), REFUSED_REASON, AccessStatus.AWAITING_VALIDATION)
    await insert(5, daysAgo(1), "création par clef API")
    await insert(50, daysAgo(40), REFUSED_REASON, AccessStatus.AWAITING_VALIDATION)
    await insert(50, daysAgo(1), REFUSED_REASON, AccessStatus.AWAITING_VALIDATION, AccessEntityType.OPCO)

    await runDetectionRules({ rules: autoValidationRules, now: asOf })
    expect(notifyToSlack).not.toHaveBeenCalled()

    await runDetectionRules({ rules: autoValidationRules, now: new Date(asOf.getTime() + DAY_MS) })
    expect(messages()).toHaveLength(1)
    expect(messages()[0]).toContain(
      "50 % sur les 7 derniers jours (40 rôles), contre 80 % sur les 28 jours précédents (100 rôles), soit 30 points de moins.\nRépartition sur 7 jours : BAL (akto) 20 · refus ou validation manuelle 20 · création par clé API 5"
    )
  })

  it("lit la fenêtre par l'index { authorized_type, createdAt }", async () => {
    const explain = await getDbCollection("rolemanagements")
      .find(getRolesWindowFilter(day("2026-09-01"), day("2026-10-09")))
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
