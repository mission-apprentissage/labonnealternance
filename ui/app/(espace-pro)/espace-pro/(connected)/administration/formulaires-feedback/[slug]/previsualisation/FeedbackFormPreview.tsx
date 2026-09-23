"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { ZFeedbackFormFields } from "shared/models/feedback-form.model"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { FeedbackFormStatusBadge } from "../../../_utils/feedbackFormsColumns"
import { PreviewTrialCard } from "./PreviewTrialCard"
import type { IPreviewTrial } from "./previewTrials"
import { createTrial } from "./previewTrials"

/**
 * Prévisualisation d'un formulaire enregistré, quel que soit son statut. Une page et non une
 * modale (contrairement à la maquette) : elle s'ouvre depuis la liste, se partage par son URL et
 * laisse la place aux deux colonnes.
 *
 * À gauche, le widget réel en variante inline ; à droite, un encart par essai. « Recommencer »
 * remonte le widget à zéro et ouvre un nouvel encart au-dessus des précédents, qui restent
 * consultables pour comparer les parcours. Rien n'est enregistré : tout vit dans l'état de la page.
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

  // schéma de lecture : la réponse de l'API perd ses valeurs par défaut à la sérialisation
  const questions = useMemo(() => (form ? ZFeedbackFormFields.shape.questions.parse(form.questions) : []), [form])

  // le plus récent en tête ; le widget est monté avec la clé de l'essai en cours pour repartir de zéro
  const [trials, setTrials] = useState<IPreviewTrial[]>(() => [createTrial(1)])
  const [announcement, setAnnouncement] = useState("")
  const [currentTrial] = trials

  const restart = () => {
    const next = createTrial(currentTrial.id + 1)
    setTrials([next, ...trials])
    setAnnouncement(`Essai ${next.id} commencé`)
  }

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

      {/* même mise en avant que la question en cours dans les essais : pas de CSS DSFR supplémentaire à charger */}
      <Typography
        sx={{
          p: "12px 16px",
          mb: fr.spacing("6v"),
          backgroundColor: fr.colors.decisions.background.contrast.info.default,
          borderLeft: `3px solid ${fr.colors.decisions.border.actionHigh.blueFrance.default}`,
        }}
      >
        Une prévisualisation ne remplace pas un test sur le site : elle ne joue pas le déclenchement (pages, nombre d'interactions), seulement l'enchaînement des questions.
      </Typography>

      {/* 2/5 – 3/5 en desktop ; empilées (aperçu au-dessus) en dessous de lg, tablette comprise */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 3fr" }, gap: fr.spacing("6v"), alignItems: "start" }}>
        <Box component="section" aria-labelledby="previsualisation-apercu-titre">
          <Typography id="previsualisation-apercu-titre" component="h2" className={fr.cx("fr-text--md", "fr-text--bold")} sx={{ mb: fr.spacing("3v") }}>
            Aperçu du widget
          </Typography>
          {questions.length === 0 ? (
            <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default }}>Ce formulaire n'a pas encore de question : il n'y a rien à prévisualiser.</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: fr.spacing("3v") }}>
              {currentTrial.status === "closed" ? (
                <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>Le widget a été fermé, comme un usager peut le faire à tout moment.</Typography>
              ) : (
                <FeedbackWidget
                  key={currentTrial.id}
                  questions={questions}
                  variant="inline"
                  onProgress={(progress) => setTrials(([latest, ...previous]) => [{ ...latest, ...progress }, ...previous])}
                />
              )}
              <Button type="button" priority="secondary" size="small" iconId="fr-icon-refresh-line" iconPosition="left" onClick={restart}>
                Recommencer
              </Button>
              <Typography className={fr.cx("fr-text--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>
                Sur le site, ce même widget s'affiche dans le coin de l'écran plutôt que dans la page.
              </Typography>
            </Box>
          )}
        </Box>
        <Box component="section" aria-labelledby="previsualisation-essais-titre">
          <Typography id="previsualisation-essais-titre" component="h2" className={fr.cx("fr-text--md", "fr-text--bold")} sx={{ mb: fr.spacing("3v") }}>
            Essais
          </Typography>
          {questions.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
              {trials.map((trial) => (
                <PreviewTrialCard key={trial.id} trial={trial} questions={questions} isLatest={trial.id === currentTrial.id} />
              ))}
            </Box>
          )}
          <p className={fr.cx("fr-sr-only")} aria-live="polite">
            {announcement}
          </p>
        </Box>
      </Box>
    </>
  )
}
