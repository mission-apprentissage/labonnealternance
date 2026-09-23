"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import { Box, Typography } from "@mui/material"
import { useEffect, useId, useRef, useState } from "react"
import type { IFeedbackQuestion } from "shared/models/feedback-form.model"

import type { IFeedbackAnswers, IFeedbackAnswerValue } from "./feedbackWidget.utils"
import { getCurrentQuestion, RATING_OPTIONS } from "./feedbackWidget.utils"

export type IFeedbackWidgetProgress = {
  answers: IFeedbackAnswers
  skipped: string[]
  status: "in_progress" | "completed" | "closed"
}

type Props = {
  questions: IFeedbackQuestion[]
  /**
   * "inline" : dans le flux de la page (prévisualisation du back-office).
   * "floating" : fixé dans le coin de l'écran, tel qu'affiché aux usagers sur le site.
   */
  variant?: "inline" | "floating"
  /** Appelé après chaque réponse, question passée ou fermeture, avec l'état complet du parcours. */
  onProgress?: (progress: IFeedbackWidgetProgress) => void
  /**
   * `false` : la croix reste dessinée, pour que l'aperçu ressemble au widget réel, mais grisée et
   * retirée de l'arbre d'accessibilité et de la tabulation — elle ne fait rien dans ce contexte.
   */
  closable?: boolean
}

/**
 * Widget de feedback : pose les questions une par une, dans l'ordre de la définition, en sautant
 * celles dont la condition d'affichage n'est pas remplie.
 *
 * Purement présentationnel : aucun appel réseau, aucun stockage. L'enregistrement des réponses et
 * le déclenchement sur le site sont l'affaire de l'appelant, via `onProgress`. Le titre du
 * formulaire n'est jamais affiché : il est réservé au back-office.
 *
 * Accessibilité : à chaque question, le focus est placé sur son libellé, sans quoi l'utilisateur
 * clavier ou lecteur d'écran resterait sur un bouton qui vient de disparaître (RGAA 7.1).
 */
export function FeedbackWidget({ questions, variant = "inline", onProgress, closable = true }: Props) {
  const [answers, setAnswers] = useState<IFeedbackAnswers>({})
  const [skipped, setSkipped] = useState<string[]>([])
  const [closed, setClosed] = useState(false)
  const headingId = useId()
  const headingRef = useRef<HTMLParagraphElement>(null)

  const current = getCurrentQuestion(questions, answers, skipped)

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

  const report = (nextAnswers: IFeedbackAnswers, nextSkipped: string[]) =>
    onProgress?.({ answers: nextAnswers, skipped: nextSkipped, status: getCurrentQuestion(questions, nextAnswers, nextSkipped) ? "in_progress" : "completed" })

  const answer = (question: IFeedbackQuestion, value: IFeedbackAnswerValue) => {
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    report(next, skipped)
  }

  const skip = (question: IFeedbackQuestion) => {
    const next = [...skipped, question.id]
    setSkipped(next)
    report(answers, next)
  }

  const close = () => {
    setClosed(true)
    onProgress?.({ answers, skipped, status: "closed" })
  }

  return (
    <Box
      component="section"
      aria-label="Donnez votre avis"
      sx={{
        ...(variant === "floating" ? { position: "fixed", right: 24, bottom: 24, zIndex: 1300 } : { position: "relative" }),
        width: 340,
        maxWidth: "100%",
        boxSizing: "border-box",
        p: "20px",
        borderTop: `3px solid ${fr.colors.decisions.border.actionHigh.blueFrance.default}`,
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        boxShadow: "0 4px 16px rgba(0, 0, 18, 0.16)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: fr.spacing("2v") }}>
        <Typography ref={headingRef} id={headingId} tabIndex={-1} sx={{ fontSize: "15px", fontWeight: 700, lineHeight: "22px", mb: 0, outlineOffset: "2px" }}>
          {current ? current.label : "Merci pour votre retour"}
        </Typography>
        <Button
          type="button"
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-close-line"
          title="Fermer"
          disabled={!closable}
          nativeButtonProps={closable ? undefined : { "aria-hidden": true, tabIndex: -1 }}
          onClick={close}
        />
      </Box>

      {current ? (
        <QuestionStep key={current.id} question={current} headingId={headingId} onAnswer={(value) => answer(current, value)} onSkip={() => skip(current)} />
      ) : (
        <Typography className={fr.cx("fr-text--sm")} sx={{ mb: 0 }}>
          Votre avis nous aide à améliorer La bonne alternance.
        </Typography>
      )}
    </Box>
  )
}

type StepProps = {
  question: IFeedbackQuestion
  headingId: string
  onAnswer: (value: IFeedbackAnswerValue) => void
  onSkip: () => void
}

/** Une question. Montée avec `key={question.id}` : la saisie en cours repart de zéro à chaque question. */
function QuestionStep({ question, headingId, onAnswer, onSkip }: StepProps) {
  const [selection, setSelection] = useState<string[]>([])
  const [text, setText] = useState("")

  const skipButton = !question.required && (
    <Button type="button" priority="tertiary no outline" size="small" onClick={onSkip}>
      Passer
    </Button>
  )

  switch (question.type) {
    case "rating":
      return (
        <>
          <Box role="group" aria-labelledby={headingId} sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("2v") }}>
            {RATING_OPTIONS.map((option) => (
              <Button key={option.value} type="button" priority="secondary" size="small" iconId={option.iconId} iconPosition="left" onClick={() => onAnswer(option.value)}>
                {option.label}
              </Button>
            ))}
          </Box>
          {skipButton && <Box>{skipButton}</Box>}
        </>
      )

    case "single_select":
      return (
        <>
          <Box role="group" aria-labelledby={headingId} sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("2v") }}>
            {question.options.map((option) => (
              <Button key={option.value} type="button" priority="secondary" size="small" onClick={() => onAnswer(option.value)}>
                {option.label}
              </Button>
            ))}
          </Box>
          {skipButton && <Box>{skipButton}</Box>}
        </>
      )

    case "multi_select": {
      const limitReached = question.maxSelections !== undefined && selection.length >= question.maxSelections
      return (
        <>
          <Checkbox
            small
            legend={<span className={fr.cx("fr-sr-only")}>{question.label}</span>}
            style={{ marginBottom: 0 }}
            options={question.options.map((option) => {
              const checked = selection.includes(option.value)
              return {
                label: option.label,
                nativeInputProps: {
                  checked,
                  disabled: !checked && limitReached,
                  onChange: () => setSelection((previous) => (checked ? previous.filter((value) => value !== option.value) : [...previous, option.value])),
                },
              }
            })}
          />
          <Box sx={{ display: "flex", gap: fr.spacing("2v") }}>
            <Button type="button" size="small" disabled={question.required && selection.length === 0} onClick={() => onAnswer(selection)}>
              Valider
            </Button>
            {skipButton}
          </Box>
        </>
      )
    }

    case "text": {
      const counterId = `${headingId}-compteur`
      return (
        <>
          <Box>
            <textarea
              className={fr.cx("fr-input")}
              aria-labelledby={headingId}
              aria-describedby={counterId}
              placeholder={question.placeholder ?? (question.required ? undefined : "Votre commentaire (facultatif)")}
              maxLength={question.maxLength}
              rows={3}
              value={text}
              onChange={(event) => setText(event.target.value)}
              style={{ resize: "vertical" }}
            />
            <Typography id={counterId} className={fr.cx("fr-hint-text")} sx={{ mt: fr.spacing("1v"), mb: 0 }}>
              {text.length} / {question.maxLength} caractères
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: fr.spacing("2v") }}>
            <Button type="button" size="small" disabled={!text.trim()} onClick={() => onAnswer(text.trim())}>
              Envoyer
            </Button>
            {skipButton}
          </Box>
        </>
      )
    }
  }
}
