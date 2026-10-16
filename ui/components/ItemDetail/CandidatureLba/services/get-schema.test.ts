import { APPLICANT_ANSWER_MAX_LENGTH } from "shared/models/applications.model"
import { describe, expect, it } from "vitest"
import { formatCount, QuestionAnswerSchema } from "./get-schema"

const errorsOf = (answer: unknown) => QuestionAnswerSchema.safeParse(answer).error?.issues.map(({ message }) => message)

describe("QuestionAnswerSchema", () => {
  it("accepte une réponse à la longueur maximale", () => {
    expect(QuestionAnswerSchema.safeParse("a".repeat(APPLICANT_ANSWER_MAX_LENGTH)).success).toBe(true)
  })

  it("refuse une réponse plus longue que la limite du serveur", () => {
    expect(errorsOf("a".repeat(APPLICANT_ANSWER_MAX_LENGTH + 1))).toEqual(["Votre réponse dépasse 2\u202f000 caractères, raccourcissez-la."])
  })

  it("compte les espaces de fin, envoyés tels quels au serveur", () => {
    expect(errorsOf(`${"a".repeat(APPLICANT_ANSWER_MAX_LENGTH)}  `)).toHaveLength(1)
  })

  it.each([undefined, "   "])("refuse une réponse vide (%j)", (answer) => {
    expect(errorsOf(answer)).toEqual(["Une réponse est obligatoire"])
  })
})

describe("formatCount", () => {
  it("sépare les milliers par une espace fine insécable", () => {
    expect(formatCount(2000)).toBe("2\u202f000")
  })
})
