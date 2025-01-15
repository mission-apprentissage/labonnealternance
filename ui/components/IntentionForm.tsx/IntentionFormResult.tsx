import { Flex, Text } from "@chakra-ui/react"
import { ApplicationIntention } from "shared/constants/application"

export const IntensionFormResult = ({ intention, canceled = false }: { intention: ApplicationIntention; canceled?: boolean }) => {
  return (
    <Flex direction="column" width="80%" maxWidth="992px" margin="auto" pt={12} alignItems="center" textAlign="center" data-testid="IntentionFormConclusion">
      {canceled ? (
        <>
          <Text as="h1" fontSize="24px" fontWeight={700}>
            C’est noté ! Aucune réponse ne sera envoyée au candidat.
          </Text>
          <Text fontSize="20px" pt={4}>
            Pensez toutefois à revenir plus tard pour lui répondre. Les réponses des recruteurs permettent aux candidats d’y voir plus clair pour leurs futures candidatures.
          </Text>
        </>
      ) : (
        <>
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
        </>
      )}
    </Flex>
  )
}
