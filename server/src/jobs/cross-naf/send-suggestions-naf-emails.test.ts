import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { EMAIL_LOG_TYPE } from "shared/models/applicant-email-log.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getEmailTemplate } from "@/services/application.service"
import mailer from "@/services/mailer.service"

import type { SuggestionsNafApplicantWithSuggestions, SuggestionsNafSuggestion, SuggestionsNafTargetWithSuggestions } from "./find-suggestions-naf-jobs"
import { buildSuggestionsNafEmail, sendSuggestionsNafEmails } from "./send-suggestions-naf-emails"

const buildSuggestion = (
  naf: string,
  data: Partial<SuggestionsNafSuggestion["job"]> = {},
  contrats_par_annee = [
    { annee: 2024, n_contrats: 900 },
    { annee: 2025, n_contrats: 4820 },
    { annee: 2026, n_contrats: 312 },
  ]
): SuggestionsNafSuggestion => ({
  sector: { naf, naf_libelle: `Secteur ${naf}`, rang: 2, contrats_par_annee },
  job: {
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    offer_title: `Offre ${naf}`,
    workplace_name: null,
    workplace_legal_name: "SARL EXEMPLE",
    workplace_brand: null,
    workplace_address_city: "Meaux",
    workplace_address_label: "1 rue de la Gare 77100 Meaux",
    workplace_siret: "42476141900045",
    workplace_naf_label: `Secteur ${naf}`,
    distance_km: 40.4,
    ...data,
  },
})

const buildTarget = (suggestionsCount: number, rome = "A1101"): SuggestionsNafTargetWithSuggestions => ({
  rome,
  rome_libelle: "Conducteur / Conductrice d'engins agricoles",
  source_application_id: new ObjectId(),
  source_geopoint: { type: "Point", coordinates: [2.347, 48.859] },
  source_job: {
    offer_title: "Conducteur d'engins",
    workplace_name: null,
    workplace_brand: "AGRI SERVICES",
    workplace_legal_name: "SARL AGRI SERVICES",
    workplace_naf_label: "Culture de céréales",
    workplace_address_city: "Paris",
  },
  sectors: [],
  suggestions: ["01.11Z", "01.21Z", "01.50Z", "78.30Z", "01.13Z"].slice(0, suggestionsCount).map((naf) => buildSuggestion(naf)),
})

const buildApplicant = (targets: SuggestionsNafTargetWithSuggestions[], email = "camille.martin@example.com"): SuggestionsNafApplicantWithSuggestions => ({
  _id: new ObjectId(),
  email,
  firstname: "Camille",
  applications: [],
  targets,
})

const findLogs = () =>
  getDbCollection("applicants_email_logs")
    .find({}, { projection: { _id: 0, createdAt: 0 } })
    .toArray()

describe("buildSuggestionsNafEmail", () => {
  const NOW = new Date("2026-10-21T08:00:00.000Z")

  const render = async (target: SuggestionsNafTargetWithSuggestions) => {
    const { subject, data } = buildSuggestionsNafEmail(buildApplicant([target]), target, NOW)
    return { subject, data, html: await mailer.renderEmail(getEmailTemplate("mail-candidat-suggestions-naf"), data) }
  }

  it("rend l'introduction, les offres et la conclusion de la maquette", async () => {
    const target = buildTarget(3)
    target.suggestions.push(buildSuggestion("01.13Z", { partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, offer_title: "<b>injection</b>" }, [{ annee: 2025, n_contrats: 1 }]))

    const { subject, html } = await render(target)

    expect(subject).toBe("Votre métier Conducteur / Conductrice d'engins agricoles est recherché dans d'autres secteurs, tentez votre chance !")
    expect(html).toContain("Votre métier recrute aussi dans d’autres secteurs : 4 offres en alternance sélectionnées pour vous.")
    expect(html).toContain("Bonjour Camille,")
    expect(html).toMatch(
      /Vous avez postulé à l’offre de <span[^>]*>Conducteur d&#39;engins<\/span> pour l’établissement <span[^>]*>AGRI SERVICES<\/span>, une entreprise du secteur <span[^>]*>Culture de céréales<\/span>\./
    )
    expect(html).toContain("Voici 4 offres qui vous permettent")
    expect(html).toContain("SARL EXEMPLE · Meaux")
    expect(html).toContain("Secteur : Secteur 01.21Z")
    expect(html).toMatch(/4\s820 contrats en alternance signés dans ce secteur en 2025 en France/)
    expect(html).toContain("1 contrat en alternance signé dans ce secteur en 2025 en France")
    expect(html).toContain("Candidature spontanée")
    expect(html).not.toContain("injection")
    expect(html).toContain("Voir toutes les offres pour mon métier")
    expect(html).toContain("À vous de jouer !")
  })

  it("omet le secteur de l'offre source et les contrats quand ils sont inconnus", async () => {
    const target = buildTarget(3)
    target.source_job.workplace_naf_label = null
    target.suggestions = target.suggestions.map(({ job }) => buildSuggestion("01.11Z", job, [{ annee: 2026, n_contrats: 12 }]))

    const { html } = await render(target)

    expect(html).toMatch(/<span[^>]*>AGRI SERVICES<\/span>\./)
    expect(html).not.toContain("une entreprise du secteur")
    expect(html).not.toContain("signés dans ce secteur")
  })

  it("tague les liens et rejoue la recherche du métier autour de la candidature source", async () => {
    const target = buildTarget(3)
    target.suggestions.push(buildSuggestion("01.13Z", { partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }))

    const { data } = await render(target)

    const utm = "utm_source=lba-transactionnel&utm_medium=email&utm_campaign=2610_lba_candidats_suggestions-naf-recherche-emplois"
    expect(data.suggestions[0].url).toMatch(new RegExp(`/emploi/offres_emploi_lba/[a-f0-9]{24}/[a-z0-9-]+\\?${utm}&utm_content=offre$`))
    expect(data.suggestions[3].url).toContain("/emploi/recruteurs_lba/42476141900045/")
    const searchUrl = new URL(data.searchUrl)
    expect(searchUrl.pathname).toBe("/recherche")
    expect(Object.fromEntries(searchUrl.searchParams)).toEqual({
      q: "Conducteur / Conductrice d'engins agricoles",
      lieu_label: "Paris",
      latitude: "48.859",
      longitude: "2.347",
      radius: "100",
      utm_source: "lba-transactionnel",
      utm_medium: "email",
      utm_campaign: "2610_lba_candidats_suggestions-naf-recherche-emplois",
      utm_content: "recherche",
    })
  })
})

describe("sendSuggestionsNafEmails", () => {
  useMongo()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("envoie un email par ROME ayant au moins 2 suggestions (RG 4) et trace chaque envoi", async () => {
    const sendEmail = vi.spyOn(mailer, "sendEmail").mockResolvedValue({ messageId: "<message@brevo>" })
    const sendable = buildTarget(2)
    const applicant = buildApplicant([sendable, buildTarget(1, "M1607")])

    expect(await sendSuggestionsNafEmails([applicant])).toEqual({ sent: 1, failed: 0, blacklisted: 0 })
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "camille.martin@example.com", template: getEmailTemplate("mail-candidat-suggestions-naf") }))
    expect(await findLogs()).toEqual([
      { applicant_id: applicant._id, application_id: sendable.source_application_id, type: EMAIL_LOG_TYPE.SUGGESTIONS_NAF, message_id: "<message@brevo>" },
    ])
  })

  it("n'envoie rien aux candidats en liste noire", async () => {
    const sendEmail = vi.spyOn(mailer, "sendEmail")
    await getDbCollection("emailblacklists").insertOne({ _id: new ObjectId(), email: "camille.martin@example.com", blacklisting_origin: "brevo", created_at: new Date() })

    expect(await sendSuggestionsNafEmails([buildApplicant([buildTarget(5)])])).toEqual({ sent: 0, failed: 0, blacklisted: 1 })
    expect(sendEmail).not.toHaveBeenCalled()
    expect(await findLogs()).toEqual([])
  })

  it("retire la trace d'un envoi en échec et poursuit avec les emails suivants", async () => {
    vi.spyOn(mailer, "sendEmail").mockRejectedValueOnce(new Error("SMTP indisponible")).mockResolvedValue({ messageId: "<ok@brevo>" })
    const applicant = buildApplicant([buildTarget(3), buildTarget(4, "M1607")])

    expect(await sendSuggestionsNafEmails([applicant])).toEqual({ sent: 1, failed: 1, blacklisted: 0 })
    expect(await findLogs()).toEqual([expect.objectContaining({ application_id: applicant.targets[1].source_application_id, message_id: "<ok@brevo>" })])
  })
})
