import { ETAT_UTILISATEUR, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { JOB_STATUS } from "shared/models/job.model"
import type { ISameSiretAccountJson } from "shared/routes/user.routes"
import { describe, expect, it } from "vitest"
import { buildOffersSignal, buildOtherAccountsSignal, buildPartnersSignal, buildValidationSignal } from "./review-signals"

const account = (props: Partial<ISameSiretAccountJson> = {}): ISameSiretAccountJson => ({
  _id: "6ad734de852d3675eb942548",
  organizationId: "6ad734de852d3675eb942549",
  first_name: "Camille",
  last_name: "Leroy",
  email: "c.leroy@example.fr",
  createdAt: "2026-05-12T00:00:00.000Z",
  status: ETAT_UTILISATEUR.DESACTIVE,
  status_date: "2026-06-12T00:00:00.000Z",
  status_reason: "Compte en doublon",
  last_action_date: null,
  jobs_count: 1,
  matches: [],
  ...props,
})

const event = (props: Record<string, unknown>) => ({ validation_type: VALIDATION_UTILISATEUR.AUTO, user: "", date: "2026-11-03T10:00:00.000Z", reason: "", ...props }) as any

describe("buildOtherAccountsSignal", () => {
  it("ne parle pas de doublon quand les autres comptes n'ont aucun point commun", () => {
    expect(buildOtherAccountsSignal({ isLoading: false, isError: false, accounts: [account(), account({ _id: "x" })] })).toMatchObject({
      tone: "info",
      title: "2 autres comptes",
      description: "Aucun point commun avec ce compte.",
    })
  })

  it("ne conclut pas à l'absence d'autre compte pendant le chargement ni en cas d'erreur", () => {
    expect(buildOtherAccountsSignal({ isLoading: true, isError: false })).toMatchObject({ tone: "neutral" })
    expect(buildOtherAccountsSignal({ isLoading: false, isError: true })).toMatchObject({ tone: "neutral", retry: true })
  })

  it("signale un doublon probable avec le compte concerné et son statut", () => {
    expect(buildOtherAccountsSignal({ isLoading: false, isError: false, accounts: [account({ matches: ["phone", "name"] }), account({ _id: "x" })] })).toMatchObject({
      tone: "warning",
      title: "Doublon probable",
      description: "Même téléphone et même nom que Camille Leroy, désactivé le 12/06/2026 pour « Compte en doublon ».",
    })
  })

  it("regroupe plusieurs doublons probables", () => {
    const accounts = [account({ matches: ["phone"] }), account({ _id: "x", matches: ["name"], status: ETAT_UTILISATEUR.VALIDE })]
    expect(buildOtherAccountsSignal({ isLoading: false, isError: false, accounts })).toMatchObject({ tone: "warning", title: "Doublons probables" })
  })

  it("rassure quand le SIRET n'a aucun autre compte", () => {
    expect(buildOtherAccountsSignal({ isLoading: false, isError: false, accounts: [] })).toMatchObject({ tone: "success", title: "Aucun autre compte" })
  })
})

describe("buildValidationSignal", () => {
  it("ne prend pas un motif quelconque en attente pour un échec de la validation automatique", () => {
    expect(buildValidationSignal(event({ status: ETAT_UTILISATEUR.ATTENTE, reason: "création de compte" }))).toMatchObject({
      tone: "warning",
      title: "Validation manuelle attendue",
      description: "Motif : création de compte.",
    })
  })

  it("explique une validation automatique indéterminée", () => {
    expect(buildValidationSignal(event({ status: ETAT_UTILISATEUR.ATTENTE, reason: "validation automatique indéterminée : BAL indisponible" }))).toMatchObject({
      tone: "warning",
      title: "Validation automatique non concluante",
      description: "BAL indisponible le 03/11/2026.",
    })
  })

  it("distingue le refus de la validation automatique", () => {
    expect(buildValidationSignal(event({ status: ETAT_UTILISATEUR.ATTENTE, reason: "pas de validation automatique possible" }))).toMatchObject({
      title: "Pas de validation automatique possible",
    })
  })

  it("distingue validation automatique et manuelle", () => {
    expect(buildValidationSignal(event({ status: ETAT_UTILISATEUR.VALIDE, reason: "validation par : BAL" }))).toMatchObject({
      tone: "success",
      title: "Validé automatiquement",
      description: "Le 03/11/2026 : validation par : BAL",
    })
    expect(buildValidationSignal(event({ status: ETAT_UTILISATEUR.VALIDE, validation_type: VALIDATION_UTILISATEUR.MANUAL, user: "Léa Martin" }))).toMatchObject({
      tone: "success",
      title: "Validé manuellement",
      description: "Le 03/11/2026 par Léa Martin",
    })
  })

  it("rappelle la désactivation et son motif", () => {
    expect(buildValidationSignal(event({ status: ETAT_UTILISATEUR.DESACTIVE, validation_type: VALIDATION_UTILISATEUR.MANUAL, reason: "Compte en doublon" }))).toMatchObject({
      tone: "error",
      title: "Désactivé le 03/11/2026",
      description: "Motif : Compte en doublon.",
    })
  })

  it("reste neutre sans historique", () => {
    expect(buildValidationSignal(undefined)).toMatchObject({ tone: "neutral" })
  })
})

describe("buildOffersSignal", () => {
  it("ne compte comme non conformes que les offres du compte refusées en modération", () => {
    const jobs = [{ _id: "a", job_status: JOB_STATUS.ACTIVE }]
    const summaries = [
      { _id: "a", offer_moderation_review: "validee" },
      { _id: "autre-compte", offer_moderation_review: "refusee" },
    ]
    expect(buildOffersSignal({ jobs, moderationSummaries: summaries })).toMatchObject({ tone: "info", title: "1 offre en ligne" })
  })

  it("priorise refus, puis modération, puis attente", () => {
    const jobs = [
      { _id: "a", job_status: JOB_STATUS.EN_ATTENTE },
      { _id: "b", job_status: JOB_STATUS.EN_MODERATION },
      { _id: "c", job_status: JOB_STATUS.ANNULEE },
    ]
    expect(buildOffersSignal({ jobs, moderationSummaries: [{ _id: "c", offer_moderation_review: "refusee" }] })).toMatchObject({ tone: "error", title: "1 offre non conforme" })
    expect(buildOffersSignal({ jobs })).toMatchObject({ tone: "warning", title: "1 offre à modérer" })
    expect(buildOffersSignal({ jobs: [jobs[0], { _id: "d", job_status: JOB_STATUS.EN_ATTENTE }] })).toMatchObject({ tone: "info", title: "2 offres en attente" })
  })

  it("distingue l'absence d'offre des offres clôturées", () => {
    expect(buildOffersSignal({ jobs: [] })).toMatchObject({ tone: "neutral", title: "Aucune offre déposée" })
    expect(buildOffersSignal({ jobs: [{ _id: "a", job_status: JOB_STATUS.POURVUE }] })).toMatchObject({ tone: "neutral", title: "1 offre clôturée" })
  })
})

describe("buildPartnersSignal", () => {
  it("ne conclut pas à l'absence de partenaire pendant le chargement", () => {
    expect(buildPartnersSignal({ isLoading: true })).toMatchObject({ title: "Recherche des entreprises partenaires…" })
    expect(buildPartnersSignal({ isLoading: false, count: 0 })).toMatchObject({ title: "Aucune entreprise partenaire" })
    expect(buildPartnersSignal({ isLoading: false, count: 3 })).toMatchObject({ tone: "info", title: "3 entreprises partenaires" })
  })
})
