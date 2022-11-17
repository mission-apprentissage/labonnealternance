import { Box, Button, Flex, Link, Select, SimpleGrid, Text } from "@chakra-ui/react"
import { ExternalLinkLine, InfoCircle } from "../theme/components/icons"

export default ({ setOpcoChoice, setValidateOpcoChoice, opcoChoice }) => {
  return (
    <Box backgroundColor="#F5F5FE" p={5} mb={7}>
      <SimpleGrid columns={1} spacing="20px">
        <Text fontWeight="700" fontSize="20px">
          Votre OPCO
        </Text>
        <Flex alignItems="flex-start">
          <InfoCircle w="20px" h="20px" mr={2} color="#000091" />
          <Text color="#000091">
            Chaque entreprise est rattachée à un OPCO. C’est votre acteur de référence pour vous accompagner dans vos démarches liées à l’alternance (financement des contrats,
            formation, ...). Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.
          </Text>
        </Flex>
        <Text>
          <strong>ÉTAPE 1 :</strong> Retrouver votre OPCO sur le site France Compétences
        </Text>
        <Box>
          <Button as={Link} variant="primary" rightIcon={<ExternalLinkLine />} href="https://quel-est-mon-opco.francecompetences.fr/" isExternal>
            Retrouver mon Opco
          </Button>
        </Box>
        <Text>
          <strong>ÉTAPE 2 :</strong> Renseignez votre OPCO ci-dessous
        </Text>
        <Flex align="center" justify="center">
          <Select variant="outline" size="md" name="opco" maxW="80%" mr={3} onChange={(e) => setOpcoChoice(e.target.value)}>
            <option value="" hidden>
              Sélectionnez un OPCO
            </option>
            <option value="AFDAS">AFDAS</option>
            <option value="AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre">AKTO</option>
            <option value="ATLAS">ATLAS</option>
            <option value="Constructys">Constructys</option>
            <option value="L'Opcommerce">L'Opcommerce</option>
            <option value="OCAPIAT">OCAPIAT</option>
            <option value="OPCO 2i">Opco 2i</option>
            <option value="Opco entreprises de proximité">Opco EP</option>
            <option value="Opco Mobilités">Opco Mobilités</option>
            <option value="Opco Santé">Opco Santé</option>
            <option value="Uniformation, l'Opco de la Cohésion sociale">Uniformation, l'Opco de la Cohésion sociale</option>
          </Select>
          <Button isDisabled={opcoChoice === undefined} isActive={opcoChoice !== undefined} variant="form" px={5} onClick={setValidateOpcoChoice.toggle}>
            Valider
          </Button>
        </Flex>
      </SimpleGrid>
    </Box>
  )
}
