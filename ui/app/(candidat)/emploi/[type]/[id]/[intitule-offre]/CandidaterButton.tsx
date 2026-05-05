"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useState } from "react"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { isOfferActive } from "@/app/(candidat)/(recherche)/recherche/_components/isOfferActive"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { useSubmitCandidature } from "@/components/ItemDetail/CandidatureLba/services/submitCandidature"
import ItemDetailApplicationsStatus from "@/components/ItemDetail/ItemDetailServices/ItemDetailApplicationStatus"
import { notifyJobPostulerV3 } from "@/utils/api"
import { getMatomoJobOfferType, MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"
import { SendPlausibleEvent } from "@/utils/plausible"

export function CandidaterButton({
  item,
  CandidaterModal,
  buttonLabel,
  showScrollToTop = false,
  CandidatureSimplifie = false,
}: {
  item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
  buttonLabel: string
  showScrollToTop?: boolean
  CandidatureSimplifie?: boolean
  CandidaterModal?: (props: {
    item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
    modalControls: ReturnType<typeof useDisclosure>
    submitControls: ReturnType<typeof useSubmitCandidature>
  }) => React.ReactNode
}) {
  const [modalId, setModalId] = useState<number>(() => Math.random())
  const modalControls = useDisclosure()
  const submitControls = useSubmitCandidature(item)
  const { applicationDate } = submitControls
  const { onOpen } = modalControls
  const kind = item.ideaType

  const openApplicationForm = () => {
    // re-instancie la modal
    setModalId(Math.random())
    onOpen()
    const emailAvailable = item.contact?.hasEmail
    SendPlausibleEvent("Clic Postuler - Fiche emploi", { partner_label: kind, info_fiche: item.id, "avec contact": emailAvailable ? "oui" : "non" })
    notifyJobPostulerV3(item)
    pushMatomoEvent({
      event: MATOMO_EVENTS.SMART_APPLY_OPENED,
      job_offer_id: item.id,
      job_offer_type: getMatomoJobOfferType(item.ideaType),
      job_offer_company: item.company?.name || "non_renseigné",
      job_offer_name: item.title || "non_renseigné",
      apply_entry_point: "offer_details",
    })
  }

  const hasAppliedValue = Boolean(applicationDate)

  return (
    <Box data-testid={`candidater-${item.ideaType}`} sx={{ width: showScrollToTop ? "100%" : "auto" }}>
      <CandidaterModal key={modalId} item={item} modalControls={modalControls} submitControls={submitControls} />
      <Box>
        {hasAppliedValue ? (
          <ItemDetailApplicationsStatus item={item} />
        ) : isOfferActive(item) ? (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: showScrollToTop ? "space-between" : undefined,
                my: showScrollToTop ? fr.spacing("1v") : fr.spacing("3v"),
              }}
            >
              {CandidatureSimplifie ? (
                <Button iconId="fr-icon-mail-send-fill" onClick={openApplicationForm} aria-label="Ouvrir le formulaire d'envoi de candidature" data-testid="postuler-button">
                  Candidature simplifiée
                </Button>
              ) : (
                <Button onClick={openApplicationForm} aria-label="Ouvrir le formulaire d'envoi de candidature" data-testid="postuler-button">
                  {buttonLabel}
                </Button>
              )}
              {showScrollToTop ? (
                <Button
                  iconId="fr-icon-arrow-up-line"
                  priority="primary"
                  size="medium"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  aria-label="Retour en haut de la page"
                  title="Retour en haut"
                />
              ) : null}
            </Box>
          </>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  )
}
