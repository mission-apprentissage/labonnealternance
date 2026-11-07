import { describe, expect, it } from "vitest"
import { ZToApplicantQuestions } from "../models/job.model.js"
import { getApplicantQuestions, PARTNER_JOB_APPLICATION_QUESTIONS, SPONTANEOUS_APPLICATION_QUESTIONS } from "./applicant-questions.js"
import { LBA_ITEM_TYPE } from "./lbaitem.js"

describe("getApplicantQuestions", () => {
  it.each([
    { jobType: LBA_ITEM_TYPE.RECRUTEURS_LBA, questions: SPONTANEOUS_APPLICATION_QUESTIONS },
    { jobType: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, questions: PARTNER_JOB_APPLICATION_QUESTIONS },
  ])("pose les questions fixes de LBA à défaut de questions du recruteur ($jobType)", ({ jobType, questions }) => {
    expect(getApplicantQuestions(jobType, null)).toEqual({ questions, askedBy: "lba" })
    expect(getApplicantQuestions(jobType, [])).toEqual({ questions, askedBy: "lba" })
  })

  it.each([LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES])("garde les questions du recruteur (%s)", (jobType) => {
    expect(getApplicantQuestions(jobType, ["Avez-vous le permis B ?"])).toEqual({ questions: ["Avez-vous le permis B ?"], askedBy: "recruiter" })
  })

  it("ne pose aucune question sur une offre LBA sans questions", () => {
    expect(getApplicantQuestions(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, null)).toEqual({ questions: [], askedBy: "recruiter" })
  })

  it.each([
    { flow: "candidature spontanée", questions: SPONTANEOUS_APPLICATION_QUESTIONS },
    { flow: "smart apply", questions: PARTNER_JOB_APPLICATION_QUESTIONS },
  ])("respecte les contraintes des questions saisies par un recruteur ($flow)", ({ questions }) => {
    expect(ZToApplicantQuestions.safeParse([...questions]).success).toBe(true)
  })
})
