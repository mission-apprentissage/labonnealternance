"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { ILbaItemPartnerJobJson } from "shared"

import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"
import { CandidatureLbaModal } from "@/components/ItemDetail/CandidatureLba/CandidatureLbaModal"
import { notifyJobPostulerV3 } from "@/utils/api"
import { SendPlausibleEvent } from "@/utils/plausible"

import CandidatureParTelephone from "../CandidatureParTelephone"

const filteredPartnerLabels = ["Kelio", "Veritone", "France Travail", "BPCE"]

export const PartnerJobPostuler = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  // KBA fix enum shared/models/lbaItem.model.ts
  if (["Pourvue", "Annulée"].includes(job.job.status)) return null
  if (job.contact?.email) {
    return (
      <Box my={4}>
        <CandidaterButton item={job} buttonLabel={"J'envoie ma candidature"} CandidaterModal={CandidatureLbaModal} />
      </Box>
    )
  }

  if (job.contact?.url) {
    return (
      <Box sx={{ my: fr.spacing("2w") }}>
        <Button
          linkProps={{
            href: job.contact.url,
            onClick: () => {
              SendPlausibleEvent("Clic Postuler - Fiche emploi", { partner_label: job.job.partner_label, info_fiche: job.id })
              notifyJobPostulerV3(job)
            },
          }}
          data-tracking-id="postuler-offre-job-partner"
        >
          Je postule{filteredPartnerLabels.includes(job.job.partner_label) ? "" : ` sur ${job.job.partner_label}`}
        </Button>
      </Box>
    )
  }

  if (job.contact?.phone) {
    return <CandidatureParTelephone companyName={job.company.name || null} contactName={job.contact.name || null} contactPhone={job.contact.phone || null} />
  }

  return null
}
