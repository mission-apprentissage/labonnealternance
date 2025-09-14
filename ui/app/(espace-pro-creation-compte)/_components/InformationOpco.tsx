import { Box, Button, Flex, SimpleGrid, Text } from "@chakra-ui/react"
import Image from "next/image"

import { Edit2Fill, InfoCircle } from "@/theme/components/icons"
import { InfosOpco } from "@/theme/components/logos/infosOpcos"

export const InformationOpco = ({ isUpdatable, infosOpco, resetOpcoChoice }: { isUpdatable: boolean; resetOpcoChoice: () => void; infosOpco: InfosOpco }) => {
  return (
    <Box backgroundColor="#F5F5FE" p={3} mt={3}>
      <SimpleGrid columns={1} spacing="20px">
        <Flex align="center" justify="space-between">
          <Text fontWeight="700" fontSize="20px">
            Votre OPCO
          </Text>
          {isUpdatable && (
            <Button onClick={resetOpcoChoice} variant="pill" color="bluefrance.500" leftIcon={<Edit2Fill width={3} />}>
              Modifier
            </Button>
          )}
        </Flex>
        <Flex align="flex-start" direction={["column", "column", "row", "row"]} gap={[2, 2, 4, 4]}>
          <Text>{infosOpco.description}</Text>
          <Image src={infosOpco.image} alt="" width={80} />
        </Flex>
        <Flex alignItems="flex-start" gap="2px">
          <Box lineHeight={["16px", "16px", "16px", "20px"]}>
            <InfoCircle sx={{ color: "#000091", width: { xs: "14px", md: "20px" } }} />
          </Box>
          <Text color="#000091">
            Chaque entreprise est rattachée à un OPCO. C’est votre acteur de référence pour vous accompagner dans vos démarches liées à l’alternance (financement des contrats,
            formation, ...). Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.
          </Text>
        </Flex>
      </SimpleGrid>
    </Box>
  )
}
