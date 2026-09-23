"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, Typography } from "@mui/material"
import { getIn, useFormikContext } from "formik"
import { useEffect, useRef, useState } from "react"
import { FEEDBACK_FORM_MAX_QUESTIONS, FEEDBACK_QUESTION_MAX_OPTIONS, FEEDBACK_QUESTION_MIN_OPTIONS } from "shared/models/feedback-form.model"

import CustomInput from "@/app/_components/CustomInput"

import type { IFeedbackFormDraft, IFeedbackQuestionDraft, IFeedbackQuestionType } from "../_utils/questionDrafts"
import { createQuestionDraft, nextQuestionId, QUESTION_TYPE_LABEL } from "../_utils/questionDrafts"

const ADD_QUESTION_BUTTON_ID = "feedback-form-add-question"

const fieldId = (question: IFeedbackQuestionDraft, field: string) => `feedback-question-${question.id}-${field}`

/**
 * Bloc « 2 · Questions » : une carte par question, dans l'ordre où le widget les pose.
 *
 * Chaque carte est un `fieldset` dont la légende porte le numéro de la question : les champs
 * « Type », « Libellé », « Obligatoire » se répètent d'une carte à l'autre et ne se distinguent
 * que par ce contexte (RGAA 11.5). Ajouter, déplacer ou supprimer une question change la page
 * sans que le focus ne bouge de lui-même : il est replacé explicitement, et chaque changement
 * est annoncé dans une région `aria-live` (RGAA 7.4).
 */
export function QuestionsField() {
  const { values, errors, setFieldValue } = useFormikContext<IFeedbackFormDraft>()
  const questions = values.questions
  const [announcement, setAnnouncement] = useState("")
  // id de l'élément à focaliser une fois le rendu suivant appliqué
  const pendingFocus = useRef<string[] | null>(null)

  useEffect(() => {
    if (!pendingFocus.current) return
    // premier candidat présent et actif : un bouton « Monter » devenu désactivé en tête de liste
    // ne peut plus recevoir le focus, on se rabat sur « Descendre »
    const target = pendingFocus.current.map((id) => document.getElementById(id)).find((element) => element && !(element as HTMLButtonElement).disabled)
    target?.focus()
    pendingFocus.current = null
  }, [questions])

  const setQuestions = (next: IFeedbackQuestionDraft[]) => setFieldValue("questions", next)
  const updateQuestion = (index: number, patch: Partial<IFeedbackQuestionDraft>) =>
    setQuestions(questions.map((question, i) => (i === index ? { ...question, ...patch } : question)))

  const addQuestion = () => {
    const question = createQuestionDraft(nextQuestionId(questions))
    pendingFocus.current = [fieldId(question, "label")]
    setQuestions([...questions, question])
    setAnnouncement(`Question ${questions.length + 1} ajoutée`)
  }

  const removeQuestion = (index: number) => {
    const next = questions.filter((_, i) => i !== index)
    // la question qui prend sa place, sinon la précédente, sinon le bouton d'ajout
    const neighbour = next[index] ?? next[index - 1]
    pendingFocus.current = [neighbour ? fieldId(neighbour, "type") : ADD_QUESTION_BUTTON_ID]
    setQuestions(next)
    setAnnouncement(`Question ${index + 1} supprimée`)
  }

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    const moved = questions[index]
    pendingFocus.current = direction === -1 ? [fieldId(moved, "up"), fieldId(moved, "down")] : [fieldId(moved, "down"), fieldId(moved, "up")]
    setQuestions(next)
    setAnnouncement(`Question déplacée en position ${target + 1}`)
  }

  const questionsError = typeof errors.questions === "string" ? errors.questions : undefined

  return (
    <Box component="section" aria-labelledby="feedback-form-questions-title" sx={{ mt: fr.spacing("6v") }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: fr.spacing("2v"), mb: fr.spacing("3v") }}>
        <Typography
          id="feedback-form-questions-title"
          component="h2"
          className={fr.cx("fr-text--md", "fr-text--bold")}
          sx={{ color: fr.colors.decisions.text.title.blueFrance.default, mb: 0 }}
        >
          2 · Questions{" "}
          <Typography component="span" className={fr.cx("fr-text--md")} sx={{ color: fr.colors.decisions.text.mention.grey.default, fontWeight: 400 }}>
            ({questions.length} / {FEEDBACK_FORM_MAX_QUESTIONS})
          </Typography>
        </Typography>
        <Typography className={fr.cx("fr-text--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>
          Posées une par une, dans cet ordre
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
        {questions.map((question, index) => (
          <QuestionCard
            // l'identifiant suit la question quand elle change de place : React déplace le nœud au
            // lieu de le recréer, et le bouton qui vient d'être activé garde le focus
            key={question.id}
            question={question}
            index={index}
            count={questions.length}
            onChange={(patch) => updateQuestion(index, patch)}
            onMove={(direction) => moveQuestion(index, direction)}
            onRemove={() => removeQuestion(index)}
            onAnnounce={setAnnouncement}
          />
        ))}
      </Box>

      {questionsError && <p className={fr.cx("fr-message", "fr-message--error")}>{questionsError}</p>}

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v"), mt: fr.spacing("3v") }}>
        <Button
          id={ADD_QUESTION_BUTTON_ID}
          type="button"
          priority="secondary"
          iconId="fr-icon-add-line"
          onClick={addQuestion}
          disabled={questions.length >= FEEDBACK_FORM_MAX_QUESTIONS}
        >
          Ajouter une question
        </Button>
        {questions.length >= FEEDBACK_FORM_MAX_QUESTIONS && (
          <Typography className={fr.cx("fr-text--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>
            {FEEDBACK_FORM_MAX_QUESTIONS} questions au maximum
          </Typography>
        )}
      </Box>

      <p className={fr.cx("fr-sr-only")} aria-live="polite">
        {announcement}
      </p>
    </Box>
  )
}

type QuestionCardProps = {
  question: IFeedbackQuestionDraft
  index: number
  count: number
  onChange: (patch: Partial<IFeedbackQuestionDraft>) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  onAnnounce: (message: string) => void
}

function QuestionCard({ question, index, count, onChange, onMove, onRemove, onAnnounce }: QuestionCardProps) {
  const { errors, setFieldValue } = useFormikContext<IFeedbackFormDraft>()
  const name = `questions.${index}`
  const position = index + 1
  const hasOptions = question.type === "single_select" || question.type === "multi_select"
  const optionsError = getIn(errors, `${name}.options`)
  const pendingOptionFocus = useRef<string | null>(null)

  useEffect(() => {
    if (!pendingOptionFocus.current) return
    document.getElementById(pendingOptionFocus.current)?.focus()
    pendingOptionFocus.current = null
  }, [question.options])

  const addOption = () => {
    pendingOptionFocus.current = fieldId(question, `option-${question.options.length}`)
    onChange({ options: [...question.options, { label: "" }] })
  }

  const removeOption = (optionIndex: number) => {
    pendingOptionFocus.current = fieldId(question, "add-option")
    onChange({ options: question.options.filter((_, i) => i !== optionIndex) })
    onAnnounce(`Option ${optionIndex + 1} retirée`)
  }

  return (
    <Box
      component="fieldset"
      sx={{
        m: 0,
        p: fr.spacing("4v"),
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("3v"),
        minWidth: 0,
      }}
    >
      <legend className={fr.cx("fr-sr-only")}>Question {position}</legend>

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: fr.spacing("3v") }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: fr.spacing("3v") }}>
          <Box
            aria-hidden="true"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              mb: "6px",
              flexShrink: 0,
              backgroundColor: fr.colors.decisions.background.actionHigh.blueFrance.default,
              color: fr.colors.decisions.text.inverted.grey.default,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {position}
          </Box>
          <Select
            label="Type"
            style={{ marginBottom: 0, minWidth: 240 }}
            nativeSelectProps={{
              id: fieldId(question, "type"),
              value: question.type,
              // seul le type change : les paramètres des autres types restent dans le brouillon
              onChange: (event) => onChange({ type: event.target.value as IFeedbackQuestionType }),
            }}
          >
            {Object.entries(QUESTION_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v") }}>
          <Checkbox
            small
            style={{ marginBottom: 0 }}
            options={[{ label: "Obligatoire", nativeInputProps: { checked: question.required, onChange: (event) => onChange({ required: event.target.checked }) } }]}
          />
          <Button
            id={fieldId(question, "up")}
            type="button"
            size="small"
            priority="tertiary"
            iconId="fr-icon-arrow-up-line"
            title={`Monter la question ${position}`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          />
          <Button
            id={fieldId(question, "down")}
            type="button"
            size="small"
            priority="tertiary"
            iconId="fr-icon-arrow-down-line"
            title={`Descendre la question ${position}`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          />
          <Button
            type="button"
            size="small"
            priority="tertiary"
            iconId="fr-icon-delete-line"
            iconPosition="left"
            nativeButtonProps={{ "aria-label": `Supprimer la question ${position}` }}
            style={{ color: fr.colors.decisions.text.default.error.default }}
            onClick={onRemove}
          >
            Supprimer
          </Button>
        </Box>
      </Box>

      <CustomInput
        id={fieldId(question, "label")}
        name={`${name}.label`}
        label="Libellé"
        type="text"
        pb={0}
        value={question.label}
        onChange={(event) => setFieldValue(`${name}.label`, event.target.value)}
      />

      {question.type === "rating" && (
        <Typography className={fr.cx("fr-text--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>
          Réponses proposées : Très bien · Moyen · Pas convaincu
        </Typography>
      )}

      {hasOptions && (
        <Box component="fieldset" sx={{ m: 0, p: 0, border: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: fr.spacing("2v") }}>
          <Typography component="legend" className={fr.cx("fr-text--md")} sx={{ mb: fr.spacing("1v"), p: 0 }}>
            Options{" "}
            <Typography component="span" className={fr.cx("fr-text--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default }}>
              ({FEEDBACK_QUESTION_MIN_OPTIONS} à {FEEDBACK_QUESTION_MAX_OPTIONS}) —{" "}
              {question.type === "multi_select" ? "plusieurs réponses possibles" : "une seule réponse possible"}
            </Typography>
          </Typography>

          {question.options.map((option, optionIndex) => (
            <Box key={optionIndex} sx={{ display: "flex", alignItems: "flex-start", gap: fr.spacing("2v") }}>
              <CustomInput
                id={fieldId(question, `option-${optionIndex}`)}
                name={`${name}.options.${optionIndex}.label`}
                label={<span className={fr.cx("fr-sr-only")}>Option {optionIndex + 1}</span>}
                hideAsterisk
                type="text"
                pb={0}
                sx={{ flexGrow: 1 }}
                value={option.label}
                onChange={(event) => setFieldValue(`${name}.options.${optionIndex}.label`, event.target.value)}
              />
              <Button
                type="button"
                priority="tertiary"
                iconId="fr-icon-close-line"
                title={`Retirer l'option ${optionIndex + 1}`}
                disabled={question.options.length <= FEEDBACK_QUESTION_MIN_OPTIONS}
                style={{ marginTop: 8 }}
                onClick={() => removeOption(optionIndex)}
              />
            </Box>
          ))}

          {typeof optionsError === "string" && <p className={fr.cx("fr-message", "fr-message--error")}>{optionsError}</p>}

          <Button
            id={fieldId(question, "add-option")}
            type="button"
            size="small"
            priority="secondary"
            iconId="fr-icon-add-line"
            style={{ alignSelf: "flex-start" }}
            disabled={question.options.length >= FEEDBACK_QUESTION_MAX_OPTIONS}
            onClick={addOption}
          >
            Ajouter une option
          </Button>
        </Box>
      )}

      {question.type === "text" && (
        <Box sx={{ maxWidth: { md: "33%" } }}>
          <CustomInput
            id={fieldId(question, "max-length")}
            name={`${name}.maxLength`}
            label="Longueur max"
            info="En nombre de caractères, 2000 au plus"
            type="number"
            pb={0}
            inputProps={{ min: 1, max: 2000 }}
            value={question.maxLength}
            onChange={(event) => {
              const raw = event.target.value
              setFieldValue(`${name}.maxLength`, raw === "" ? "" : Number(raw))
            }}
          />
        </Box>
      )}
    </Box>
  )
}
