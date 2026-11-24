"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box } from "@mui/material"
import { useRef, useState } from "react"
import { z } from "zod"

import { EMAIL_FORMAT_ERROR } from "@/utils/validation-messages"
import type { IFormation } from "./formations-table.utils"

const EmailBadge = ({ formation }: { formation: IFormation }) => {
  if (!formation.lieu_formation_email)
    return (
      <Badge severity="error" small noIcon>
        Manquant
      </Badge>
    )
  if (formation.is_lieu_formation_email_customized)
    return (
      <Badge severity="info" small noIcon>
        Personnalisé
      </Badge>
    )
  return (
    <Badge small noIcon>
      Catalogue
    </Badge>
  )
}

export const EmailCell = ({ formation, onSave }: { formation: IFormation; onSave: (email: string) => Promise<void> }) => {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setEditing(false)
    setError(null)
    requestAnimationFrame(() => editButtonRef.current?.focus())
  }

  const save = async () => {
    const email = inputRef.current?.value.trim() ?? ""
    if (!z.email().safeParse(email).success) {
      setError(EMAIL_FORMAT_ERROR)
      inputRef.current?.focus()
      return
    }
    await onSave(email)
    close()
  }

  if (editing) {
    return (
      <Box sx={{ minWidth: 260 }}>
        <Input
          label={<span className="fr-sr-only">Nouvel e-mail de contact pour {formation.training_intitule_long}</span>}
          state={error ? "error" : "default"}
          stateRelatedMessage={error}
          nativeInputProps={{
            ref: inputRef,
            type: "email",
            defaultValue: formation.lieu_formation_email ?? "",
            autoComplete: "off",
            autoFocus: true,
            onKeyDown: (event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                save()
              }
              if (event.key === "Escape") close()
            },
          }}
          style={{ marginBottom: fr.spacing("2v") }}
        />
        <Box sx={{ display: "flex", gap: fr.spacing("2v") }}>
          <Button size="small" onClick={save}>
            Enregistrer
          </Button>
          <Button size="small" priority="tertiary no outline" onClick={close}>
            Annuler
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "grid", gap: fr.spacing("1v"), minWidth: 260 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
        <Box
          component="span"
          title={formation.lieu_formation_email ?? undefined}
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 240,
            ...(!formation.lieu_formation_email && { fontStyle: "italic", color: fr.colors.decisions.text.default.error.default }),
          }}
        >
          {formation.lieu_formation_email || "Aucun e-mail"}
        </Box>
        <Button
          ref={editButtonRef}
          iconId="fr-icon-edit-line"
          priority="tertiary no outline"
          size="small"
          title={`Modifier l'e-mail de ${formation.training_intitule_long}`}
          onClick={() => setEditing(true)}
        />
      </Box>
      <EmailBadge formation={formation} />
    </Box>
  )
}
