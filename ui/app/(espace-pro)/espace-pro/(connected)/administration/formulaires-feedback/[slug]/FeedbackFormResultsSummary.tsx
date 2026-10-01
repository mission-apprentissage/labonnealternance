import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import dayjs from "dayjs"
import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import type { IFeedbackFormResultsJSON } from "shared/models/feedback-response.model"

import { formatShare } from "./feedbackResults.utils"

type IIndicator = { label: string; value: number | null; detail: string | null; empty: string }

const mentionColor = fr.colors.decisions.text.mention.grey.default

/** Chiffres clés des réponses des usagers : affichages, réponses, complétion, commentaires. */
export function FeedbackFormResultsSummary({ results, questions }: { results: IFeedbackFormResultsJSON; questions: IFeedbackQuestion[] }) {
  const { displays, responses } = results
  const textQuestions = questions.flatMap((question, index) => (question.type === "text" ? [{ question, position: index + 1 }] : []))
  const commentsByQuestion = textQuestions.map(({ question, position }) => ({
    position,
    total: results.questions.find(({ question_id }) => question_id === question.id)?.comments?.total ?? 0,
  }))
  const commentsTotal = commentsByQuestion.reduce((sum, { total }) => sum + total, 0)

  const indicators: IIndicator[] = [
    {
      label: "Widget affiché",
      value: displays.total || null,
      detail: displays.since ? `depuis le ${dayjs(displays.since).format("DD/MM/YYYY")}` : null,
      empty: "Aucun affichage pour l'instant",
    },
    {
      label: "Réponses (au moins 1 question)",
      value: responses.started || null,
      detail: formatShare(responses.started, displays.total) && `${formatShare(responses.started, displays.total)} des affichages`,
      empty: "Aucune réponse pour l'instant",
    },
    {
      label: "Réponses complètes",
      value: responses.completed || null,
      detail: formatShare(responses.completed, responses.started) && `${formatShare(responses.completed, responses.started)} des réponses`,
      empty: "Aucune réponse complète pour l'instant",
    },
    {
      label: "Commentaires libres",
      value: commentsTotal || null,
      // plusieurs questions à texte libre : la part de chacune, comme « 39 en Q5 · 12 en Q4 »
      detail: commentsByQuestion.length > 1 ? commentsByQuestion.map(({ position, total }) => `${total.toLocaleString("fr-FR")} en Q${position}`).join(" · ") : null,
      empty: textQuestions.length ? "Aucun commentaire pour l'instant" : "Aucune question à texte libre dans ce formulaire",
    },
  ]

  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        p: 0,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        columnGap: fr.spacing("4v"),
        rowGap: fr.spacing("6v"),
      }}
    >
      {indicators.map(({ label, value, detail, empty }) => (
        <Box
          key={label}
          sx={{
            p: fr.spacing("6v"),
            backgroundColor: fr.colors.decisions.background.default.grey.default,
            border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            "& dd": { m: 0, p: 0 },
          }}
        >
          <Typography component="dt" sx={{ fontSize: "14px", color: mentionColor, mb: fr.spacing("1v") }}>
            {label}
          </Typography>
          {value === null ? (
            <Typography component="dd" sx={{ fontSize: "16px", lineHeight: "24px", color: mentionColor, mt: fr.spacing("2v") }}>
              {empty}
            </Typography>
          ) : (
            <>
              <Typography component="dd" sx={{ fontSize: "28px", lineHeight: "36px", fontWeight: 700 }}>
                {value.toLocaleString("fr-FR")}
              </Typography>
              {detail && (
                <Typography component="dd" sx={{ fontSize: "14px", color: mentionColor }}>
                  {detail}
                </Typography>
              )}
            </>
          )}
        </Box>
      ))}
    </Box>
  )
}
