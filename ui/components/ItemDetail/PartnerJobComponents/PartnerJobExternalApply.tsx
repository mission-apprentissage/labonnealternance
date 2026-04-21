import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import type { ILbaItemPartnerJobJson } from "shared"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { notifyJobPostulerV3 } from "@/utils/api"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"
import { SendPlausibleEvent } from "@/utils/plausible"

const filteredPartnerLabels = ["Kelio", "Veritone", "France Travail", "BPCE", "FranceTravail CEGID"]

export default function PartnerJobExternalApply({ job }: { job: ILbaItemPartnerJobJson }) {
  const { isOpen, onClose, onOpen } = useDisclosure()

  const matomoPayload = {
    job_offer_id: job.id,
    job_offer_type: "offre-partenaire",
    job_offer_company: job.company?.name ?? "",
    job_offer_name: job.title,
    partner_name: job.job.partner_label,
  }

  const closeModalWithEvent = (event: string) => {
    pushMatomoEvent({
      ...matomoPayload,
      event,
    })
    onClose()
  }

  return (
    <>
      <Button
        linkProps={{
          href: job.contact.url,
          onClick: () => {
            SendPlausibleEvent("Clic Postuler - Fiche emploi", { partner_label: job.job.partner_label, info_fiche: job.id })
            notifyJobPostulerV3(job)
            setTimeout(() => {
              onOpen()
            }, 2000)
            pushMatomoEvent({
              ...matomoPayload,
              event: MATOMO_EVENTS.PARTNER_APPLY_POPIN_SHOW,
            })
          },
        }}
        data-tracking-id="postuler-offre-job-partner"
      >
        Je postule{filteredPartnerLabels.includes(job.job.partner_label) ? "" : ` sur ${job.job.partner_label}`}
      </Button>
      <ModalReadOnly
        isOpen={isOpen}
        onClose={() => {
          closeModalWithEvent(MATOMO_EVENTS.PARTNER_APPLY_POPIN_DISMISSED)
        }}
        size="md"
      >
        <Box sx={{ p: fr.spacing("6v") }}>
          <Typography variant="h2" sx={{ mb: fr.spacing("4v") }}>
            Avez-vous postulé à l’offre de {job.title} ?
          </Typography>
          <Typography>Nous veillons à ce que les offres proposées par nos partenaires vous aident dans vos recherches d’une alternance. </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "row", gap: fr.spacing("4v"), m: fr.spacing("8v"), mt: fr.spacing("2v") }}>
          <Box sx={{ flex: 1, textAlign: "right" }}>
            <Button onClick={() => closeModalWithEvent(MATOMO_EVENTS.PARTNER_APPLY_POPIN_CONFIRMED)}>Oui, j'ai postulé</Button>
          </Box>
          <Box sx={{ flex: 1, textAlign: "left" }}>
            <Button priority="secondary" onClick={() => closeModalWithEvent(MATOMO_EVENTS.PARTNER_APPLY_POPIN_LATER)}>
              Non, peut-être plus tard
            </Button>
          </Box>
        </Box>
      </ModalReadOnly>
    </>
  )
}
