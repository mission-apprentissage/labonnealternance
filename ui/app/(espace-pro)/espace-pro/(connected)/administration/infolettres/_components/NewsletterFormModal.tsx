"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useRef, useState } from "react"
import type { INewsletterJSON } from "shared/models/newsletter.model"
import { ZNewsletterInput } from "shared/models/newsletter.model"

import { useToast } from "@/app/hooks/useToast"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { ApiError, apiPost, apiPut } from "@/utils/api.utils"
import { toNewsletterDateInputValue } from "@/utils/newsletter.utils"

type IDraft = { title: string; edition_date: string; linkedin_url: string; is_visible: boolean }
type IField = Exclude<keyof IDraft, "is_visible">

const FIELDS: IField[] = ["title", "edition_date", "linkedin_url"]

const toDraft = (newsletter: INewsletterJSON | null): IDraft =>
  newsletter
    ? { title: newsletter.title, edition_date: toNewsletterDateInputValue(newsletter.edition_date), linkedin_url: newsletter.linkedin_url, is_visible: newsletter.is_visible }
    : { title: "", edition_date: "", linkedin_url: "", is_visible: true }

/** Erreur par champ, dans l'ordre d'affichage. Une date vide est rejetée par `z.coerce.date` comme date invalide : on lui donne le message de champ obligatoire. */
function validate(draft: IDraft) {
  const result = ZNewsletterInput.safeParse({ ...draft, edition_date: draft.edition_date || undefined })
  const errors: Partial<Record<IField, string>> = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as IField
      errors[field] ??= field === "edition_date" ? "Indiquez la date de l'édition" : issue.message
    }
  }
  return { input: result.success ? result.data : null, errors }
}

/** Ajout (`newsletter` à `null`) ou modification d'une infolettre. */
export function NewsletterFormModal({ newsletter, isOpen, onClose }: { newsletter: INewsletterJSON | null; isOpen: boolean; onClose: () => void }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const titleId = useId()
  const [draft, setDraft] = useState<IDraft>(() => toDraft(newsletter))
  const [errors, setErrors] = useState<Partial<Record<IField, string>>>({})
  const [isPending, setIsPending] = useState(false)
  const inputRefs = useRef<Partial<Record<IField, HTMLInputElement | null>>>({})

  // la modale reste montée entre deux ouvertures : on repart de l'infolettre visée à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setDraft(toDraft(newsletter))
      setErrors({})
    }
  }, [isOpen, newsletter])

  const registerInput = (field: IField) => (element: HTMLInputElement | null) => {
    inputRefs.current[field] = element
  }

  const isEdition = newsletter !== null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const { input, errors: nextErrors } = validate(draft)
    setErrors(nextErrors)
    if (!input) {
      const firstInvalid = FIELDS.find((field) => nextErrors[field])
      if (firstInvalid) inputRefs.current[firstInvalid]?.focus()
      return
    }

    setIsPending(true)
    try {
      if (isEdition) {
        await apiPut("/admin/newsletters/:id", { params: { id: newsletter._id }, body: input })
      } else {
        await apiPost("/admin/newsletters", { body: input })
      }
      await queryClient.invalidateQueries({ queryKey: ["/admin/newsletters"] })
      toast({ title: isEdition ? `Infolettre « ${input.title} » modifiée` : `Infolettre « ${input.title} » ajoutée` })
      onClose()
    } catch (error) {
      const message = error instanceof ApiError && error.context?.statusCode >= 400 ? error.context.message : "Une erreur est survenue, merci de réessayer plus tard"
      toast({ title: message, variant: "error" })
    } finally {
      setIsPending(false)
    }
  }

  const fieldState = (field: IField) => (errors[field] ? { state: "error" as const, stateRelatedMessage: errors[field] } : {})
  const setField = (field: IField) => (event: React.ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, [field]: event.target.value }))

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose} ariaLabelledBy={titleId}>
      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v"), minWidth: { md: 560 } }}>
        <Typography id={titleId} component="h2" className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("4v") }}>
          {isEdition ? "Modifier l'infolettre" : "Ajouter une infolettre"}
        </Typography>
        <Typography className={fr.cx("fr-text--sm")} sx={{ mb: fr.spacing("4v") }}>
          Tous les champs sont obligatoires.
        </Typography>
        <Input
          label="Titre"
          hintText="Affiché sur la carte de l'édition, page « La lettre de l'alternance »"
          {...fieldState("title")}
          nativeInputProps={{ ref: registerInput("title"), value: draft.title, onChange: setField("title"), maxLength: 150 }}
        />
        <Input
          label="Date de l'édition"
          hintText="Les éditions sont affichées de la plus récente à la plus ancienne"
          {...fieldState("edition_date")}
          nativeInputProps={{ ref: registerInput("edition_date"), type: "date", value: draft.edition_date, onChange: setField("edition_date") }}
        />
        <Input
          label="Lien de l'édition sur LinkedIn"
          hintText="Adresse complète, par exemple https://www.linkedin.com/pulse/…"
          {...fieldState("linkedin_url")}
          nativeInputProps={{ ref: registerInput("linkedin_url"), type: "url", value: draft.linkedin_url, onChange: setField("linkedin_url") }}
        />
        <Checkbox
          options={[
            {
              label: "Afficher sur la page « La lettre de l'alternance »",
              hintText: "Seules les 6 éditions affichées les plus récentes sont visibles",
              nativeInputProps: { checked: draft.is_visible, onChange: (event) => setDraft((current) => ({ ...current, is_visible: event.target.checked })) },
            },
          ]}
        />
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: fr.spacing("3v") }}>
          <Button type="button" priority="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isEdition ? "Enregistrer" : "Ajouter"}
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
