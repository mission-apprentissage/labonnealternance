"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import { useId, useRef, useState } from "react"
import { buildAgentNoteParagraphs } from "shared/models/jobs-partners-moderation-notes"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { type IModerationFindingJson, toFindings } from "./moderation.types"

const COMMENT_MAX_LENGTH = 2000

/** Refus d'une offre : la note de l'agent et le commentaire cochés vont dans l'e-mail au recruteur, sinon il est générique. */
export function RefusOffreModal({
  isOpen,
  onClose,
  findings,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  findings: IModerationFindingJson[]
  onConfirm: (choice: { agent_note: boolean; comment: string | null }) => Promise<void>
}) {
  const titleId = useId()
  const paragraphs = buildAgentNoteParagraphs(toFindings(findings))
  const hasAgentNote = paragraphs.length > 0
  const [withAgentNote, setWithAgentNote] = useState(true)
  const [withComment, setWithComment] = useState(false)
  const [comment, setComment] = useState("")
  const [showError, setShowError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const commentError = showError && withComment && !comment.trim() ? "Saisissez votre commentaire, ou décochez la case" : null

  const close = () => {
    setWithAgentNote(true)
    setWithComment(false)
    setComment("")
    setShowError(false)
    onClose()
  }

  const confirm = async () => {
    if (withComment && !comment.trim()) {
      setShowError(true)
      commentRef.current?.focus()
      return
    }
    setIsSubmitting(true)
    try {
      await onConfirm({ agent_note: hasAgentNote && withAgentNote, comment: withComment ? comment.trim() : null })
      close()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={close} ariaLabelledBy={titleId}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography id={titleId} component="h2" className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }}>
          Refuser l’offre
        </Typography>
        <Typography sx={{ mb: fr.spacing("4v") }}>L’offre passera au statut « expirée » et le recruteur sera notifié par e-mail.</Typography>
        {hasAgentNote ? (
          <>
            <Checkbox
              small
              options={[
                {
                  label: "Insérer dans l’e-mail la note de l’agent modérateur :",
                  nativeInputProps: { checked: withAgentNote, onChange: (event) => setWithAgentNote(event.target.checked) },
                },
              ]}
            />
            <Box sx={{ backgroundColor: fr.colors.decisions.background.alt.grey.default, p: fr.spacing("3v"), mb: fr.spacing("4v"), opacity: withAgentNote ? 1 : 0.6 }}>
              {paragraphs.map((paragraph) => (
                <Typography key={paragraph} sx={{ fontSize: "0.875rem", "& + &": { mt: fr.spacing("3v") } }}>
                  {paragraph}
                </Typography>
              ))}
            </Box>
          </>
        ) : (
          <Typography sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.mention.grey.default }}>
            L’agent n’a relevé aucun extrait : l’e-mail ne contiendra pas de note.
          </Typography>
        )}
        <Checkbox
          small
          options={[
            {
              label: "Ajouter un commentaire personnalisé",
              nativeInputProps: {
                checked: withComment,
                onChange: (event) => {
                  setWithComment(event.target.checked)
                  setShowError(false)
                },
              },
            },
          ]}
        />
        {withComment && (
          <Input
            label="Votre commentaire"
            hintText={`${COMMENT_MAX_LENGTH} caractères au maximum, envoyés tels quels au recruteur`}
            textArea
            state={commentError ? "error" : "default"}
            stateRelatedMessage={commentError}
            nativeTextAreaProps={{
              ref: commentRef,
              value: comment,
              maxLength: COMMENT_MAX_LENGTH,
              rows: 4,
              onChange: (event) => setComment(event.target.value),
              "aria-invalid": Boolean(commentError),
            }}
          />
        )}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}>
          <Button priority="secondary" onClick={close}>
            Annuler
          </Button>
          <Button onClick={confirm} disabled={isSubmitting}>
            Confirmer
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
