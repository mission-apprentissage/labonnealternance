"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"
import type { INewsletterJSON } from "shared/models/newsletter.model"
import { NEWSLETTER_PUBLIC_LIMIT } from "shared/models/newsletter.model"

import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { getNewslettersColumns } from "../_utils/newslettersColumns"
import { FeedbackFormLoadError } from "../formulaires-feedback/_components/FeedbackFormLoadError"
import { NewsletterDeleteModal } from "./_components/NewsletterDeleteModal"
import { NewsletterFormModal } from "./_components/NewsletterFormModal"

export function NewslettersList() {
  const {
    data: newsletters,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/admin/newsletters"],
    queryFn: async () => (await apiGet("/admin/newsletters", {})).newsletters,
    retry: false,
  })

  // états d'ouverture distincts de l'infolettre visée : la garder pendant la fermeture évite que la modale se vide pendant son animation
  const [edited, setEdited] = useState<INewsletterJSON | null>(null)
  const [isFormOpen, setFormOpen] = useState(false)
  const [deleted, setDeleted] = useState<INewsletterJSON | null>(null)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)

  const columns = useMemo(
    () =>
      getNewslettersColumns({
        onEdit: (newsletter) => {
          setEdited(newsletter)
          setFormOpen(true)
        },
        onDelete: (newsletter) => {
          setDeleted(newsletter)
          setDeleteOpen(true)
        },
      }),
    []
  )

  const openCreation = () => {
    setEdited(null)
    setFormOpen(true)
  }

  return (
    <>
      <NewsletterFormModal newsletter={edited} isOpen={isFormOpen} onClose={() => setFormOpen(false)} />
      <NewsletterDeleteModal
        newsletter={deleted}
        isOpen={isDeleteOpen}
        onClose={() => setDeleteOpen(false)}
        // la modale rend le focus au bouton qui l'a ouverte, retiré avec la ligne : on le replace sur le titre
        onDone={() => requestAnimationFrame(() => titleRef.current?.focus())}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: fr.spacing("4v"), mb: fr.spacing("6v") }}>
        <Box>
          <Typography ref={titleRef} tabIndex={-1} component="h1" className={fr.cx("fr-h3")} sx={{ mb: fr.spacing("1v") }}>
            Infolettres
          </Typography>
          <Typography sx={{ maxWidth: "720px", color: fr.colors.decisions.text.default.grey.default }}>
            Éditions de La lettre de l'alternance publiées sur LinkedIn. Les {NEWSLETTER_PUBLIC_LIMIT} plus récentes parmi celles affichées apparaissent sur la page{" "}
            <a className={fr.cx("fr-link")} href={PAGES.static.laLettreDeLAlternance.getPath()} target="_blank" rel="noopener noreferrer">
              La lettre de l'alternance
              <span className="fr-sr-only"> - nouvelle fenêtre</span>
            </a>
            .
          </Typography>
        </Box>
        {!isError && (
          <Button iconId="fr-icon-add-line" iconPosition="left" onClick={openCreation}>
            Ajouter une infolettre
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Box sx={{ py: 4 }}>
          <FeedbackFormLoadError error={error} subject="la liste des infolettres" onRetry={() => refetch()} />
        </Box>
      ) : !newsletters?.length ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography component="h2" className={fr.cx("fr-text--lg", "fr-text--bold")} sx={{ mb: fr.spacing("1v") }}>
            Aucune infolettre
          </Typography>
          <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default }}>Ajoutez la dernière édition publiée sur LinkedIn pour l'afficher sur le site.</Typography>
        </Box>
      ) : (
        <VirtualTable caption={`Infolettres (${newsletters.length})`} columns={columns} data={newsletters} defaultSortBy={[{ id: "edition_date", desc: true }]} hideSearch={true} />
      )}
    </>
  )
}
