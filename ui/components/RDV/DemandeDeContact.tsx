import { useDisclosure } from "@/common/hooks/useDisclosure"
import { DemandeDeContactButton } from "@/components/RDV/DemandeDeContactButton"
import { DemandeDeContactModal } from "@/components/RDV/DemandeDeContactModal"
import { SendPlausibleEvent } from "@/utils/plausible"

export const DemandeDeContact = ({
  context: { cle_ministere_educatif },
  context,
  referrer,
  isCollapsedHeader,
  onRdvSuccess,
  hideButton = false,
}: {
  context: { cle_ministere_educatif: string; etablissement_formateur_entreprise_raison_sociale: string }
  referrer: string
  isCollapsedHeader?: boolean
  onRdvSuccess: () => void
  hideButton?: boolean
}) => {
  const modalControls = useDisclosure()
  const { onOpen } = modalControls

  const localOnOpen = () => {
    onOpen()
    SendPlausibleEvent("Clic Prendre RDV - Fiche formation", {
      info_fiche: `${cle_ministere_educatif}`,
    })
  }

  return (
    <>
      {!hideButton && <DemandeDeContactButton onClick={localOnOpen} isCollapsedHeader={isCollapsedHeader} />}
      <DemandeDeContactModal modalControls={modalControls} context={context} referrer={referrer} onRdvSuccess={onRdvSuccess} />
    </>
  )
}
