"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useState } from "react"
import { OFFER_MODERATION_STATUS } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_DECISION_BLOCKED_REASONS } from "shared/routes/jobs-partners-moderation.routes"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useToast } from "@/app/hooks/useToast"
import { reclassifyModerationJob, refuseModerationJob, validateModerationJob } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"
import { AgentNoteBox, AgentNoteLines } from "./AgentNote"
import { ConformityBadge, OfferStatusBadge, ReviewStatusBadge } from "./ModerationBadges"
import type { IModerationJobDetailJson } from "./moderation.types"
import { RefusOffreModal } from "./RefusOffreModal"

const BLOCKED_REASON_HINTS: Record<string, string> = {
  [MODERATION_DECISION_BLOCKED_REASONS.COMPTE_NON_VALIDE]: "Vérifiez le compte avant de valider l’offre",
  [MODERATION_DECISION_BLOCKED_REASONS.NON_CLASSIFIEE]: "Lancez l’analyse avant de modérer l’offre",
  [MODERATION_DECISION_BLOCKED_REASONS.STATUT]: "L’offre est close : elle ne se modère plus",
}

const errorMessage = (error: unknown) => (error instanceof ApiError && error.context.statusCode < 500 ? error.message : "L’action n’a pas abouti. Réessayez dans un instant.")

const InlineField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
    <Typography component="span" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
      {label} :
    </Typography>
    {children}
  </Box>
)

/** Encart de modération d'une offre : la décision est unique, Valider et Refuser disparaissent une fois l'offre tranchée. */
export function ModerationPanel({ detail, onChange }: { detail: IModerationJobDetailJson; onChange: () => void }) {
  const { offer, moderation, decision_blocked_reason, can_reclassify, reports_count } = detail
  const refusModal = useDisclosure()
  const toast = useToast()
  const [pendingAction, setPendingAction] = useState<"validate" | "reclassify" | null>(null)
  const review = moderation?.review?.status ?? offer.offer_moderation_review ?? null
  const isAnalysisUnavailable = Boolean(moderation) && offer.offer_moderation_status !== OFFER_MODERATION_STATUS.OK
  const isDecisionBlocked = decision_blocked_reason !== null
  const hint = decision_blocked_reason && !review ? BLOCKED_REASON_HINTS[decision_blocked_reason] : null

  const run = async (action: "validate" | "reclassify", call: () => Promise<{ title: string; variant?: "success" | "warning" }>) => {
    setPendingAction(action)
    try {
      toast(await call())
    } catch (error) {
      toast({ title: errorMessage(error), variant: "error" })
    } finally {
      setPendingAction(null)
      onChange()
    }
  }

  const validate = () =>
    run("validate", async () => {
      if (!moderation) throw new Error("inattendu : décision sans classification")
      const { offer_status } = await validateModerationJob(offer._id, moderation._id)
      return { title: offer_status === "Active" ? "Offre validée et publiée" : "Offre validée : elle sera publiée à la validation du compte" }
    })

  const reclassify = () =>
    run("reclassify", async () => {
      const { status } = await reclassifyModerationJob(offer._id)
      return status === OFFER_MODERATION_STATUS.OK
        ? { title: "Analyse terminée : la conformité de l’offre est à jour" }
        : { title: "L’analyse a de nouveau échoué. Réessayez plus tard.", variant: "warning" }
    })

  const refuse = async (choice: { agent_note: boolean; comment: string | null }) => {
    if (!moderation) return
    try {
      const { email_sent } = await refuseModerationJob(offer._id, { moderation_id: moderation._id, ...choice })
      toast(
        email_sent
          ? { title: "Offre refusée", description: "Le recruteur a été prévenu par e-mail." }
          : { title: "Offre refusée", description: "L’e-mail au recruteur n’a pas pu être envoyé : prévenez-le directement.", variant: "warning" }
      )
    } catch (error) {
      toast({ title: errorMessage(error), variant: "error" })
    } finally {
      onChange()
    }
  }

  return (
    <Box component="section" aria-label="Modération de l’offre" sx={{ border: "1px solid", borderColor: fr.colors.decisions.border.default.grey.default, p: fr.spacing("4v") }}>
      <RefusOffreModal isOpen={refusModal.isOpen} onClose={refusModal.onClose} findings={moderation?.findings ?? []} onConfirm={refuse} />
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), rowGap: fr.spacing("2v"), mb: fr.spacing("3v") }}>
        <InlineField label="Statut de l’offre">
          <OfferStatusBadge status={offer.offer_status} />
        </InlineField>
        <InlineField label="Modération">
          <ReviewStatusBadge review={review} isClassified={Boolean(moderation)} verdict={offer.offer_moderation_verdict} status={offer.offer_moderation_status} />
        </InlineField>
        <InlineField label="Conformité">
          <ConformityBadge verdict={moderation ? offer.offer_moderation_verdict : null} status={moderation ? offer.offer_moderation_status : null} />
        </InlineField>
        <InlineField label="Signalement">
          <Typography component="span" sx={{ fontSize: "0.875rem" }}>
            {reports_count}
          </Typography>
        </InlineField>
      </Box>
      <AgentNoteBox>
        {!moderation ? (
          <Typography sx={{ fontSize: "inherit" }}>Cette offre n’a pas été analysée.</Typography>
        ) : isAnalysisUnavailable ? (
          <Typography sx={{ fontSize: "inherit" }}>L’analyse automatique n’a pas abouti : relancez-la, ou décidez sans verdict.</Typography>
        ) : (
          <AgentNoteLines findings={moderation.findings} />
        )}
      </AgentNoteBox>
      {moderation?.review?.without_verdict && <Typography sx={{ fontSize: "0.875rem", mt: fr.spacing("2v") }}>Décision prise sans verdict IA.</Typography>}
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}>
        {hint && (
          <Typography sx={{ fontStyle: "italic", fontSize: "0.875rem", color: fr.colors.decisions.text.mention.grey.default }} id={`hint-${offer._id}`}>
            {hint}
          </Typography>
        )}
        {can_reclassify && (
          <Button priority="tertiary" size="small" iconId="fr-icon-refresh-line" onClick={reclassify} disabled={pendingAction !== null}>
            {moderation ? "Relancer l’analyse" : "Lancer l’analyse"}
          </Button>
        )}
        <Button
          size="small"
          onClick={validate}
          disabled={isDecisionBlocked || pendingAction !== null}
          nativeButtonProps={hint ? { "aria-describedby": `hint-${offer._id}` } : undefined}
        >
          {review === "validee" ? "Offre validée" : "Valider l’offre"}
        </Button>
        <Button
          size="small"
          priority="secondary"
          iconId="fr-icon-delete-line"
          onClick={refusModal.onOpen}
          disabled={isDecisionBlocked || pendingAction !== null}
          nativeButtonProps={hint ? { "aria-describedby": `hint-${offer._id}` } : undefined}
        >
          {review === "refusee" ? "Offre refusée" : "Refuser l’offre"}
        </Button>
      </Box>
    </Box>
  )
}
