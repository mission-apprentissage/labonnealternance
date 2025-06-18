import { Box, Flex, Image, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { BarberGuy } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"

export const DemandeDeContactConfirmation = ({ appointmentId, token }: { appointmentId: string; token: string }) => {
  const { isPending, data } = useQuery({
    queryKey: ["/appointment-request/context/short-recap", appointmentId],
    queryFn: () =>
      apiGet("/appointment-request/context/short-recap", {
        querystring: { appointmentId },
        headers: {
          authorization: `Bearer ${token}`,
        },
      }),
  })
  if (isPending) return null

  return (
    <Box mt={2}>
      <Flex alignItems="center">
        <Image mr={2} src="/images/paperplane2.svg" aria-hidden={true} alt="" />
        <Text mb={2} as="h1" fontWeight={700} fontSize="20px" data-testid="DemandeDeContactConfirmationTitle">
          Voilà une bonne chose de faite {data.user.firstname} {data.user.lastname} !
        </Text>
      </Flex>
      <Box mt={6}>
        <Text fontWeight="700" color="grey.750">
          {data.formation.etablissement_formateur_raison_sociale.toUpperCase()} pourra donc vous contacter au{" "}
          <Text color="bluefrance.500" as="span">
            {data.user.phone.match(/.{1,2}/g).join(".")}
          </Text>{" "}
          ou sur{" "}
          <Text color="bluefrance.500" as="span">
            {data.user.email}
          </Text>{" "}
          pour répondre à vos questions.
        </Text>
        <Text mt={6}>Vous allez recevoir un email de confirmation de votre demande de contact sur votre adresse email.</Text>
      </Box>
      <Flex bg="#F9F8F6" my={4}>
        <Box w="100px" px="40px" py="16px">
          <BarberGuy w="34px" h="38px" />
        </Box>
        <Box mt="12px" pb="24px" pr="10px">
          <Text fontSize="20px" fontWeight="700" mt="6px">
            Psst, nous avons une{" "}
            <Box as="span" color="bluefrance.500">
              info pour vous !
            </Box>
          </Text>
          <Text fontSize="16px" mt="12px">
            <b>Pour préparer votre premier contact avec le centre formation,</b> répondez à notre quiz{" "}
            <DsfrLink href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987" aria-label="Prendre contact avec une école - nouvelle fenêtre">
              Prendre contact avec une école
            </DsfrLink>
          </Text>
        </Box>
      </Flex>
    </Box>
  )
}
