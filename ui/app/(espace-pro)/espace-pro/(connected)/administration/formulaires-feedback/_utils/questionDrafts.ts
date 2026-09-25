import type { IFeedbackFormInput, IFeedbackFormTrigger, IFeedbackQuestion } from "shared/models/feedback-form.model"
import { FEEDBACK_QUESTION_MIN_OPTIONS, normalizeFeedbackTrigger } from "shared/models/feedback-form.model"
import { toSnakeCaseSlug } from "shared/utils/string-utils"

export type IFeedbackQuestionType = IFeedbackQuestion["type"]

export const QUESTION_TYPE_LABEL: Record<IFeedbackQuestionType, string> = {
  rating: "Note rapide (pouces)",
  single_select: "Choix unique",
  multi_select: "Choix multiple",
  text: "Texte libre",
}

type IRatingQuestion = Extract<IFeedbackQuestion, { type: "rating" }>
type IMultiSelectQuestion = Extract<IFeedbackQuestion, { type: "multi_select" }>
type ITextQuestion = Extract<IFeedbackQuestion, { type: "text" }>

/**
 * Question en cours de saisie dans le back-office. Elle porte les paramètres de *tous* les types à
 * la fois : changer de type par mégarde puis revenir en arrière retrouve la saisie intacte. Seuls
 * les paramètres du type retenu sont envoyés à l'enregistrement (voir `toFeedbackQuestion`).
 *
 * Les options sont communes au choix unique et au choix multiple : passer de l'un à l'autre est
 * un changement de règle de réponse, pas de contenu.
 */
export type IFeedbackQuestionDraft = {
  id: string
  type: IFeedbackQuestionType
  label: string
  required: boolean
  scale: IRatingQuestion["scale"]
  options: { label: string }[]
  maxLength: ITextQuestion["maxLength"] | ""
  // non éditables pour l'instant, conservés pour ne pas perdre ce qui serait déjà en base
  placeholder: ITextQuestion["placeholder"]
  maxSelections: IMultiSelectQuestion["maxSelections"]
  /** Case « Affichage conditionnel ». Décochée, la condition saisie est gardée mais pas enregistrée. */
  conditional: boolean
  /** `""` tant que rien n'est choisi : c'est la validation qui le signale. */
  showIf: { questionId: string; equals: string | string[] }
}

export type IFeedbackFormDraft = Omit<IFeedbackFormInput, "questions"> & { questions: IFeedbackQuestionDraft[] }

const emptyOptions = () => Array.from({ length: FEEDBACK_QUESTION_MIN_OPTIONS }, () => ({ label: "" }))

/** Identifiant stable `qN`, jamais celui d'une question encore présente — c'est la clé des réponses. */
export const nextQuestionId = (questions: IFeedbackQuestionDraft[]) => {
  const max = questions.reduce((acc, { id }) => Math.max(acc, Number(/^q(\d+)$/.exec(id)?.[1] ?? 0)), 0)
  return `q${max + 1}`
}

export const createQuestionDraft = (id: string): IFeedbackQuestionDraft => ({
  id,
  type: "rating",
  label: "",
  required: false,
  scale: "thumbs3",
  options: emptyOptions(),
  maxLength: 500,
  placeholder: null,
  maxSelections: undefined,
  conditional: false,
  showIf: { questionId: "", equals: "" },
})

export const toQuestionDraft = (question: IFeedbackQuestion): IFeedbackQuestionDraft => {
  const draft: IFeedbackQuestionDraft = {
    ...createQuestionDraft(question.id),
    type: question.type,
    label: question.label,
    required: question.required,
    conditional: Boolean(question.showIf),
    showIf: question.showIf ? { questionId: question.showIf.questionId, equals: question.showIf.equals ?? "" } : { questionId: "", equals: "" },
  }
  switch (question.type) {
    case "rating":
      return { ...draft, scale: question.scale }
    case "single_select":
      return { ...draft, options: question.options.map(({ label }) => ({ label })) }
    case "multi_select":
      return { ...draft, options: question.options.map(({ label }) => ({ label })), maxSelections: question.maxSelections }
    case "text":
      return { ...draft, maxLength: question.maxLength, placeholder: question.placeholder }
  }
}

/**
 * Les champs vides sont transmis tels quels (`""`) : c'est la validation qui les signale. Le
 * résultat n'est donc un `IFeedbackQuestion` valide qu'une fois passé par `ZFeedbackFormInput`.
 */
export const toFeedbackQuestion = (draft: IFeedbackQuestionDraft): IFeedbackQuestion => {
  const base = { id: draft.id, label: draft.label, required: draft.required, showIf: draft.conditional ? draft.showIf : null }
  const options = draft.options.map(({ label }) => ({ label, value: toSnakeCaseSlug(label, 60) }))
  switch (draft.type) {
    case "rating":
      return { ...base, type: "rating", scale: draft.scale }
    case "single_select":
      return { ...base, type: "single_select", options }
    case "multi_select":
      return { ...base, type: "multi_select", options, ...(draft.maxSelections ? { maxSelections: draft.maxSelections } : {}) }
    case "text":
      return { ...base, type: "text", maxLength: draft.maxLength as number, placeholder: draft.placeholder }
  }
}

/** Question laissée telle qu'à sa création : ignorée à l'enregistrement plutôt que refusée. */
export const isBlankQuestion = (draft: IFeedbackQuestionDraft) => {
  const hasOptions = draft.type === "single_select" || draft.type === "multi_select"
  return !draft.label.trim() && !draft.conditional && (!hasOptions || draft.options.every(({ label }) => !label.trim()))
}

/**
 * Brouillon du formulaire -> corps de requête. Renvoie aussi, pour chaque question envoyée, son
 * index dans le brouillon : les erreurs de validation doivent revenir sur le bon bloc même quand
 * une question vide a été écartée avant elle.
 */
export const toFeedbackFormInput = ({ questions, trigger, ...rest }: IFeedbackFormDraft): { input: IFeedbackFormInput; draftIndexes: number[] } => {
  const draftIndexes = questions.flatMap((question, index) => (isBlankQuestion(question) ? [] : [index]))
  // comme pour les questions, seuls les paramètres du type de déclencheur choisi partent
  return { input: { ...rest, trigger: normalizeFeedbackTrigger(trigger), questions: draftIndexes.map((index) => toFeedbackQuestion(questions[index])) }, draftIndexes }
}

/** Valeurs proposées pour chaque type de déclencheur, pour qu'en changer ne présente jamais un champ vide. */
export const DEFAULT_TRIGGER_PARAMS = { minInteractions: 1, delaySeconds: 30, event: "application_abandoned" } as const satisfies Partial<IFeedbackFormTrigger>

export const toFeedbackFormDraft = ({ questions, trigger, ...rest }: IFeedbackFormInput): IFeedbackFormDraft => ({
  ...rest,
  trigger: { ...DEFAULT_TRIGGER_PARAMS, ...trigger },
  // un formulaire commence toujours par une question à remplir, y compris un brouillon enregistré sans question
  questions: questions.length ? questions.map(toQuestionDraft) : [createQuestionDraft("q1")],
})
