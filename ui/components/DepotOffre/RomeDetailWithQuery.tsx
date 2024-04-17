import { Flex, Spinner, Text, Box, Heading } from "@chakra-ui/react"
import { useQuery } from "react-query"

import { getRomeDetail } from "@/utils/api"

import { RomeDetail } from "./RomeDetail"

export const RomeDetailWithQuery = ({ rome, appellation }: { rome: string; appellation: any }) => {
  const { data, isLoading, error } = useQuery(["getRomeDetail", rome, appellation], () => getRomeDetail(rome), {
    retry: false,
  })

  return isLoading ? (
    <Flex h="100%" justify="center" align="center" direction="column">
      <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
      <Text>Recherche en cours...</Text>
    </Flex>
  ) : error ? (
    <Box border="1px solid #000091" p={5}>
      <Heading fontSize="24px" mb={3}>
        {appellation}
      </Heading>
      <Text fontSize="14px">La fiche métier n'a pas pu être trouvée, merci de le <Link aria-label="Envoi d'un email à l'équipe La bonne alternance"
                href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Dépôt%20offre%20-%20ROME%20manquant"
                variant="basicUnderlinedBlue"
              >signaler à notre équipe support</Link> en précisant le métier cherché
      
      </Text>
    </Box>
  ) : (
    <RomeDetail {...({ appellation, ...data } as any)} />
  )
}
