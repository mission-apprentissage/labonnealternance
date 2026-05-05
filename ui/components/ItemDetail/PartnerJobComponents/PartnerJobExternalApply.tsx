import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Dialog, Typography } from "@mui/material"
import type { ILbaItemPartnerJobJson } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { notifyJobPostulerV3 } from "@/utils/api"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"
import { SendPlausibleEvent } from "@/utils/plausible"

const partnerLabelsShownInCta = [
  JOBPARTNERS_LABEL.LEBONCOIN,
  JOBPARTNERS_LABEL.APEC,
  JOBPARTNERS_LABEL.RH_ALTERNANCE,
  JOBPARTNERS_LABEL.JOBTEASER,
  JOBPARTNERS_LABEL.METEOJOB,
  JOBPARTNERS_LABEL.HELLOWORK,
  "Jobs that make sense",
]
const shouldShowPartnerLabelInCta = (partnerLabel: string) => partnerLabelsShownInCta.includes(partnerLabel)

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
      <Box sx={{ mb: fr.spacing("2v"), mt: fr.spacing("2v") }}>
        <Button
          linkProps={{
            href: job.contact.url,
            onClick: () => {
              let partnerDomain = "non_renseigné"
              try {
                partnerDomain = new URL(job.contact.url).hostname
              } catch (_e) {
                // URL malformée, on garde la valeur par défaut
              }
              pushMatomoEvent({
                ...matomoPayload,
                event: MATOMO_EVENTS.APPLY_REDIRECT_CLICKED,
                partner_domain: partnerDomain,
              })
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
          Je postule{!shouldShowPartnerLabelInCta(job.job.partner_label) ? "" : ` sur ${job.job.partner_label}`}
        </Button>
      </Box>
      <Dialog
        open={isOpen}
        onClose={() => {
          closeModalWithEvent(MATOMO_EVENTS.PARTNER_APPLY_POPIN_DISMISSED)
        }}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-container": {
            alignItems: { xs: "flex-end", sm: "flex-start" },
            pt: { sm: "10vh" },
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
          },
          paper: {
            onClick: (e) => e.stopPropagation(),
            sx: {
              m: { xs: 0, sm: undefined },
              maxHeight: { xs: "90vh", sm: undefined },
              width: { xs: "100%", sm: undefined },
            },
          },
        }}
      >
        <Box sx={{ display: "flex", alignSelf: "flex-end" }}>
          <ModalCloseButton onClose={() => closeModalWithEvent(MATOMO_EVENTS.PARTNER_APPLY_POPIN_DISMISSED)} />
        </Box>
        <Box sx={{ p: fr.spacing("6v"), pt: 0 }}>
          <Typography variant="h2" sx={{ mb: fr.spacing("4v") }}>
            Avez-vous postulé à l’offre de {job.title} ?
          </Typography>
          <Typography>Nous veillons à ce que les offres proposées par nos partenaires vous aident dans vos recherches d’une alternance. </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: { sm: "center" },
            gap: fr.spacing("2v"),
            px: fr.spacing("6v"),
            pb: fr.spacing("6v"),
            "& > .fr-btn": {
              justifyContent: "center",
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          <Button onClick={() => closeModalWithEvent(MATOMO_EVENTS.PARTNER_APPLY_POPIN_CONFIRMED)}>Oui, j’ai postulé</Button>
          <Button priority="secondary" onClick={() => closeModalWithEvent(MATOMO_EVENTS.PARTNER_APPLY_POPIN_LATER)}>
            Non, peut-être plus tard
          </Button>
        </Box>
      </Dialog>
    </>
  )
}
