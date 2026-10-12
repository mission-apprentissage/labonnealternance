import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import { Box, Typography } from "@mui/material"
import type { IFeedbackQuestion } from "shared/models/feedback-form.model"

import { formatAnswer } from "@/components/feedback/feedbackWidget.utils"

import type { IPreviewTrial, IQuestionTrialStatus } from "./previewTrials"
import { getQuestionStatuses, summarizeStatuses } from "./previewTrials"

const TRIAL_STATUS_BADGE: Record<IPreviewTrial["status"], { label: string; severity: "info" | "success" | "warning" }> = {
  in_progress: { label: "En cours", severity: "info" },
  completed: { label: "Terminé", severity: "success" },
  closed: { label: "Fermé par l'usager", severity: "warning" },
}

function QuestionStatus({ status }: { status: IQuestionTrialStatus }) {
  const { text, color, bold } = (() => {
    const decisions = fr.colors.decisions
    switch (status.kind) {
      case "answered":
        return { text: `répondue · ${status.answer}`, color: decisions.text.default.success.default }
      case "skipped":
        return { text: "passée", color: decisions.text.mention.grey.default }
      case "current":
        return { text: "en cours", color: decisions.text.actionHigh.blueFrance.default, bold: true }
      case "closed_here":
        return { text: "fermé à cette question", color: decisions.text.default.warning.default, bold: true }
      case "upcoming":
        return { text: "à venir", color: decisions.text.mention.grey.default }
      case "not_asked":
        return { text: "non posée", color: decisions.text.mention.grey.default }
      case "hidden":
        return { text: "masquée — condition non remplie", color: decisions.text.default.warning.default }
    }
  })()
  return (
    <Typography component="span" sx={{ fontSize: "14px", color, fontWeight: bold ? 700 : 400, textAlign: "right", flexShrink: 0, maxWidth: "50%" }}>
      {text}
    </Typography>
  )
}

/** « · si Q1 = Pas convaincu » : rappelle la condition d'une question, pour lire un parcours où elle a été masquée. */
function conditionHint(question: IFeedbackQuestion, questions: IFeedbackQuestion[]): string | null {
  if (!question.showIf) return null
  const targetIndex = questions.findIndex(({ id }) => id === question.showIf?.questionId)
  if (targetIndex === -1) return null
  return `· si Q${targetIndex + 1} = ${formatAnswer(questions[targetIndex], question.showIf.equals)}`
}

/** Parcours d'un essai : chaque question avec sa réponse, ou ce qu'il en est advenu. */
export function PreviewTrialCard({ trial, questions, isLatest }: { trial: IPreviewTrial; questions: IFeedbackQuestion[]; isLatest: boolean }) {
  const statuses = getQuestionStatuses(questions, trial)
  const badge = TRIAL_STATUS_BADGE[trial.status]
  const titleId = `essai-${trial.id}-titre`

  return (
    <Box
      component="article"
      aria-labelledby={titleId}
      sx={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        // l'essai en cours se détache ; les précédents, conservés en dessous, passent au second plan
        backgroundColor: isLatest ? fr.colors.decisions.background.default.grey.default : fr.colors.decisions.background.alt.grey.default,
        p: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: fr.spacing("2v") }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("2v") }}>
          <Typography id={titleId} component="h3" sx={{ fontSize: "15px", fontWeight: 700, mb: 0 }}>
            Essai {trial.id}
          </Typography>
          <Badge small noIcon severity={badge.severity}>
            {badge.label}
          </Badge>
        </Box>
        <Typography component="span" sx={{ fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
          {summarizeStatuses(statuses)}
        </Typography>
      </Box>

      <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
        {questions.map((question, index) => {
          const status = statuses[index]
          const isCurrent = status.kind === "current"
          const hint = conditionHint(question, questions)
          return (
            <Box
              component="li"
              key={question.id}
              aria-current={isCurrent ? "step" : undefined}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "14px",
                lineHeight: "20px",
                ...(isCurrent
                  ? {
                      p: "6px 8px",
                      mx: "-8px",
                      backgroundColor: fr.colors.decisions.background.contrast.info.default,
                      borderLeft: `3px solid ${fr.colors.decisions.border.actionHigh.blueFrance.default}`,
                    }
                  : {}),
                ...(status.kind === "hidden" ? { opacity: 0.6 } : {}),
              }}
            >
              <Typography component="span" sx={{ fontSize: "14px" }}>
                <strong>Q{index + 1}</strong> {question.label}
                {hint && (
                  <Typography component="span" sx={{ fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
                    {" "}
                    {hint}
                  </Typography>
                )}
              </Typography>
              <QuestionStatus status={status} />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
