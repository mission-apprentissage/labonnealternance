import { Box, Button, Flex, Image, SimpleGrid, Text } from "@chakra-ui/react"
import { Edit2Fill, InfoCircle } from "../theme/components/icons"

export default ({ disabled, informationOpco, resetOpcoChoice }) => {
  return (
    <Box backgroundColor="#F5F5FE" p={5} mt={7}>
      <SimpleGrid columns={1} spacing="20px">
        <Flex align="center" justify="space-between">
          <Text fontWeight="700" fontSize="20px">
            Votre OPCO
          </Text>
          <Button isDisabled={disabled} onClick={() => resetOpcoChoice()} variant="pill" color="bluefrance.500" leftIcon={<Edit2Fill width={3} />}>
            Modifier
          </Button>
        </Flex>
        <Flex align="flex-start">
          <Text maxW="75%" pr={1} fontSize="14px">
            {informationOpco?.description}
          </Text>
          <Image src={informationOpco?.image} />
        </Flex>
        <Flex alignItems="flex-start">
          <InfoCircle w="20px" h="20px" mr={2} color="#000091" />
          <Text color="#000091" fontSize="12px">
            Chaque entreprise est rattachée à un OPCO. C’est votre acteur de référence pour vous accompagner dans vos démarches liées à l’alternance (financement des contrats,
            formation, ...). Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.
          </Text>
        </Flex>
      </SimpleGrid>
    </Box>
  )
}
