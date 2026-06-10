import { useDisclosure } from "@/common/hooks/useDisclosure"
import { SendPlausibleEvent } from "@/utils/plausible"
import { DemandeDeContactButton } from "./DemandeDeContactButton"
import { type DemandeDeContactContext, DemandeDeContactModal } from "./DemandeDeContactModal"

export const DemandeDeContact = ({
  context: { cle_ministere_educatif },
  context,
  referrer,
  isCollapsedHeader,
  onRdvSuccess,
  hideButton = false,
}: {
  context: DemandeDeContactContext
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
