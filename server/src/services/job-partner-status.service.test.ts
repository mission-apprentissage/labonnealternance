import { JOB_CLOSURE_ORIGIN, JOB_STATUS_ENGLISH } from "shared"
import type { ComputedUserAccess } from "shared/models/computed-user-access.model"
import { describe, expect, it } from "vitest"

import type { IJobStatusChange } from "./job-partner-status.service"
import { buildJobStatusChangeUpdate, resolveEspaceProClosureOrigin } from "./job-partner-status.service"

describe("buildJobStatusChangeUpdate", () => {
  const date = new Date("2026-09-15T10:00:00.000Z")

  it("écrit le statut et la trace correspondante avec le même horodatage", () => {
    expect(buildJobStatusChangeUpdate({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: "offre expirée", grantedBy: "expire-jobs-partners", date })).toEqual({
      $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: date },
      $push: { offer_status_history: { date, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "offre expirée", granted_by: "expire-jobs-partners" } },
    })
  })

  it("pousse la trace au lieu de remplacer l'historique", () => {
    // $push et non $set : c'est ce qui préserve les transitions déjà enregistrées sur l'offre.
    const update = buildJobStatusChangeUpdate({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: "recruteur anonymisé", grantedBy: "anonymize-lba-jobs-partners", date })

    expect(update.$push).toBeDefined()
    expect(update.$set).not.toHaveProperty("offer_status_history")
  })

  it("écrit les champs métier de extraSet sans laisser écraser le statut ni updated_at", () => {
    const update = buildJobStatusChangeUpdate({
      status: JOB_STATUS_ENGLISH.POURVUE,
      reason: "J'ai pourvu l'offre avec La bonne alternance",
      grantedBy: JOB_CLOSURE_ORIGIN.MAIL_RECRUTEUR,
      date,
      // Le type interdit ces trois champs dans extraSet ; le cast force le cas pour vérifier que le
      // filet runtime tient aussi, au cas où un appelant contournerait le typage.
      extraSet: { offer_expiration: date, offer_status: JOB_STATUS_ENGLISH.ACTIVE, updated_at: new Date("2000-01-01T00:00:00.000Z") } as IJobStatusChange["extraSet"],
    })

    expect(update.$set).toEqual({ offer_expiration: date, offer_status: JOB_STATUS_ENGLISH.POURVUE, updated_at: date })
  })

  it("horodate à maintenant quand aucune date n'est fournie", () => {
    const before = Date.now()
    const update = buildJobStatusChangeUpdate({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: "doublon", grantedBy: "détecteur de doublons" })
    const after = Date.now()

    const setDate = (update.$set as { updated_at: Date }).updated_at
    const pushDate = (update.$push as { offer_status_history: { date: Date } }).offer_status_history.date
    expect(setDate.getTime()).toBeGreaterThanOrEqual(before)
    expect(setDate.getTime()).toBeLessThanOrEqual(after)
    expect(pushDate).toEqual(setDate)
  })
})

describe("resolveEspaceProClosureOrigin", () => {
  const access = (overrides: Partial<ComputedUserAccess> = {}): ComputedUserAccess => ({
    admin: false,
    users: ["user-1"],
    entreprises: [],
    cfas: [],
    opcos: [],
    partner_label: [],
    ...overrides,
  })

  it("distingue l'administrateur du recruteur propriétaire", () => {
    // Le middleware d'autorisation court-circuite pour un admin : toutes les autres listes sont vides.
    expect(resolveEspaceProClosureOrigin(access({ admin: true }))).toBe(JOB_CLOSURE_ORIGIN.ESPACE_PRO_ADMIN)
    expect(resolveEspaceProClosureOrigin(access({ entreprises: ["entreprise-1"] }))).toBe(JOB_CLOSURE_ORIGIN.ESPACE_PRO_RECRUTEUR)
  })

  it("distingue le CFA délégataire et l'OPCO", () => {
    expect(resolveEspaceProClosureOrigin(access({ cfas: ["cfa-1"] }))).toBe(JOB_CLOSURE_ORIGIN.ESPACE_PRO_CFA)
    expect(resolveEspaceProClosureOrigin(access({ opcos: ["AKTO" as never] }))).toBe(JOB_CLOSURE_ORIGIN.ESPACE_PRO_OPCO)
  })

  it("applique la précédence admin > opco > cfa > entreprise sur un utilisateur multi-rôles", () => {
    expect(resolveEspaceProClosureOrigin(access({ admin: true, cfas: ["cfa-1"], entreprises: ["entreprise-1"] }))).toBe(JOB_CLOSURE_ORIGIN.ESPACE_PRO_ADMIN)
    expect(resolveEspaceProClosureOrigin(access({ cfas: ["cfa-1"], entreprises: ["entreprise-1"] }))).toBe(JOB_CLOSURE_ORIGIN.ESPACE_PRO_CFA)
  })

  it("se replie sans mentir quand la session n'expose aucun rôle", () => {
    expect(resolveEspaceProClosureOrigin(undefined)).toBe(JOB_CLOSURE_ORIGIN.ESPACE_PRO_INDETERMINE)
    expect(resolveEspaceProClosureOrigin(access())).toBe(JOB_CLOSURE_ORIGIN.ESPACE_PRO_INDETERMINE)
  })
})
