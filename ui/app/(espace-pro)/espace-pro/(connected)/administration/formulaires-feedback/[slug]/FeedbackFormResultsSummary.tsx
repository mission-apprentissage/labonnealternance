import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import dayjs from "dayjs"

import { FAKE_RESULTS } from "./fakeFeedbackResults"

const formatCount = (value: number) => value.toLocaleString("fr-FR")
const formatShare = (part: number, total: number) => `${total ? Math.round((part / total) * 100) : 0} %`

/** Chiffres clés des réponses des usagers : affichages, réponses, complétion, commentaires. */
export function FeedbackFormResultsSummary({ since }: { since: string }) {
  const { displays, responses, completed, comments, whyAnswers } = FAKE_RESULTS
  const indicators = [
    { label: "Widget affiché", value: displays, detail: `depuis le ${dayjs(since).format("DD/MM/YYYY")}` },
    { label: "Réponses (au moins 1 question)", value: responses, detail: `${formatShare(responses, displays)} des affichages` },
    { label: "Réponses complètes", value: completed, detail: `${formatShare(completed, responses)} des réponses` },
    { label: "Commentaires libres", value: comments + whyAnswers, detail: `${comments} commentaires + ${whyAnswers} « pourquoi »` },
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
      {indicators.map(({ label, value, detail }) => (
        <Box
          key={label}
          sx={{
            p: fr.spacing("6v"),
            backgroundColor: fr.colors.decisions.background.default.grey.default,
            border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            "& dd": { m: 0, p: 0 },
          }}
        >
          <Typography component="dt" sx={{ fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("1v") }}>
            {label}
          </Typography>
          <Typography component="dd" sx={{ fontSize: "28px", lineHeight: "36px", fontWeight: 700 }}>
            {formatCount(value)}
          </Typography>
          <Typography component="dd" sx={{ fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default }}>
            {detail}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
