"use client"
import { Box } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { ILbaItemPartnerJobJson } from "shared"

import { SendPlausibleEvent } from "@/utils/plausible"

import { CandidatureLba } from "../CandidatureLba/CandidatureLba"
import CandidatureParTelephone from "../CandidatureParTelephone"

const filteredPartnerLabels = ["Kelio", "Veritone", "France Travail", "BPCE"]

export const PartnerJobPostuler = ({ job, isCollapsedHeader }: { job: ILbaItemPartnerJobJson; isCollapsedHeader: boolean }) => {
  // KBA fix enum shared/models/lbaItem.model.ts
  if (["Pourvue", "Annulée"].includes(job.job.status)) return null
  if (job.contact?.email) {
    return (
      <Box my={4}>
        <CandidatureLba item={job} />
      </Box>
    )
  }

  if (job.contact?.url) {
    return (
      <Box my={isCollapsedHeader ? 2 : 4}>
        <Button
          linkProps={{
            href: job.contact.url,
            onClick: () => SendPlausibleEvent("Clic Postuler - Fiche emploi", { partner_label: job.job.partner_label, info_fiche: job.id }),
          }}
          data-tracking-id="postuler-offre-job-partner"
        >
          Je postule{filteredPartnerLabels.includes(job.job.partner_label) ? "" : ` sur ${job.job.partner_label}`}
        </Button>
      </Box>
    )
  }

  if (job.contact?.phone) {
    return (
      <CandidatureParTelephone
        companyName={job.company.name || null}
        contactName={job.contact.name || null}
        contactPhone={job.contact.phone || null}
        urlPostulation={job.contact.url || null}
      />
    )
  }

  return null
}
