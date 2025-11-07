import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import { useToast } from "@/app/hooks/useToast"
import type { useDisclosure } from "@/common/hooks/useDisclosure"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { SendPlausibleEvent } from "@/utils/plausible"

export const RecruteurLbaNoContactModal = ({
  item,
  modalControls,
}: {
  item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
  modalControls: ReturnType<typeof useDisclosure>
}) => {
  const toast = useToast()

  const { isOpen, onClose: onModalClose } = modalControls
  const raisonSociale = item.company?.name
  const phone = item.contact?.phone

  const onAnswer = async (isPositive: boolean) => {
    const eventName = isPositive ? "Clic Je vais contacter - Fiche entreprise Algo" : "Clic Je ne vais pas contacter - Fiche entreprise Algo"
    await SendPlausibleEvent(eventName, {
      info_fiche: item.id,
    })
    toast({
      title: "Merci pour votre réponse !",
    })
    onModalClose()
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onModalClose}>
      <Box
        sx={{
          px: "32px",
          pt: fr.spacing("2w"),
          pb: fr.spacing("4w"),
          maxWidth: 620,
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontWeight: 700,
            fontSize: "24px",
            lineHeight: "32px",
            mb: fr.spacing("2w"),
          }}
        >
          Pour envoyer votre candidature spontanée :
        </Typography>
        {phone && (
          <Typography my={fr.spacing("2w")}>
            <span className="fr-icon-phone-line" style={{ marginRight: "8px" }}></span>
            Vous pouvez contacter l'entreprise au <DsfrLink href={`tel:${phone}`}>{phone}</DsfrLink>
          </Typography>
        )}
        <Typography>
          Nous ne disposons pas de contact mail{!phone && " ni de numéro de téléphone"} pour cette entreprise, mais peut-être que vous en trouverez un sur internet !
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mt: fr.spacing("2w") }}>
          <Image style={{ display: "inline-block" }} width={24} height={24} src="/images/icons/search-eye-line.svg" alt="" />
          <Typography>
            Lancer une recherche Google sur{" "}
            <DsfrLink href={`https://www.google.com/search?q=${encodeURIComponent(raisonSociale)}`} external aria-label="Accéder au détail de l'astuce">
              {raisonSociale}
            </DsfrLink>
          </Typography>
        </Box>
        <hr style={{ marginTop: 24, marginBottom: 23, paddingBottom: 1 }} />
        <Typography
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: "24px",
            lineHeight: "32px",
            my: fr.spacing("2w"),
          }}
        >
          Allez-vous contacter cette entreprise ?
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: "16px",
            button: {
              px: "16px",
              py: {
                xs: "16px",
                sm: "8px",
              },
              width: {
                xs: "100%",
                sm: "fit-content",
              },
              justifyContent: "center",
            },
          }}
        >
          <Button onClick={async () => onAnswer(false)} priority="secondary" aria-label="Je ne vais pas la contacter">
            👎 Non, je ne vais pas la contacter
          </Button>
          <Button onClick={async () => onAnswer(true)} aria-label="Je vais la contacter">
            👍 Oui, je vais la contacter
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
