"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { FeedbackFormStatusBadge } from "../../../_utils/feedbackFormsColumns"

/**
 * Prévisualisation d'un formulaire enregistré, quel que soit son statut. Une page et non une
 * modale (contrairement à la maquette) : elle s'ouvre depuis la liste, se partage par son URL et
 * laisse la place aux deux colonnes.
 *
 * Squelette : les colonnes « Aperçu du widget » et « Essais » seront remplies aux étapes suivantes.
 */
export function FeedbackFormPreview() {
  const { slug } = useParams() as { slug: string }
  const {
    data: form,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/admin/feedback-forms/:slug", slug],
    queryFn: () => apiGet("/admin/feedback-forms/:slug", { params: { slug } }),
    retry: false,
  })

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  if (isError || !form) {
    return (
      <>
        <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.dynamic.backAdminFeedbackFormPreview({ slug })]} />
        <Alert severity="error" title="Formulaire introuvable" description="Ce formulaire n'existe pas ou a été supprimé." />
      </>
    )
  }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.dynamic.backAdminFeedbackFormPreview({ slug, title: form.title })]} />

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: fr.spacing("4v"), mb: fr.spacing("6v") }}>
        <Box>
          <Typography component="h1" className={fr.cx("fr-h3")} sx={{ mb: fr.spacing("2v") }}>
            Prévisualisation — {form.title}
          </Typography>
          {/* le badge seul ne dirait pas à un lecteur d'écran ce qu'il qualifie : « Statut : » le précède */}
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v"), mb: fr.spacing("2v") }}>
            <Typography component="span" className={fr.cx("fr-text--sm")} sx={{ mb: 0 }}>
              Statut :
            </Typography>
            <FeedbackFormStatusBadge status={form.status} />
            <Typography component="span" className={fr.cx("fr-text--sm")} sx={{ mb: 0, color: fr.colors.decisions.text.mention.grey.default }}>
              · v{form.version} ·{" "}
              <Box component="code" sx={{ fontFamily: "monospace" }}>
                {form.slug}
              </Box>
            </Typography>
          </Box>
          <Typography className={fr.cx("fr-text--sm")} sx={{ mb: 0, color: fr.colors.decisions.text.mention.grey.default }}>
            Tel que l'usager le verra · rien n'est enregistré
          </Typography>
        </Box>
        <Button priority="secondary" linkProps={{ href: PAGES.static.backAdminFeedbackForms.getPath() }}>
          Retour à la liste
        </Button>
      </Box>

      {/* 2/5 – 3/5 en desktop ; empilées (aperçu au-dessus) en dessous de lg, tablette comprise */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 3fr" }, gap: fr.spacing("6v"), alignItems: "start" }}>
        <Box component="section" aria-labelledby="previsualisation-apercu-titre">
          <Typography id="previsualisation-apercu-titre" component="h2" className={fr.cx("fr-text--md", "fr-text--bold")} sx={{ mb: fr.spacing("3v") }}>
            Aperçu du widget
          </Typography>
          <PreviewPlaceholder />
        </Box>
        <Box component="section" aria-labelledby="previsualisation-essais-titre">
          <Typography id="previsualisation-essais-titre" component="h2" className={fr.cx("fr-text--md", "fr-text--bold")} sx={{ mb: fr.spacing("3v") }}>
            Essais
          </Typography>
          <PreviewPlaceholder />
        </Box>
      </Box>

      <Typography className={fr.cx("fr-text--sm")} sx={{ mt: fr.spacing("6v"), color: fr.colors.decisions.text.mention.grey.default }}>
        Une prévisualisation ne remplace pas un test sur le site : elle ne joue pas le déclenchement (pages, nombre d'interactions), seulement l'enchaînement des questions.
      </Typography>
    </>
  )
}

function PreviewPlaceholder() {
  return (
    <Box
      sx={{
        minHeight: 320,
        border: `1px dashed ${fr.colors.decisions.border.default.grey.default}`,
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
      }}
    />
  )
}
