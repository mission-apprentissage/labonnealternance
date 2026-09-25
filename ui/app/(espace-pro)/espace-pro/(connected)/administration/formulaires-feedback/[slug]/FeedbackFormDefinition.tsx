import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { FEEDBACK_RATING_OPTIONS } from "shared/models/feedback-form.model"

import { formatAnswer } from "@/components/feedback/feedbackWidget.utils"

import { QUESTION_TYPE_LABEL } from "../_utils/questionDrafts"

/** « 3 options », « 500 caractères max » : le volume de la question, sans le détail des réponses. */
function describeSize(question: IFeedbackQuestion): string {
  switch (question.type) {
    case "rating":
      return `${FEEDBACK_RATING_OPTIONS.length} options`
    case "single_select":
    case "multi_select":
      return `${question.options.length} options`
    case "text":
      return `${question.maxLength} caractères max`
  }
}

function describeCondition(question: IFeedbackQuestion, questions: IFeedbackQuestion[]): string | null {
  const targetIndex = question.showIf ? questions.findIndex(({ id }) => id === question.showIf?.questionId) : -1
  if (!question.showIf || targetIndex === -1) return null
  return `si Q${targetIndex + 1} = ${formatAnswer(questions[targetIndex], question.showIf.equals)}`
}

const mention = { fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default, mb: 0 }

/**
 * Récapitulatif des questions, dans l'ordre où le widget les pose. En desktop, une ligne par
 * question : les cartes partagent la grille de la liste (subgrid), chaque information reste
 * dans la même colonne d'une carte à l'autre.
 */
export function FeedbackFormDefinition({ questions }: { questions: IFeedbackQuestion[] }) {
  if (questions.length === 0) {
    return <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>Ce formulaire n'a pas encore de question.</Typography>
  }

  const conditions = questions.map((question) => describeCondition(question, questions))
  const hasConditions = conditions.some(Boolean)

  return (
    <Box
      component="ol"
      sx={{
        m: 0,
        p: 0,
        listStyle: "none",
        display: { xs: "flex", md: "grid" },
        flexDirection: "column",
        gridTemplateColumns: `max-content max-content minmax(0, 1fr) max-content max-content${hasConditions ? " max-content" : ""}`,
        columnGap: fr.spacing("4v"),
        rowGap: fr.spacing("2v"),
      }}
    >
      {questions.map((question, index) => (
        <Box
          component="li"
          key={question.id}
          sx={{
            gridColumn: "1 / -1",
            display: { xs: "flex", md: "grid" },
            flexWrap: "wrap",
            gridTemplateColumns: "subgrid",
            alignItems: "baseline",
            columnGap: fr.spacing("4v"),
            rowGap: fr.spacing("1v"),
            p: fr.spacing("4v"),
            backgroundColor: fr.colors.decisions.background.default.grey.default,
            border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          }}
        >
          <Typography component="span" sx={{ fontWeight: 700, mb: 0 }}>
            <span aria-hidden="true">Q{index + 1}</span>
            <span className={fr.cx("fr-sr-only")}>Question {index + 1}, </span>
          </Typography>
          <Typography component="span" sx={mention}>
            {QUESTION_TYPE_LABEL[question.type]}
          </Typography>
          <Typography component="span" sx={{ fontWeight: 700, mb: 0, flexBasis: { xs: "100%", md: "auto" }, order: { xs: -1, md: 0 } }}>
            {question.label}
          </Typography>
          <Typography component="span" sx={mention}>
            {question.required ? "obligatoire" : "facultative"}
          </Typography>
          <Typography component="span" sx={mention}>
            {describeSize(question)}
          </Typography>
          {hasConditions && (
            <Typography component="span" sx={mention}>
              {conditions[index]}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )
}
