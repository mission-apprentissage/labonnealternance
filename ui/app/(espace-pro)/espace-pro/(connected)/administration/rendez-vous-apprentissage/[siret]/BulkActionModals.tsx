"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { useId, useState } from "react"
import type { IReferrerName } from "shared/models/elligible-training.model"
import { z } from "zod"

import { ModalReadOnly } from "@/components/ModalReadOnly"
import { pluralize } from "@/utils/strutils"
import { EMAIL_FORMAT_ERROR, EMAIL_FORMAT_HINT } from "@/utils/validation-messages"
import type { IDiffusionMode } from "./DiffusionPill"
import type { IFormation } from "./formations-table.utils"
import { getDiffusionState, PLATFORMS, summarizeEmailChange } from "./formations-table.utils"

const formations = (count: number) => pluralize(count, "formation")

const Impact = ({ rows }: { rows: { label: string; count: number; warn?: boolean }[] }) => {
  const visible = rows.filter((row) => row.count > 0)
  if (!visible.length) return null
  return (
    <Box component="dl" sx={{ m: 0, p: fr.spacing("3v"), backgroundColor: fr.colors.decisions.background.alt.grey.default, display: "grid", gap: fr.spacing("1v") }}>
      {visible.map((row) => (
        <Box
          key={row.label}
          sx={{ display: "flex", justifyContent: "space-between", gap: fr.spacing("3v"), color: row.warn ? fr.colors.decisions.text.default.warning.default : undefined }}
        >
          <dt>{row.label}</dt>
          <Box component="dd" sx={{ m: 0, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {row.count}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

const ModalLayout = ({ titleId, title, children, actions }: { titleId: string; title: string; children: ReactNode; actions: ReactNode }) => (
  <Box sx={{ px: fr.spacing("6v"), pb: fr.spacing("6v"), display: "grid", gap: fr.spacing("4v") }}>
    <Typography id={titleId} variant="h3" component="h2" sx={{ mb: 0 }}>
      {title}
    </Typography>
    {children}
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: fr.spacing("2v"), flexWrap: "wrap" }}>{actions}</Box>
  </Box>
)

type IModalProps<T> = { isOpen: boolean; selection: IFormation[]; onClose: () => void; onSubmit: T }

// Le contenu d'une modale MUI est démonté à la fermeture : chaque ouverture repart d'un état neuf.
export const BulkEmailModal = (props: IModalProps<(email: string) => Promise<void>>) => {
  const titleId = useId()
  return (
    <ModalReadOnly isOpen={props.isOpen} onClose={props.onClose} ariaLabelledBy={titleId} size="sm">
      <BulkEmailForm {...props} titleId={titleId} />
    </ModalReadOnly>
  )
}

const BulkEmailForm = ({ titleId, selection, onClose, onSubmit }: IModalProps<(email: string) => Promise<void>> & { titleId: string }) => {
  const [email, setEmail] = useState(() => {
    const emails = [...new Set(selection.flatMap((formation) => (formation.lieu_formation_email ? [formation.lieu_formation_email] : [])))]
    return emails.length === 1 ? emails[0] : ""
  })
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const summary = summarizeEmailChange(selection, email)
  const changed = selection.length - summary.unchanged

  const submit = async () => {
    if (!z.email().safeParse(email.trim()).success) {
      setError(EMAIL_FORMAT_ERROR)
      return
    }
    setPending(true)
    try {
      await onSubmit(email.trim())
    } finally {
      setPending(false)
    }
  }

  return (
    <ModalLayout
      titleId={titleId}
      title={`Modifier l'e-mail de ${formations(selection.length)}`}
      actions={
        <>
          <Button priority="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={pending || changed === 0}>
            {`Appliquer à ${formations(changed)}`}
          </Button>
        </>
      }
    >
      <Input
        label="Nouvel e-mail de contact"
        hintText={EMAIL_FORMAT_HINT}
        state={error ? "error" : "default"}
        stateRelatedMessage={error}
        nativeInputProps={{
          type: "email",
          value: email,
          autoComplete: "off",
          autoFocus: true,
          onChange: (event) => {
            setEmail(event.target.value)
            setError(null)
          },
          onKeyDown: (event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              submit()
            }
          },
        }}
        style={{ marginBottom: 0 }}
      />
      <Impact
        rows={[
          { label: "E-mail issu du catalogue remplacé", count: summary.fromCatalogue },
          { label: "E-mail personnalisé remplacé", count: summary.fromCustom, warn: true },
          { label: "E-mail manquant complété", count: summary.filled },
          { label: "Déjà à cette adresse, inchangé", count: summary.unchanged },
        ]}
      />
      <Typography className={fr.cx("fr-hint-text")} sx={{ mb: 0 }}>
        L'e-mail est marqué personnalisé : la synchronisation catalogue ne le remplacera plus.
      </Typography>
    </ModalLayout>
  )
}

type IDiffusionChoice = "keep" | IDiffusionMode

const CHOICES: { value: IDiffusionChoice; label: string }[] = [
  { value: "keep", label: "Inchangé" },
  { value: "auto", label: "Automatique" },
  { value: "on", label: "Activer" },
  { value: "off", label: "Désactiver" },
]

type IDiffusionSubmit = (changes: { referrer: IReferrerName; mode: IDiffusionMode }[]) => Promise<void>

export const BulkDiffusionModal = (props: IModalProps<IDiffusionSubmit>) => {
  const titleId = useId()
  return (
    <ModalReadOnly isOpen={props.isOpen} onClose={props.onClose} ariaLabelledBy={titleId} size="md">
      <BulkDiffusionForm {...props} titleId={titleId} />
    </ModalReadOnly>
  )
}

const BulkDiffusionForm = ({ titleId, selection, onClose, onSubmit }: IModalProps<IDiffusionSubmit> & { titleId: string }) => {
  const [choices, setChoices] = useState<Partial<Record<IReferrerName, IDiffusionChoice>>>({})
  const [pending, setPending] = useState(false)

  const changes = PLATFORMS.flatMap(({ name }) => {
    const choice = choices[name]
    return choice && choice !== "keep" ? [{ referrer: name, mode: choice }] : []
  })
  const ignored = changes.reduce(
    (total, { referrer, mode }) => total + (mode === "auto" ? 0 : selection.filter((formation) => !getDiffusionState(formation, referrer).eligible).length),
    0
  )
  const applicable = changes.some(({ referrer, mode }) => mode === "auto" || selection.some((formation) => getDiffusionState(formation, referrer).eligible))

  const submit = async () => {
    setPending(true)
    try {
      await onSubmit(changes)
    } finally {
      setPending(false)
    }
  }

  return (
    <ModalLayout
      titleId={titleId}
      title={`Diffusion de ${formations(selection.length)}`}
      actions={
        <>
          <Button priority="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={pending || !applicable}>
            Appliquer
          </Button>
        </>
      }
    >
      <Typography className={fr.cx("fr-hint-text")} sx={{ mb: 0 }}>
        « Activer » et « Désactiver » forcent l'état : la synchronisation de la nuit le conserve. « Automatique » retire le forçage.
      </Typography>
      {PLATFORMS.map(({ name, label }) => {
        const states = selection.map((formation) => getDiffusionState(formation, name))
        const active = states.filter((state) => state.active).length
        const forced = states.filter((state) => state.forced).length
        const notEligible = states.filter((state) => !state.eligible).length
        const hint = [`activée sur ${active} / ${selection.length}`, forced && pluralize(forced, "forcée"), notEligible && pluralize(notEligible, "non éligible", "non éligibles")]
          .filter(Boolean)
          .join(" · ")
        return (
          <RadioButtons
            key={name}
            legend={label}
            hintText={hint}
            name={`diffusion-${name}`}
            orientation="horizontal"
            small
            style={{ marginBottom: 0 }}
            options={CHOICES.map((choice) => ({
              label: choice.label,
              nativeInputProps: {
                checked: (choices[name] ?? "keep") === choice.value,
                onChange: () => setChoices((previous) => ({ ...previous, [name]: choice.value })),
              },
            }))}
          />
        )
      })}
      <Impact rows={[{ label: "Forçages ignorés (plateforme non éligible)", count: ignored, warn: true }]} />
    </ModalLayout>
  )
}

export const ResetEmailModal = ({ isOpen, selection, onClose, onSubmit }: IModalProps<() => Promise<void>>) => {
  const titleId = useId()
  const [pending, setPending] = useState(false)
  const customized = selection.filter((formation) => formation.is_lieu_formation_email_customized).length

  const submit = async () => {
    setPending(true)
    try {
      await onSubmit()
    } finally {
      setPending(false)
    }
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose} ariaLabelledBy={titleId} size="sm">
      <ModalLayout
        titleId={titleId}
        title="Rétablir l'e-mail du catalogue"
        actions={
          <>
            <Button priority="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={pending || customized === 0}>
              {`Rétablir sur ${formations(customized)}`}
            </Button>
          </>
        }
      >
        <Impact
          rows={[
            { label: "E-mail personnalisé rétabli", count: customized },
            { label: "Déjà issu du catalogue, inchangé", count: selection.length - customized },
          ]}
        />
        <Typography className={fr.cx("fr-hint-text")} sx={{ mb: 0 }}>
          L'e-mail actuel reste en place jusqu'à la prochaine synchronisation, chaque nuit, qui le remplace par celui du catalogue.
        </Typography>
      </ModalLayout>
    </ModalReadOnly>
  )
}
