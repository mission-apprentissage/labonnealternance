import { Box, Text } from "@chakra-ui/react"

import { MapPin2Fill } from "../../../../theme/components/icons"

type Props = {
  entrepriseRaisonSociale: string;
  intitule: string;
  adresse: string;
  codePostal: string;
  ville: string;
}

/**
 * Etablissement information.
 */
export const ContactCfaSummary = (props: Props) => {
  const { adresse, codePostal, entrepriseRaisonSociale, ville, intitule } = props

  return (
    <Box py={[0, 7]} mt={2}>
      <Text fontWeight="700" color="grey.750">
        {entrepriseRaisonSociale}
      </Text>
      <Text fontWeight="400" color="grey.750">
        {intitule}
      </Text>
      {adresse && codePostal && (
        <Box mt={1}>
          <MapPin2Fill color="info" mb={1} />
          <Text as="span" ml={2}>
            {adresse},{" "}
            <Text as="span">
              {codePostal} {ville}
            </Text>
          </Text>
        </Box>
      )}
      <Box mt={8} borderBottom="1px solid #D0C9C4" />
    </Box>
  )
}
