import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { IFeedbackQuestion } from "shared/models/feedback-form.model"

import { formatAnswer } from "@/components/feedback/feedbackWidget.utils"

import { QUESTION_TYPE_LABEL } from "../_utils/questionDrafts"

/** « obligatoire · 3 options : A, B, C · si Q1 = Pas convaincu » : ce qu'il faut savoir d'une question sans l'ouvrir. */
function describeQuestion(question: IFeedbackQuestion, questions: IFeedbackQuestion[]): string {
  const details = [question.required ? "obligatoire" : "facultative"]
  switch (question.type) {
    case "rating":
      details.push("Très bien · Moyen · Pas convaincu")
      break
    case "single_select":
    case "multi_select":
      details.push(`${question.options.length} options : ${question.options.map(({ label }) => label).join(", ")}`)
      break
    case "text":
      details.push(`${question.maxLength} caractères max`)
      break
  }
  const targetIndex = question.showIf ? questions.findIndex(({ id }) => id === question.showIf?.questionId) : -1
  if (question.showIf && targetIndex !== -1) {
    details.push(`si Q${targetIndex + 1} = ${formatAnswer(questions[targetIndex], question.showIf.equals)}`)
  }
  return details.join(" · ")
}

/** Récapitulatif des questions, dans l'ordre où le widget les pose. */
export function FeedbackFormDefinition({ questions }: { questions: IFeedbackQuestion[] }) {
  if (questions.length === 0) {
    return <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default }}>Ce formulaire n'a pas encore de question.</Typography>
  }

  return (
    <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none", border: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}>
      {questions.map((question, index) => (
        <Box
          component="li"
          key={question.id}
          sx={{
            display: "flex",
            gap: fr.spacing("3v"),
            alignItems: "flex-start",
            p: "12px 16px",
            borderTop: index === 0 ? "none" : `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              flexShrink: 0,
              backgroundColor: fr.colors.decisions.background.actionHigh.blueFrance.default,
              color: fr.colors.decisions.text.inverted.grey.default,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {index + 1}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>
              <span className={fr.cx("fr-sr-only")}>Question {index + 1}, </span>
              {QUESTION_TYPE_LABEL[question.type]}
            </Typography>
            <Typography sx={{ fontWeight: 700, mb: 0 }}>{question.label}</Typography>
            <Typography sx={{ fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>{describeQuestion(question, questions)}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}
