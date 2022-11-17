import { Box, Text } from "@chakra-ui/react";
import { MapPin2Fill } from "../../../theme/components/icons";

/**
 * @description Etablissement information.
 * @param {Object} props
 * @param {String} props.entreprise_raison_sociale
 * @param {String} props.intitule
 * @param {String} props.adresse
 * @param {String} props.code_postal
 * @param {String} props.ville
 * @returns {JSX.Element}
 */
export const ContactCfaComponent = (props) => {
  const { adresse, codePostal, entrepriseRaisonSociale, ville } = props;

  return (
    <Box py={[0, 7]} mt={2}>
      <Text fontWeight="700" color="grey.750">
        {entrepriseRaisonSociale}
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
  );
};
