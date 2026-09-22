"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { getFeedbackFormsColumns } from "../_utils/feedbackFormsColumns"

export function FeedbackFormsList() {
  const { data: forms, isLoading } = useQuery({
    queryKey: ["/admin/feedback-forms"],
    queryFn: async () => {
      const { forms } = await apiGet("/admin/feedback-forms", { querystring: {} })
      return forms
    },
  })

  const columns = useMemo(() => getFeedbackFormsColumns(), [])

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: fr.spacing("4v"), mb: fr.spacing("4v") }}>
        <Box>
          <Typography component="h1" className={fr.cx("fr-h3")} sx={{ mb: fr.spacing("1v") }}>
            Formulaires de feedback
          </Typography>
          <Typography sx={{ maxWidth: "720px", color: fr.colors.decisions.text.default.grey.default }}>
            Questionnaires affichés aux usagers après une interaction avec une fonctionnalité. Un seul formulaire actif par page à la fois.
          </Typography>
        </Box>
        <Button linkProps={{ href: PAGES.static.backAdminFeedbackFormCreation.getPath() }}>Créer un formulaire</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !forms?.length ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography component="h2" className={fr.cx("fr-text--lg", "fr-text--bold")} sx={{ mb: fr.spacing("1v") }}>
            Aucun formulaire de feedback
          </Typography>
          <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default }}>
            Créez un premier formulaire pour recueillir l'avis des usagers après une interaction.
          </Typography>
        </Box>
      ) : (
        <VirtualTable caption={`Formulaires de feedback (${forms.length})`} columns={columns} data={forms} defaultSortBy={[{ id: "updated_at", desc: true }]} hideSearch={true} />
      )}
    </>
  )
}
