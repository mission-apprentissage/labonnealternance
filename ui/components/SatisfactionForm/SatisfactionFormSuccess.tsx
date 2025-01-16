import { Flex, Text } from "@chakra-ui/react"
import { ApplicationIntention } from "shared/constants/application"

export const SatisfactionFormSuccess = ({ intention }: { intention: ApplicationIntention }) => {
  return (
    <Flex direction="column" width="80%" maxWidth="992px" margin="auto" pt={12} alignItems="center" textAlign="center" data-testid="SatisfactionFormSuccess">
      <Text as="h1" fontSize="24px" fontWeight={700}>
        Merci d&apos;avoir pris le temps d&apos;envoyer un message au candidat.
      </Text>
      {intention === ApplicationIntention.NESAISPAS || intention === ApplicationIntention.ENTRETIEN ? (
        <Text fontSize="20px" pt={4}>
          Il dispose désormais de vos coordonnées pour poursuivre l&apos;échange.
        </Text>
      ) : (
        <Text fontSize="20px" pt={4}>
          Cela permet aux futurs alternants de comprendre les raisons du refus, et de s&apos;améliorer pour leurs prochaines candidatures.
        </Text>
      )}
    </Flex>
  )
}
