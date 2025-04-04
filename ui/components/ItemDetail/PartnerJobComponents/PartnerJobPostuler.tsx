import { Box, Link } from "@chakra-ui/react"
import { ILbaItemPartnerJob } from "shared"

import { focusWithin } from "@/theme/theme-lba-tools"
import { SendPlausibleEvent } from "@/utils/plausible"

import { CandidatureLba } from "../CandidatureLba/CandidatureLba"
import CandidatureParTelephone from "../CandidatureParTelephone"

const filteredPartnerLabels = ["Kelio", "Veritone", "France Travail", "BPCE"]

export const PartnerJobPostuler = ({ job, isCollapsedHeader }: { job: ILbaItemPartnerJob; isCollapsedHeader: boolean }) => {
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
        <Link
          data-tracking-id="postuler-offre-job-partner"
          {...focusWithin}
          variant="postuler"
          href={job.contact.url}
          target={job.job.partner_label}
          onClick={() =>
            SendPlausibleEvent(`Clic Postuler - Fiche entreprise Offre ${job.job.partner_label}`, {
              info_fiche: job.id,
            })
          }
        >
          Je postule{filteredPartnerLabels.includes(job.job.partner_label) ? "" : ` sur ${job.job.partner_label}`}
        </Link>
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
