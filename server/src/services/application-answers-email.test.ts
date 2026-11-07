import { PARTNER_JOB_APPLICATION_QUESTIONS, SPONTANEOUS_APPLICATION_QUESTIONS } from "shared/constants/applicant-questions"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { describe, expect, it } from "vitest"

import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { buildApplicantAnswersForEmail } from "./application.service"
import mailer from "./mailer.service"

const RECRUITER_QUESTIONS = ["Avez-vous le permis B ?", "Quelles compétences souhaitez-vous développer ?", "Êtes-vous mobile le week-end ?"]

const answersTo = (questions: readonly string[], count: number) => questions.slice(0, count).map((question, index) => ({ question, answer: `Réponse numéro ${index + 1}` }))

const render = (template: string, data: ReturnType<typeof buildApplicantAnswersForEmail>) =>
  mailer.renderEmail(getStaticFilePath(`./templates/${template}.mjml.ejs`), {
    images: { logoLba: "https://exemple.fr/logo_LBA.png", logoRf: "https://exemple.fr/logo_rf.png" },
    applicant_first_name: "Camille",
    applicant_last_name: "Martin",
    company_name: "Boulangerie du test",
    job_title: "Commis de cuisine",
    ...data,
  })

describe("buildApplicantAnswersForEmail", () => {
  it("ne garde que les questions qui ont reçu une réponse", () => {
    const { applicant_answers_to_recruiter_questions } = buildApplicantAnswersForEmail({
      job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA,
      applicant_answers_to_recruiter_questions: [
        { question: SPONTANEOUS_APPLICATION_QUESTIONS[0], answer: "  " },
        { question: SPONTANEOUS_APPLICATION_QUESTIONS[1], answer: "Préparer les commandes." },
      ],
    })

    expect(applicant_answers_to_recruiter_questions).toEqual([{ question: SPONTANEOUS_APPLICATION_QUESTIONS[1], answer: "Préparer les commandes." }])
  })

  it("échappe la réponse et garde ses retours à la ligne", () => {
    const { applicant_answers_to_recruiter_questions } = buildApplicantAnswersForEmail({
      job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
      applicant_answers_to_recruiter_questions: [{ question: PARTNER_JOB_APPLICATION_QUESTIONS[0], answer: "Ligne 1\nLigne <b>2</b>" }],
    })

    expect(applicant_answers_to_recruiter_questions[0].answer).not.toContain("<b>")
    expect(applicant_answers_to_recruiter_questions[0].answer).toContain("<br />")
  })

  it.each([
    { job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA, questions: SPONTANEOUS_APPLICATION_QUESTIONS, expected: true },
    { job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, questions: PARTNER_JOB_APPLICATION_QUESTIONS, expected: true },
    { job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, questions: RECRUITER_QUESTIONS, expected: false },
    // Une offre LBA pose toujours les questions de son recruteur, même quand le libellé est celui d'une question fixe.
    { job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, questions: PARTNER_JOB_APPLICATION_QUESTIONS, expected: false },
  ])("distingue les questions fixes de LBA de celles du recruteur ($job_origin, attendu : $expected)", ({ job_origin, questions, expected }) => {
    expect(buildApplicantAnswersForEmail({ job_origin, applicant_answers_to_recruiter_questions: answersTo(questions, 2) }).applicant_answers_to_lba_questions).toBe(expected)
  })
})

describe.each([
  { flow: "candidature spontanée", job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA, questions: SPONTANEOUS_APPLICATION_QUESTIONS, recruiterTemplate: "mail-candidature-spontanee" },
  {
    flow: "offre partenaire en smart apply",
    job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
    questions: PARTNER_JOB_APPLICATION_QUESTIONS,
    recruiterTemplate: "mail-candidature",
  },
])("bloc « Motivations » des e-mails — $flow", ({ job_origin, questions, recruiterTemplate }) => {
  describe.each([
    { email: "recruteur", template: recruiterTemplate, title: "Ses motivations" },
    { email: "confirmation candidat", template: "mail-candidat-offre-emploi", title: "Vos motivations" },
  ])("e-mail $email", ({ template, title }) => {
    it("n'affiche pas le bloc sans réponse", async () => {
      const html = await render(template, buildApplicantAnswersForEmail({ job_origin, applicant_answers_to_recruiter_questions: [] }))

      expect(html).not.toContain(title)
      questions.forEach((question) => expect(html).not.toContain(question))
    })

    it.each([1, 2, 3])("affiche uniquement les %i question(s) répondue(s)", async (answerCount) => {
      const html = await render(template, buildApplicantAnswersForEmail({ job_origin, applicant_answers_to_recruiter_questions: answersTo(questions, answerCount) }))

      expect(html).toContain(title)
      questions.forEach((question, index) => {
        if (index < answerCount) {
          expect(html).toContain(question)
          expect(html).toContain(`Réponse numéro ${index + 1}`)
        } else {
          expect(html).not.toContain(question)
        }
      })
    })
  })
})

describe("bloc des réponses sur une offre LBA", () => {
  it.each([
    { template: "mail-candidature", title: "Ses réponses à vos questions" },
    { template: "mail-candidat-offre-emploi", title: "Vos réponses aux questions de l’entreprise" },
  ])("garde le titre des questions du recruteur ($template)", async ({ template, title }) => {
    const html = await render(
      template,
      buildApplicantAnswersForEmail({ job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, applicant_answers_to_recruiter_questions: answersTo(RECRUITER_QUESTIONS, 3) })
    )

    expect(html).toContain(title)
    expect(html).not.toContain("motivations")
    RECRUITER_QUESTIONS.forEach((question) => expect(html).toContain(question))
  })
})
