"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useEffect, useId, useRef, useState } from "react"
import type { IFeedbackQuestion } from "shared/models/feedback-form.model"

import type { IFeedbackAnswers, IFeedbackAnswerValue } from "./feedbackWidget.utils"
import { getCurrentQuestion, getPreviousQuestion, getStepProgress, RATING_OPTIONS } from "./feedbackWidget.utils"

export type IFeedbackWidgetProgress = {
  answers: IFeedbackAnswers
  skipped: string[]
  status: "in_progress" | "completed" | "closed"
}

type Props = {
  questions: IFeedbackQuestion[]
  /**
   * "inline" : dans le flux de la page (prévisualisation du back-office).
   * "floating" : panneau non modal ouvert par le bouton « Donner mon avis » (cf. FeedbackLauncher),
   * qui le positionne.
   */
  variant?: "inline" | "floating"
  /** Appelé après chaque réponse, question passée, retour ou fermeture, avec l'état complet du parcours. */
  onProgress?: (progress: IFeedbackWidgetProgress) => void
  /**
   * `false` : « Réduire » et « Terminer » restent dessinés, pour que l'aperçu ressemble au widget
   * réel, mais grisés et retirés de l'arbre d'accessibilité et de la tabulation — ils ne font rien
   * dans ce contexte.
   */
  closable?: boolean
  /** Fourni : « Réduire » et « Terminer » appellent `onClose` au lieu de retirer le widget, dont l'état est conservé. */
  onClose?: () => void
}

const inertProps = { "aria-hidden": true, tabIndex: -1 } as const

/**
 * Widget de feedback : pose les questions une par une, dans l'ordre de la définition, en sautant
 * celles dont la condition d'affichage n'est pas remplie. Chaque étape se valide par « Continuer »,
 * se saute par « Passer » si elle est facultative, et « Retour » rouvre la précédente avec sa
 * réponse. Un écran de remerciement clôt le parcours.
 *
 * Purement présentationnel : aucun appel réseau, aucun stockage. L'enregistrement des réponses et
 * le déclenchement sur le site sont l'affaire de l'appelant, via `onProgress`. Le titre du
 * formulaire n'est jamais affiché : il est réservé au back-office.
 *
 * Accessibilité : à chaque étape, le focus est placé sur le libellé de la question, sans quoi
 * l'utilisateur clavier ou lecteur d'écran resterait sur un bouton qui vient de disparaître (RGAA 7.1).
 */
export function FeedbackWidget({ questions, variant = "inline", onProgress, closable = true, onClose }: Props) {
  const [answers, setAnswers] = useState<IFeedbackAnswers>({})
  const [skipped, setSkipped] = useState<string[]>([])
  // réponses retirées par « Retour », pour pré-remplir la question rouverte
  const [drafts, setDrafts] = useState<IFeedbackAnswers>({})
  const [closed, setClosed] = useState(false)
  const headingId = useId()
  const headingRef = useRef<HTMLParagraphElement>(null)

  const current = getCurrentQuestion(questions, answers, skipped)
  const previous = current ? getPreviousQuestion(questions, answers, skipped) : undefined

  // pas au premier affichage : le widget ne doit pas voler le focus de la page à son apparition
  const isFirstStep = useRef(true)
  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false
      return
    }
    headingRef.current?.focus()
  }, [current?.id])

  if (closed) return null

  const update = (nextAnswers: IFeedbackAnswers, nextSkipped: string[]) => {
    setAnswers(nextAnswers)
    setSkipped(nextSkipped)
    onProgress?.({ answers: nextAnswers, skipped: nextSkipped, status: getCurrentQuestion(questions, nextAnswers, nextSkipped) ? "in_progress" : "completed" })
  }

  const answer = (question: IFeedbackQuestion, value: IFeedbackAnswerValue) =>
    update(
      { ...answers, [question.id]: value },
      skipped.filter((id) => id !== question.id)
    )

  const skip = (question: IFeedbackQuestion) => {
    const { [question.id]: _dropped, ...rest } = answers
    update(rest, [...skipped, question.id])
  }

  const goBack = (question: IFeedbackQuestion) => {
    const { [question.id]: reopened, ...rest } = answers
    if (reopened !== undefined) setDrafts((previousDrafts) => ({ ...previousDrafts, [question.id]: reopened }))
    update(
      rest,
      skipped.filter((id) => id !== question.id)
    )
  }

  const close = () => {
    if (onClose) {
      onClose()
      return
    }
    setClosed(true)
    onProgress?.({ answers, skipped, status: "closed" })
  }

  return (
    <Box
      // panneau non modal : la page reste utilisable pendant qu'il est ouvert, donc ni aria-modal ni piège à focus
      {...(variant === "floating" ? { role: "dialog", "aria-label": "Donner mon avis" } : { component: "section", "aria-label": "Donnez votre avis" })}
      sx={{
        position: "relative",
        width: 340,
        maxWidth: "100%",
        boxSizing: "border-box",
        p: fr.spacing("4v"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        boxShadow: "0 2px 8px rgba(0, 0, 18, 0.16)",
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("3v"),
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="button"
          priority="secondary"
          size="small"
          iconId="fr-icon-subtract-line"
          iconPosition="left"
          disabled={!closable}
          nativeButtonProps={closable ? undefined : inertProps}
          onClick={close}
        >
          Réduire
        </Button>
      </Box>

      <Typography ref={headingRef} id={headingId} tabIndex={-1} data-feedback-heading sx={{ fontSize: "15px", fontWeight: 700, lineHeight: "22px", mb: 0, outlineOffset: "2px" }}>
        {current ? current.label : "Merci pour votre retour"}
      </Typography>

      {current ? (
        <QuestionStep
          key={current.id}
          question={current}
          headingId={headingId}
          initialValue={drafts[current.id]}
          progress={getStepProgress(questions, answers, current)}
          onAnswer={(value) => answer(current, value)}
          onSkip={() => skip(current)}
          onBack={previous ? () => goBack(previous) : undefined}
        />
      ) : (
        <>
          <Typography className={fr.cx("fr-text--sm")} sx={{ mb: 0 }}>
            Vos réponses nous aident à améliorer La bonne alternance.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="button" size="small" disabled={!closable} nativeButtonProps={closable ? undefined : inertProps} onClick={close}>
              Terminer
            </Button>
          </Box>
        </>
      )}
    </Box>
  )
}

type StepProps = {
  question: IFeedbackQuestion
  headingId: string
  initialValue: IFeedbackAnswerValue | undefined
  progress: { step: number; total: number }
  onAnswer: (value: IFeedbackAnswerValue) => void
  onSkip: () => void
  onBack: (() => void) | undefined
}

type IChoice = { value: string; label: string; iconId?: string }

/** Une étape. Montée avec `key={question.id}` : la saisie repart de la réponse éventuellement rouverte par « Retour ». */
function QuestionStep({ question, headingId, initialValue, progress, onAnswer, onSkip, onBack }: StepProps) {
  const [selection, setSelection] = useState<string[]>(question.type === "text" ? [] : [initialValue ?? []].flat())
  const [text, setText] = useState(question.type === "text" && typeof initialValue === "string" ? initialValue : "")
  const [error, setError] = useState<string | null>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  const errorId = `${headingId}-erreur`

  const isText = question.type === "text"
  const isEmpty = isText ? !text.trim() : selection.length === 0

  const submit = () => {
    if (isEmpty) {
      if (!question.required) {
        onSkip()
        return
      }
      setError(isText ? "Le champ est obligatoire." : "Veuillez sélectionner au moins une option avant de continuer.")
      groupRef.current?.querySelector<HTMLElement>("input, textarea")?.focus()
      return
    }
    if (isText) onAnswer(text.trim())
    else onAnswer(question.type === "multi_select" ? selection : selection[0])
  }

  const choices: IChoice[] = question.type === "rating" ? RATING_OPTIONS : question.type === "text" ? [] : question.options
  const multiple = question.type === "multi_select"
  const limitReached = question.type === "multi_select" && question.maxSelections !== undefined && selection.length >= question.maxSelections

  const toggle = (value: string) => {
    setError(null)
    setSelection((previous) => (multiple ? (previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]) : [value]))
  }

  const errorColor = fr.colors.decisions.text.default.error.default
  const counterId = `${headingId}-compteur`

  return (
    <>
      <Box
        ref={groupRef}
        role={isText ? undefined : multiple ? "group" : "radiogroup"}
        aria-labelledby={isText ? undefined : headingId}
        aria-describedby={!isText && error ? errorId : undefined}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("2v"),
          ...(error ? { borderLeft: `2px solid ${fr.colors.decisions.border.plain.error.default}`, pl: fr.spacing("3v") } : {}),
        }}
      >
        {isText ? (
          <Box>
            <textarea
              className={fr.cx("fr-input", error ? "fr-input--error" : undefined)}
              aria-labelledby={headingId}
              aria-describedby={[counterId, error ? errorId : null].filter(Boolean).join(" ")}
              aria-invalid={error ? true : undefined}
              placeholder={question.type === "text" ? question.placeholder : undefined}
              maxLength={question.type === "text" ? question.maxLength : undefined}
              rows={3}
              value={text}
              onChange={(event) => {
                setError(null)
                setText(event.target.value)
              }}
              style={{ resize: "vertical" }}
            />
            <Typography id={counterId} className={fr.cx("fr-hint-text")} sx={{ mt: fr.spacing("1v"), mb: 0 }}>
              {text.length} / {question.type === "text" ? question.maxLength : 0} caractères
            </Typography>
          </Box>
        ) : (
          choices.map((choice) => {
            const checked = selection.includes(choice.value)
            return (
              <ChoiceTile
                key={choice.value}
                choice={choice}
                name={`${headingId}-${question.id}`}
                multiple={multiple}
                checked={checked}
                disabled={multiple && !checked && limitReached}
                invalid={Boolean(error)}
                onToggle={() => toggle(choice.value)}
              />
            )
          })
        )}
        {error && (
          <Typography
            id={errorId}
            className={fr.cx("fr-icon-error-fill", "fr-icon--sm")}
            sx={{ fontSize: "12px", lineHeight: "18px", color: errorColor, mb: 0, "&::before": { mr: fr.spacing("1v") } }}
          >
            {error}
          </Typography>
        )}
      </Box>

      <Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: fr.spacing("2v") }}>
          {onBack && (
            <Button type="button" priority="secondary" size="small" onClick={onBack}>
              Retour
            </Button>
          )}
          {!question.required && (
            <Button type="button" priority="secondary" size="small" onClick={onSkip}>
              Passer
            </Button>
          )}
          <Button type="button" size="small" onClick={submit}>
            Continuer
          </Button>
        </Box>
        <Typography sx={{ fontSize: "12px", lineHeight: "18px", color: fr.colors.decisions.text.mention.grey.default, mt: fr.spacing("2v"), mb: 0 }}>
          Étape {progress.step} sur {progress.total}
        </Typography>
      </Box>
    </>
  )
}

/** Option encadrée : toute la tuile est cliquable, la case (ou le bouton radio) natif porte l'état. */
function ChoiceTile({
  choice,
  name,
  multiple,
  checked,
  disabled,
  invalid,
  onToggle,
}: {
  choice: IChoice
  name: string
  multiple: boolean
  checked: boolean
  disabled: boolean
  invalid: boolean
  onToggle: () => void
}) {
  const colors = fr.colors.decisions
  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: fr.spacing("3v"),
        p: `${fr.spacing("3v")} ${fr.spacing("4v")}`,
        border: `1px solid ${checked ? colors.border.actionHigh.blueFrance.default : colors.border.default.grey.default}`,
        backgroundColor: colors.background.default.grey.default,
        fontSize: "14px",
        lineHeight: "22px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        "&:hover": disabled ? {} : { backgroundColor: colors.background.default.grey.hover },
        "&:has(input:focus-visible)": { outline: `2px solid ${colors.border.plain.info.default}`, outlineOffset: "2px" },
      }}
    >
      <input
        type={multiple ? "checkbox" : "radio"}
        name={name}
        value={choice.value}
        checked={checked}
        disabled={disabled}
        aria-invalid={invalid ? true : undefined}
        onChange={onToggle}
        style={{ margin: 0, width: 16, height: 16, flexShrink: 0, accentColor: colors.background.actionHigh.blueFrance.default, outline: "none" }}
      />
      {choice.iconId && <span className={`${choice.iconId} ${fr.cx("fr-icon--sm")}`} aria-hidden="true" />}
      <span>{choice.label}</span>
    </Box>
  )
}
