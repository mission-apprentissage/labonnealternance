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
    { annee: 2023, n_contrats: 900 },
    { annee: 2024, n_contrats: 312 },
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
  sectors: [],
  suggestions: ["01.11Z", "01.21Z", "01.50Z", "78.30Z", "01.13Z"].slice(0, suggestionsCount).map((naf) => buildSuggestion(naf)),
})

const buildApplicant = (targets: SuggestionsNafTargetWithSuggestions[], email = "camille.martin@example.com"): SuggestionsNafApplicantWithSuggestions => ({
  _id: new ObjectId(),
  email,
  firstname: "Camille",
  lastname: "Martin",
  applications: [],
  targets,
})

const findLogs = () =>
  getDbCollection("applicants_email_logs")
    .find({}, { projection: { _id: 0, createdAt: 0 } })
    .toArray()

describe("buildSuggestionsNafEmail", () => {
  it("rend le message nominatif, la liste des offres et les liens UTM", async () => {
    const target = buildTarget(3)
    target.suggestions.push(buildSuggestion("01.13Z", { partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, offer_title: "<b>injection</b>" }, []))
    const { subject, data } = buildSuggestionsNafEmail(buildApplicant([target]), target)

    const html = await mailer.renderEmail(getEmailTemplate("mail-candidat-suggestions-naf"), data)

    expect(subject).toBe("Votre métier Conducteur / Conductrice d'engins agricoles est recherché dans d'autres secteurs, tentez votre chance !")
    expect(html).toContain("Bonjour Camille Martin,")
    expect(html).toContain("Offre 01.11Z")
    expect(html).toContain("SARL EXEMPLE, Meaux")
    expect(html).not.toContain("km")
    expect(html).toContain("Secteur : Secteur 01.21Z")
    expect(html).toMatch(/1\s212 contrats en alternance signés dans ce secteur pour ce métier depuis 2023/)
    expect(html.match(/contrats? en alternance/g)).toHaveLength(3)
    expect(html).toContain("Candidature spontanée")
    expect(html).not.toContain("injection")
    expect(data.suggestions[0].url).toMatch(
      /\/emploi\/offres_emploi_lba\/[a-f0-9]{24}\/[a-z0-9-]+\?utm_source=lba-transactionnel&utm_medium=email&utm_campaign=2610_lba_candidats_suggestions-naf-recherche-emplois&utm_content=offre$/
    )
    expect(data.suggestions[3].url).toContain("/emploi/recruteurs_lba/42476141900045/")
    expect(data.searchUrl).toMatch(
      /\/recherche\?utm_source=lba-transactionnel&utm_medium=email&utm_campaign=2610_lba_candidats_suggestions-naf-recherche-emplois&utm_content=recherche$/
    )
  })
})

describe("sendSuggestionsNafEmails", () => {
  useMongo()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("envoie un email par ROME ayant au moins 3 suggestions et trace chaque envoi", async () => {
    const sendEmail = vi.spyOn(mailer, "sendEmail").mockResolvedValue({ messageId: "<message@brevo>" })
    const sendable = buildTarget(3)
    const applicant = buildApplicant([sendable, buildTarget(2, "M1607")])

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
