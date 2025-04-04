import { Box, Flex, Heading, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { Link } from "@mui/material"
import { IoMail } from "react-icons/io5"

export default function ConfirmationCreationCompte() {
  return (
    <Box px={["6", "8"]} py={6}>
      <Heading fontSize={["32px", "40px"]} as="h1" data-testid="validation-email-title">
        Vérifiez votre messagerie
      </Heading>
      <Box fontSize={["16px", "22px"]}>
        <Text>Nous vous avons envoyé un email renseigné précédement avec un lien de confirmation. Celui-ci sera valide pour les 60 prochaines minutes.</Text>
      </Box>

      <Box>
        <Heading fontSize={["18px", "32px"]} as="h2" pb={3}>
          Vous n'avez rien reçu ?
        </Heading>
        <Flex alignItems="center">
          <IoMail />
          <Link
            sx={{ marginLeft: fr.spacing("1w") }}
            href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Creation%20compte%20LBAR%20-%20Mail%20non%20recu"
            underline="hover"
          >
            Contacter l'équipe La bonne alternance
          </Link>
        </Flex>
      </Box>
    </Box>
  )
}
