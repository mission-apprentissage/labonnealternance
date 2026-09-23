"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, CircularProgress, Typography } from "@mui/material"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"
import type { IFeedbackFormForAdminJSON, IFeedbackFormStatus } from "shared/models/feedback-form.model"

import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { getFeedbackFormsColumns } from "../_utils/feedbackFormsColumns"
import type { IFeedbackFormAction } from "./_components/ConfirmationActionFormulaire"
import { ConfirmationActionFormulaire } from "./_components/ConfirmationActionFormulaire"
import { useFeedbackFormStatusChange } from "./_utils/useFeedbackFormStatusChange"

/**
 * Filtre de statut. Un formulaire archivé n'a plus d'action possible : il n'apparaît que lorsqu'on
 * le demande explicitement, pour ne pas encombrer la liste de travail.
 */
const STATUS_FILTERS = {
  all: { label: "Tous les statuts, hors archivés", statuses: ["draft", "active", "inactive"] },
  active: { label: "Actifs", statuses: ["active"] },
  draft: { label: "Brouillons", statuses: ["draft"] },
  inactive: { label: "Inactifs", statuses: ["inactive"] },
  archived: { label: "Archivés", statuses: ["archived"] },
} as const satisfies Record<string, { label: string; statuses: IFeedbackFormStatus[] }>

type IStatusFilter = keyof typeof STATUS_FILTERS

export function FeedbackFormsList() {
  const [statusFilter, setStatusFilter] = useState<IStatusFilter>("all")

  const { data: forms, isLoading } = useQuery({
    queryKey: ["/admin/feedback-forms", statusFilter],
    queryFn: async () => {
      const { forms } = await apiGet("/admin/feedback-forms", { querystring: { status: [...STATUS_FILTERS[statusFilter].statuses] } })
      return forms
    },
    // garde le tableau affiché pendant le changement de filtre au lieu de le remplacer par un spinner
    placeholderData: keepPreviousData,
  })

  const [pending, setPending] = useState<{ form: IFeedbackFormForAdminJSON; action: IFeedbackFormAction } | null>(null)
  // état d'ouverture distinct du formulaire visé : le garder pendant la fermeture évite que la
  // modale se vide sous les yeux pendant son animation. Setters stables : les colonnes ne sont
  // construites qu'une fois.
  const [isConfirmationOpen, setConfirmationOpen] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const changeStatus = useFeedbackFormStatusChange()
  // les colonnes ne sont construites qu'une fois : la ref leur donne toujours la dernière fonction
  const changeStatusRef = useRef(changeStatus)
  changeStatusRef.current = changeStatus

  const columns = useMemo(
    () =>
      getFeedbackFormsColumns({
        onAction: (form, item) => {
          if (item.kind === "run") {
            changeStatusRef.current(form, item.action)
            return
          }
          if (item.kind === "confirm") {
            setPending({ form, action: item.action })
            setConfirmationOpen(true)
          }
        },
      }),
    []
  )

  const isFiltered = statusFilter !== "all"

  return (
    <>
      <ConfirmationActionFormulaire
        form={pending?.form ?? null}
        action={pending?.action ?? "archive"}
        isOpen={isConfirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        // la modale rend le focus au bouton qui l'a ouverte, retiré avec la ligne : on le replace sur le titre
        onDone={() => requestAnimationFrame(() => titleRef.current?.focus())}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: fr.spacing("4v"), mb: fr.spacing("4v") }}>
        <Box>
          <Typography ref={titleRef} tabIndex={-1} component="h1" className={fr.cx("fr-h3")} sx={{ mb: fr.spacing("1v") }}>
            Formulaires de feedback
          </Typography>
          <Typography sx={{ maxWidth: "720px", color: fr.colors.decisions.text.default.grey.default }}>
            Questionnaires affichés aux usagers après une interaction avec une fonctionnalité. Un seul formulaire actif par page à la fois.
          </Typography>
        </Box>
        <Button linkProps={{ href: PAGES.static.backAdminFeedbackFormCreation.getPath() }}>Créer un formulaire</Button>
      </Box>

      {/* toujours affiché, même liste vide : c'est le seul chemin vers les formulaires archivés */}
      <Select
        label="Statut"
        style={{ maxWidth: 320 }}
        nativeSelectProps={{
          value: statusFilter,
          onChange: (event) => setStatusFilter(event.target.value as IStatusFilter),
        }}
      >
        {Object.entries(STATUS_FILTERS).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !forms?.length ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography component="h2" className={fr.cx("fr-text--lg", "fr-text--bold")} sx={{ mb: fr.spacing("1v") }}>
            {isFiltered ? "Aucun formulaire pour ce statut" : "Aucun formulaire de feedback"}
          </Typography>
          <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default }}>
            {isFiltered
              ? "Choisissez un autre statut pour afficher d'autres formulaires."
              : "Créez un premier formulaire pour recueillir l'avis des usagers après une interaction."}
          </Typography>
        </Box>
      ) : (
        <VirtualTable
          caption={`Formulaires de feedback — ${STATUS_FILTERS[statusFilter].label.toLowerCase()} (${forms.length})`}
          columns={columns}
          data={forms}
          defaultSortBy={[{ id: "updated_at", desc: true }]}
          hideSearch={true}
        />
      )}
    </>
  )
}
