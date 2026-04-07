"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useState } from "react"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import { hasEmail } from "@/app/(candidat)/(recherche)/recherche/_components/hasEmail"
import { isOfferActive } from "@/app/(candidat)/(recherche)/recherche/_components/isOfferActive"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { useSubmitCandidature } from "@/components/ItemDetail/CandidatureLba/services/submitCandidature"
import ItemDetailApplicationsStatus, { tagCandidatureSimplifiee } from "@/components/ItemDetail/ItemDetailServices/ItemDetailApplicationStatus"
import { notifyJobPostulerV3 } from "@/utils/api"
import { SendPlausibleEvent } from "@/utils/plausible"

export function CandidaterButton({
  item,
  CandidaterModal,
  buttonLabel,
}: {
  item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
  buttonLabel: string
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
    const emailAvailable = hasEmail(item)
    SendPlausibleEvent("Clic Postuler - Fiche emploi", { partner_label: kind, info_fiche: item.id, "avec contact": emailAvailable ? "oui" : "non" })
    notifyJobPostulerV3(item)
  }

  const hasAppliedValue = Boolean(applicationDate)

  return (
    <Box data-testid={`candidater-${item.ideaType}`}>
      <CandidaterModal key={modalId} item={item} modalControls={modalControls} submitControls={submitControls} />
      <Box>
        {hasAppliedValue ? (
          <ItemDetailApplicationsStatus item={item} />
        ) : isOfferActive(item) ? (
          <>
            <Box sx={{ mb: { xs: 0, sm: fr.spacing("4v") }, mt: fr.spacing("4v") }}>
              <Button onClick={openApplicationForm} aria-label="Ouvrir le formulaire d'envoi de candidature" data-testid="postuler-button">
                {buttonLabel}
              </Button>
              {tagCandidatureSimplifiee()}
            </Box>
          </>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  )
}
