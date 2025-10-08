import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import { useDisclosure } from "@/common/hooks/useDisclosure"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

import { ModalReadOnly } from "../ModalReadOnly"

export default function CandidatureParTelephone({ companyName, contactPhone, contactName }: { companyName: string; contactPhone: string; contactName: string }) {
  const { isOpen, onClose, onOpen } = useDisclosure()
  return (
    <>
      <Box sx={{ my: fr.spacing("2w") }}>
        <Button data-tracking-id="postuler-offre-partenaire" onClick={onOpen}>
          Contacter le recruteur
        </Button>
      </Box>
      <ModalReadOnly isOpen={isOpen} onClose={onClose} size="md">
        <Box sx={{ p: fr.spacing("3w") }}>
          <Typography variant="h2" sx={{ mb: fr.spacing("2w") }}>
            Postuler à l'offre de {companyName}
          </Typography>
          <Typography>L'entreprise préfère être contactée par téléphone. Pour proposer votre candidature, appelez directement le numéro suivant :</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center" }}>
            {contactName}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", my: fr.spacing("3w") }}>
            <Box sx={{ backgroundColor: "#ECECFE", p: fr.spacing("3w") }}>
              <DsfrLink href={`tel:${contactPhone}`}>
                <Typography variant="h6" sx={{ color: "#000091", fontWeight: 700 }}>
                  {contactPhone}
                </Typography>
              </DsfrLink>
            </Box>
          </Box>
        </Box>
      </ModalReadOnly>
    </>
  )
}
