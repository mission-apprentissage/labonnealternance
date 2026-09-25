"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import { ZFeedbackFormFields } from "shared/models/feedback-form.model"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { FeedbackFormStatusBadge } from "../../_utils/feedbackFormsColumns"
import type { IFeedbackFormAction } from "../_components/ConfirmationActionFormulaire"
import { ConfirmationActionFormulaire } from "../_components/ConfirmationActionFormulaire"
import { FeedbackFormLoadError } from "../_components/FeedbackFormLoadError"
import { getFeedbackFormActions } from "../_utils/feedbackFormActions"
import { useFeedbackFormStatusChange } from "../_utils/useFeedbackFormStatusChange"
import { FeedbackFormDefinition } from "./FeedbackFormDefinition"
import { FeedbackFormResultsSummary } from "./FeedbackFormResultsSummary"
import { FeedbackQuestionStats } from "./FeedbackQuestionStats"

/**
 * Page de résultats d'un formulaire, sans onglets : les résultats en tête (chiffres clés puis détail par question), puis le
 * récapitulatif de la définition. Porte les mêmes actions que le menu de la liste, les
 * destructives passant par la même modale de confirmation.
 */
export function FeedbackFormDetail() {
  const { slug } = useParams() as { slug: string }
  const router = useRouter()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [pendingAction, setPendingAction] = useState<IFeedbackFormAction>("archive")
  const [isConfirmationOpen, setConfirmationOpen] = useState(false)
  const changeStatus = useFeedbackFormStatusChange()

  const {
    data: form,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/admin/feedback-forms/:slug", slug],
    queryFn: () => apiGet("/admin/feedback-forms/:slug", { params: { slug } }),
    retry: false,
  })

  const results = useQuery({
    queryKey: ["/admin/feedback-forms/:slug/results", slug],
    queryFn: () => apiGet("/admin/feedback-forms/:slug/results", { params: { slug } }),
    retry: false,
  })

  // schéma de lecture : la réponse de l'API perd ses valeurs par défaut à la sérialisation
  const questions = useMemo(() => (form ? ZFeedbackFormFields.shape.questions.parse(form.questions) : []), [form])

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  if (isError || !form) {
    return (
      <>
        <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.dynamic.backAdminFeedbackFormDetail({ slug })]} />
        <FeedbackFormLoadError
          error={error}
          subject="ce formulaire"
          notFound={{ title: "Formulaire introuvable", description: "Ce formulaire n'existe pas ou a été supprimé." }}
          onRetry={() => refetch()}
        />
      </>
    )
  }

  const actions = getFeedbackFormActions(form).filter(({ id }) => id !== "results")

  // les boutons changent avec le statut (celui qui vient d'être activé a disparu) : le focus va au titre
  const focusTitle = () => requestAnimationFrame(() => titleRef.current?.focus())

  const onDone = async () => {
    if (pendingAction === "delete") {
      router.push(PAGES.static.backAdminFeedbackForms.getPath())
      return
    }
    await refetch()
    focusTitle()
  }

  const metadata = [
    { label: "Slug", value: <Box component="code">{form.slug}</Box> },
    { label: "Pages", value: form.trigger.scope?.length ? form.trigger.scope.join(", ") : "—" },
    { label: "Déclenchement", value: `après ${form.trigger.minInteractions} interaction${(form.trigger.minInteractions ?? 1) > 1 ? "s" : ""}` },
    { label: "Créé le", value: dayjs(form.created_at).format("DD/MM/YYYY") },
    { label: "Modifié le", value: dayjs(form.updated_at).format("DD/MM/YYYY") },
  ]

  return (
    <>
      <ConfirmationActionFormulaire form={form} action={pendingAction} isOpen={isConfirmationOpen} onClose={() => setConfirmationOpen(false)} onDone={onDone} />
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.dynamic.backAdminFeedbackFormDetail({ slug, title: form.title })]} />

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: fr.spacing("4v"), mb: fr.spacing("6v") }}>
        <Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("3v"), mb: fr.spacing("3v") }}>
            <Typography ref={titleRef} tabIndex={-1} component="h1" className={fr.cx("fr-h3")} sx={{ mb: 0 }}>
              {form.title}
            </Typography>
            <Typography component="span" className={fr.cx("fr-sr-only")}>
              Statut :
            </Typography>
            <FeedbackFormStatusBadge status={form.status} />
          </Box>
          {/* p: 0 sur dl et dd : le DSFR leur donne un retrait de liste */}
          <Box component="dl" sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("6v"), rowGap: fr.spacing("2v"), m: 0, p: 0 }}>
            {metadata.map(({ label, value }) => (
              <Box key={label}>
                <Typography component="dt" sx={{ fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
                  {label}
                </Typography>
                <Typography component="dd" sx={{ fontSize: "14px", m: 0, p: 0 }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("2v") }}>
          {actions.map((action) => {
            switch (action.kind) {
              case "link":
                return (
                  <Button key={action.id} priority="secondary" linkProps={{ href: action.href }}>
                    {action.label}
                  </Button>
                )
              case "run":
                return (
                  <Button
                    key={action.id}
                    priority="secondary"
                    onClick={async () => {
                      if (await changeStatus(form, action.action)) focusTitle()
                    }}
                  >
                    {action.label}
                  </Button>
                )
              case "confirm":
                return (
                  <Button
                    key={action.id}
                    priority="secondary"
                    onClick={() => {
                      setPendingAction(action.action)
                      setConfirmationOpen(true)
                    }}
                  >
                    {action.label}
                  </Button>
                )
            }
          })}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="resultats-titre" sx={{ mb: fr.spacing("8v") }}>
        <Typography id="resultats-titre" component="h2" className={fr.cx("fr-h5")} sx={{ mb: fr.spacing("3v") }}>
          Résultats
        </Typography>
        {results.isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress aria-label="Chargement des résultats" />
          </Box>
        ) : results.isError || !results.data ? (
          <FeedbackFormLoadError error={results.error} subject="les résultats" onRetry={() => results.refetch()} />
        ) : (
          <>
            <FeedbackFormResultsSummary results={results.data} questions={questions} />
            {questions.length > 0 && (
              <Box sx={{ mt: fr.spacing("6v") }}>
                <FeedbackQuestionStats questions={questions} results={results.data} />
              </Box>
            )}
          </>
        )}
      </Box>

      <Box
        component="section"
        aria-labelledby="definition-titre"
        sx={{
          p: fr.spacing("6v"),
          backgroundColor: fr.colors.decisions.background.alt.grey.default,
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: fr.spacing("2v"), mb: fr.spacing("3v") }}>
          <Typography id="definition-titre" component="h2" className={fr.cx("fr-h5")} sx={{ mb: 0 }}>
            Définition du formulaire ({questions.length} question{questions.length > 1 ? "s" : ""})
          </Typography>
          <Typography className={fr.cx("fr-text--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>
            Ordre d'affichage, une question à la fois
          </Typography>
        </Box>
        <FeedbackFormDefinition questions={questions} />
      </Box>
    </>
  )
}
