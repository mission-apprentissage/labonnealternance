import { Box, Link } from "@chakra-ui/react"
import { ILbaItemPartnerJob } from "shared"

import { focusWithin } from "@/theme/theme-lba-tools"
import { SendPlausibleEvent } from "@/utils/plausible"

import CandidatureLba from "../CandidatureLba/CandidatureLba"
import CandidatureParTelephone from "../CandidatureParTelephone"

export const PartnerJobPostuler = ({ job, isCollapsedHeader }: { job: ILbaItemPartnerJob; isCollapsedHeader: boolean }) => {
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
          Je postule sur {job.job.partner_label}
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
