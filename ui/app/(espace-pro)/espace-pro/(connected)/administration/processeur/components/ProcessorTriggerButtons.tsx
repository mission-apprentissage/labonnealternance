"use client"

import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { apiPost } from "@/utils/api.utils"

type TriggerableJob = "processApplications" | "processRecruiterIntentions" | "processJobPartnersForApi" | "importCatalogueFormationJob" | "updateHandiEngagementForce"

const JOBS: { name: TriggerableJob; label: string; confirmMessage?: string }[] = [
  { name: "processApplications", label: "Traitement des candidatures" },
  { name: "processRecruiterIntentions", label: "Émission des intentions recruteurs" },
  { name: "processJobPartnersForApi", label: "Traitement des offres partenaires (API)" },
  { name: "importCatalogueFormationJob", label: "Import catalogue des formations" },
  {
    name: "updateHandiEngagementForce",
    label: "Mise à jour de l'engagement handicap (force)",
    confirmMessage: "Ce job ignore le garde-fou de marge ±20% et peut supprimer des entrées du référentiel d'engagement handicap. Confirmer le déclenchement ?",
  },
]

const COOLDOWN_MS = 10_000

function TriggerButton({ name, label, confirmMessage }: { name: TriggerableJob; label: string; confirmMessage?: string }) {
  const [cooldown, setCooldown] = useState(false)
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current)
    }
  }, [])

  const mutation = useMutation({
    mutationFn: () => apiPost("/_private/admin/processor/trigger", { body: { job: name } }),
    onSuccess: () => {
      setCooldown(true)
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current)
      cooldownTimeoutRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS)
    },
  })

  const handleClick = () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return
    mutation.mutate()
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <Button priority="primary" size="small" disabled={cooldown || mutation.isPending} onClick={handleClick}>
        {label}
      </Button>
      {mutation.isError && <Typography sx={{ fontSize: "12px", color: "#CE0500" }}>Erreur lors du déclenchement du job</Typography>}
      {cooldown && <Typography sx={{ fontSize: "12px", color: "#18753C" }}>Ajouté en file d'attente</Typography>}
    </Box>
  )
}

export function ProcessorTriggerButtons() {
  return (
    <Box sx={{ my: "24px" }}>
      <Typography variant="h6" gutterBottom>
        Déclencher un job manuellement
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {JOBS.map((job) => (
          <TriggerButton key={job.name} name={job.name} label={job.label} confirmMessage={job.confirmMessage} />
        ))}
      </Box>
    </Box>
  )
}
