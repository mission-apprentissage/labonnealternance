"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, CircularProgress, Typography } from "@mui/material"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"
import type { IFeedbackFormForAdminJSON, IFeedbackFormStatus } from "shared/models/feedback-form.model"
import { stringNormaliser } from "shared/utils/string-utils"

import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { getFeedbackFormsColumns } from "../_utils/feedbackFormsColumns"
import type { IFeedbackFormAction } from "./_components/ConfirmationActionFormulaire"
import { ConfirmationActionFormulaire } from "./_components/ConfirmationActionFormulaire"
import { FeedbackFormLoadError } from "./_components/FeedbackFormLoadError"
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
  const [search, setSearch] = useState("")

  const {
    data: forms,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/admin/feedback-forms", statusFilter],
    queryFn: async () => {
      const { forms } = await apiGet("/admin/feedback-forms", { querystring: { status: [...STATUS_FILTERS[statusFilter].statuses] } })
      return forms
    },
    // garde le tableau affiché pendant le changement de filtre au lieu de le remplacer par un spinner
    placeholderData: keepPreviousData,
    retry: false,
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
  // sans casse, accents ni ponctuation : « fiche_entreprise » trouve aussi le titre « Fiche entreprise — utilité »
  const searchPattern = stringNormaliser(search)
  const visibleForms = useMemo(
    () =>
      searchPattern ? (forms ?? []).filter(({ title, slug }) => stringNormaliser(title).includes(searchPattern) || stringNormaliser(slug).includes(searchPattern)) : (forms ?? []),
    [forms, searchPattern]
  )

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
        {/* en panne, ni création ni filtres : rien de ce qu'ils promettent ne fonctionnerait */}
        {!isError && <Button linkProps={{ href: PAGES.static.backAdminFeedbackFormCreation.getPath() }}>Créer un formulaire</Button>}
      </Box>

      {/* DSFR retire la marge basse du dernier groupe de champs : sans marge commune, les champs alignés par le bas sont décalés */}
      {!isError && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            columnGap: fr.spacing("4v"),
            "& > .fr-input-group, & > .fr-select-group": { mb: fr.spacing("6v") },
          }}
        >
          <Input
            label="Rechercher par titre ou slug"
            hintText="Une partie du titre ou du slug"
            style={{ width: 480, maxWidth: "100%" }}
            nativeInputProps={{
              type: "search",
              value: search,
              onChange: (event) => setSearch(event.target.value),
            }}
          />
          {/* affiché même liste vide : c'est le seul chemin vers les formulaires archivés */}
          <Select
            label="Statut"
            hint="Hors archivés par défaut"
            style={{ width: 320, maxWidth: "100%" }}
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
        </Box>
      )}
      {/* le tableau se met à jour à chaque frappe, sans validation : on annonce le nombre de résultats (RGAA 7.5) */}
      <p role="status" className={fr.cx("fr-sr-only")}>
        {searchPattern && forms ? `${visibleForms.length} formulaire${visibleForms.length > 1 ? "s" : ""} pour « ${search.trim()} »` : ""}
      </p>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Box sx={{ py: 4 }}>
          <FeedbackFormLoadError error={error} subject="la liste des formulaires" onRetry={() => refetch()} />
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
      ) : !visibleForms.length ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography component="h2" className={fr.cx("fr-text--lg", "fr-text--bold")} sx={{ mb: fr.spacing("1v") }}>
            Aucun formulaire pour « {search.trim()} »
          </Typography>
          <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default }}>
            Aucun titre ni slug ne contient ce motif. Modifiez-le ou videz le champ pour afficher tous les formulaires.
          </Typography>
        </Box>
      ) : (
        <VirtualTable
          caption={`Formulaires de feedback — ${STATUS_FILTERS[statusFilter].label.toLowerCase()} (${visibleForms.length})`}
          columns={columns}
          data={visibleForms}
          defaultSortBy={[{ id: "updated_at", desc: true }]}
          hideSearch={true}
        />
      )}
    </>
  )
}
