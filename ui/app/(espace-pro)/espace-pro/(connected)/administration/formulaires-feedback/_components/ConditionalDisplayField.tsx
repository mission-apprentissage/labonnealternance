"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box } from "@mui/material"
import { getIn, useFormikContext } from "formik"
import { useMemo } from "react"
import { getFeedbackQuestionChoices, getFeedbackShowIfIssue } from "shared/models/feedback-form.model"

import type { IFeedbackFormDraft, IFeedbackQuestionDraft } from "../_utils/questionDrafts"
import { toFeedbackQuestion } from "../_utils/questionDrafts"

const questionLabel = (draft: IFeedbackQuestionDraft, position: number) => `Q${position} · ${draft.label.trim() || "(sans libellé)"}`

/**
 * Case « Affichage conditionnel » d'une question et, cochée, le couple question / réponse qui
 * déclenche son affichage. Absente de la première question.
 *
 * Une condition qui ne tient plus — question visée supprimée ou déplacée après celle-ci, réponse
 * retirée ou renommée — est signalée tout de suite, sans attendre la soumission : l'erreur naît
 * d'une modification faite ailleurs dans le formulaire, l'admin ne la verrait pas sinon. Une
 * condition simplement pas encore renseignée n'est signalée qu'au blur ou à la soumission, comme
 * tout champ obligatoire.
 */
export function ConditionalDisplayField({ question, index, questions }: { question: IFeedbackQuestionDraft; index: number; questions: IFeedbackQuestionDraft[] }) {
  const { errors, touched, setFieldValue, setFieldTouched } = useFormikContext<IFeedbackFormDraft>()
  const name = `questions.${index}`
  const questionIdField = `${name}.showIf.questionId`
  const equalsField = `${name}.showIf.equals`

  // mêmes règles que l'enregistrement (shared), appliquées à la saisie en cours
  const liveQuestions = useMemo(() => questions.map(toFeedbackQuestion), [questions])
  const liveIssue = question.conditional ? getFeedbackShowIfIssue(liveQuestions, index) : null

  const errorFor = (field: "questionId" | "equals", path: string): string | undefined => {
    if (liveIssue?.field === field && liveIssue.reason === "broken") return liveIssue.message
    const formikError = getIn(errors, path)
    return getIn(touched, path) && typeof formikError === "string" ? formikError : undefined
  }

  const { questionId } = question.showIf
  const equals = [question.showIf.equals].flat()[0] ?? ""

  // seules les questions posées avant, et qui ont des réponses à choisir, peuvent servir de condition
  const candidates = questions.slice(0, index).flatMap((draft, position) => (getFeedbackQuestionChoices(liveQuestions[position]).length ? [{ draft, position }] : []))
  const targetPosition = questions.findIndex((draft) => draft.id === questionId)
  const choices = targetPosition === -1 ? [] : getFeedbackQuestionChoices(liveQuestions[targetPosition]).filter((choice) => choice.value)

  // une valeur qui ne figure plus dans la liste reste affichée, nommée, pour que l'erreur désigne quelque chose
  const danglingQuestion =
    questionId && !candidates.some(({ draft }) => draft.id === questionId)
      ? targetPosition === -1
        ? "Question supprimée"
        : `${questionLabel(questions[targetPosition], targetPosition + 1)} (non valable)`
      : null
  const danglingAnswer = equals && !choices.some((choice) => choice.value === equals) ? "Réponse supprimée" : null

  const questionError = errorFor("questionId", questionIdField)
  const equalsError = errorFor("equals", equalsField)

  // La première question n'a rien avant elle : pas de case. Sauf si elle porte déjà une condition
  // (une question conditionnelle remontée en tête) : la case reste alors visible, en erreur, pour
  // pouvoir la décocher plutôt que de perdre la condition sans le dire.
  if (index === 0 && !question.conditional) return null

  return (
    <Box>
      <Checkbox
        small
        style={{ marginBottom: question.conditional ? fr.spacing("3v") : 0 }}
        options={[
          {
            label: "Affichage conditionnel",
            hintText: "La question n'est posée que si une question précédente a reçu une réponse précise.",
            nativeInputProps: {
              checked: question.conditional,
              onChange: (event) => setFieldValue(`${name}.conditional`, event.target.checked),
            },
          },
        ]}
      />

      {question.conditional && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, columnGap: fr.spacing("4v") }}>
          <Select
            label="Question qui conditionne l'affichage"
            hint={candidates.length ? undefined : "Aucune question à choix n'est posée avant celle-ci."}
            state={questionError ? "error" : "default"}
            stateRelatedMessage={questionError}
            nativeSelectProps={{
              name: questionIdField,
              value: questionId,
              // changer de question invalide la réponse choisie : on la remet à choisir
              onChange: (event) => setFieldValue(`${name}.showIf`, { questionId: event.target.value, equals: "" }),
              onBlur: () => setFieldTouched(questionIdField, true),
            }}
          >
            <option value="" disabled>
              Choisissez une question
            </option>
            {candidates.map(({ draft, position }) => (
              <option key={draft.id} value={draft.id}>
                {questionLabel(draft, position + 1)}
              </option>
            ))}
            {danglingQuestion && <option value={questionId}>{danglingQuestion}</option>}
          </Select>

          <Select
            label="Réponse qui affiche cette question"
            disabled={!choices.length && !danglingAnswer}
            state={equalsError ? "error" : "default"}
            stateRelatedMessage={equalsError}
            nativeSelectProps={{
              name: equalsField,
              value: equals,
              onChange: (event) => setFieldValue(equalsField, event.target.value),
              onBlur: () => setFieldTouched(equalsField, true),
            }}
          >
            <option value="" disabled>
              Choisissez une réponse
            </option>
            {choices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
            {danglingAnswer && <option value={equals}>{danglingAnswer}</option>}
          </Select>
        </Box>
      )}
    </Box>
  )
}
