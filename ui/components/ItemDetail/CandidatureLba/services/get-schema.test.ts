import { APPLICANT_ANSWER_MAX_LENGTH } from "shared/models/applications.model"
import { describe, expect, it } from "vitest"
import { buildApplicantAnswers, formatCount, OptionalQuestionAnswerSchema, QuestionAnswerSchema } from "./get-schema"

const errorsOf = (answer: unknown) => QuestionAnswerSchema.safeParse(answer).error?.issues.map(({ message }) => message)

describe("QuestionAnswerSchema", () => {
  it("accepte une réponse à la longueur maximale", () => {
    expect(QuestionAnswerSchema.safeParse("a".repeat(APPLICANT_ANSWER_MAX_LENGTH)).success).toBe(true)
  })

  it("refuse une réponse plus longue que la limite du serveur", () => {
    expect(errorsOf("a".repeat(APPLICANT_ANSWER_MAX_LENGTH + 1))).toEqual(["Votre réponse dépasse 2\u202f000 caractères, veuillez la raccourcir."])
  })

  it("compte les espaces de fin, envoyés tels quels au serveur", () => {
    expect(errorsOf(`${"a".repeat(APPLICANT_ANSWER_MAX_LENGTH)}  `)).toHaveLength(1)
  })

  it.each([undefined, "   "])("refuse une réponse vide (%j)", (answer) => {
    expect(errorsOf(answer)).toEqual(["Une réponse est obligatoire"])
  })
})

describe("OptionalQuestionAnswerSchema", () => {
  it.each([undefined, "   ", "a".repeat(APPLICANT_ANSWER_MAX_LENGTH)])("accepte une réponse absente, vide ou à la longueur maximale (%#)", (answer) => {
    expect(OptionalQuestionAnswerSchema.safeParse(answer).success).toBe(true)
  })

  it("applique la même limite que les questions du recruteur", () => {
    expect(OptionalQuestionAnswerSchema.safeParse("a".repeat(APPLICANT_ANSWER_MAX_LENGTH + 1)).error?.issues.map(({ message }) => message)).toEqual(
      errorsOf("a".repeat(APPLICANT_ANSWER_MAX_LENGTH + 1))
    )
  })
})

describe("buildApplicantAnswers", () => {
  const questionFields = [
    { question: "Question A ?", name: "custom_question_0" },
    { question: "Question B ?", name: "custom_question_1" },
    { question: "Question C ?", name: "custom_question_2" },
  ]

  it("garde l'ordre des questions et la réponse telle que saisie", () => {
    expect(buildApplicantAnswers(questionFields, { custom_question_2: "Réponse C", custom_question_0: " Réponse A " })).toEqual([
      { question: "Question A ?", answer: " Réponse A " },
      { question: "Question C ?", answer: "Réponse C" },
    ])
  })

  it.each([undefined, "", "  \n "])("n'envoie pas une réponse vide (%j)", (answer) => {
    expect(buildApplicantAnswers(questionFields, { custom_question_0: answer, custom_question_1: "Réponse B" })).toEqual([{ question: "Question B ?", answer: "Réponse B" }])
  })

  it("renvoie une liste vide sans aucune réponse", () => {
    expect(buildApplicantAnswers(questionFields, {})).toEqual([])
  })
})

describe("formatCount", () => {
  it("sépare les milliers par une espace fine insécable", () => {
    expect(formatCount(2000)).toBe("2\u202f000")
  })
})
