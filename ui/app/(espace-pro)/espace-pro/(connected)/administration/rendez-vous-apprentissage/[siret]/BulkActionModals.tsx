"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { SegmentedControl, type SegmentedControlProps } from "@codegouvfr/react-dsfr/SegmentedControl"
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

const CHOICES = [
  { value: "keep", label: "Inchangé" },
  { value: "auto", label: "Automatique" },
  { value: "on", label: "Activer" },
  { value: "off", label: "Désactiver" },
] as const satisfies readonly { value: IDiffusionChoice; label: string }[]

const EligibilityBadge = ({ eligible, total }: { eligible: number; total: number }) => {
  if (eligible === total)
    return (
      <Badge small noIcon severity="info">
        Éligible
      </Badge>
    )
  if (eligible === 0)
    return (
      <Badge small noIcon severity="error">
        Non éligible
      </Badge>
    )
  return (
    <Badge small noIcon severity="warning">
      {`Éligible ${eligible} / ${total}`}
    </Badge>
  )
}

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
        « Activer » et « Désactiver » forcent l'état, conservé par la synchronisation de nuit. « Automatique » suit de nouveau l'opt-out et le premium.
      </Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {PLATFORMS.map(({ name, label }) => {
          const states = selection.map((formation) => getDiffusionState(formation, name))
          const eligible = states.filter((state) => state.eligible).length
          const active = states.filter((state) => state.active).length
          const forced = states.filter((state) => state.forced).length
          const toSegment = (choice: (typeof CHOICES)[number]): SegmentedControlProps.SegmentWithoutIcon => ({
            label: choice.label,
            nativeInputProps: {
              value: choice.value,
              checked: (choices[name] ?? "keep") === choice.value,
              // Aucune formation éligible : forcer n'aurait d'effet sur aucune ligne.
              disabled: eligible === 0 && (choice.value === "on" || choice.value === "off"),
              onChange: () => setChoices((previous) => ({ ...previous, [name]: choice.value })),
            },
          })
          return (
            <Box
              component="li"
              key={name}
              sx={{ py: fr.spacing("3v"), borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, opacity: eligible === 0 ? 0.7 : 1 }}
            >
              <SegmentedControl
                name={`diffusion-${name}`}
                small
                inlineLegend
                legend={
                  // La légende DSFR est en display: contents : ce span est l'élément flex, il prend la place libre pour aligner les sélecteurs à droite.
                  <Box component="span" sx={{ flex: "1 1 auto", display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v"), mr: fr.spacing("3v") }}>
                    <Box component="span" sx={{ fontWeight: 700, minWidth: "9.5rem" }}>
                      {label}
                    </Box>
                    <EligibilityBadge eligible={eligible} total={selection.length} />
                    <Badge small noIcon>
                      {`Activée ${active} / ${selection.length}`}
                    </Badge>
                    {forced > 0 && (
                      <Badge small noIcon severity="new">
                        {pluralize(forced, "forcée")}
                      </Badge>
                    )}
                  </Box>
                }
                classes={{ root: fr.cx("fr-mb-0") }}
                segments={[toSegment(CHOICES[0]), toSegment(CHOICES[1]), toSegment(CHOICES[2]), toSegment(CHOICES[3])]}
              />
            </Box>
          )
        })}
      </Box>
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
