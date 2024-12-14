import { Box, Link } from "@chakra-ui/react"

import { focusWithin } from "@/theme/theme-lba-tools"
import { SendPlausibleEvent } from "@/utils/plausible"

export const PartnerJobPostuler = ({ job }) => {
  if (!job?.contact?.url && !job?.contact?.email) {
    return null
  }

  const postuleSurOffrePartenaire = () => {
    SendPlausibleEvent(`Clic Postuler - Fiche entreprise Offre ${job.job.partner_label}`, {
      info_fiche: job.id,
    })
  }

  if (job?.contact?.url) {
    return (
      <Box my={4}>
        <Link
          data-tracking-id="postuler-offre-job-partner"
          {...focusWithin}
          variant="postuler"
          href={job.contact.url}
          target={job.job.partner_label}
          onClick={postuleSurOffrePartenaire}
        >
          Je postule sur {job.job.partner_label}
        </Link>
      </Box>
    )
  }

  if (job?.contact?.email) {
    return (
      <Box my={4}>
        <Link
          data-tracking-id="postuler-offre-job-partner"
          {...focusWithin}
          variant="postuler"
          href={job.contact.email}
          target={job.job.partner_label}
          onClick={postuleSurOffrePartenaire}
        >
          J'envoie ma candidature
        </Link>
      </Box>
    )
  }
}
