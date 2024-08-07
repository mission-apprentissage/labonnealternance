import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, Image, Link, Text } from "@chakra-ui/react"
import React, { useEffect } from "react"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { SendPlausibleEvent } from "../../../utils/plausible"
import CandidatureLbaExplanation from "../CandidatureLba/CandidatureLbaExplanation"

const LbaRecruteurDetail = ({ lbaRecruteur }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Algo", {
      info_fiche: `${lbaRecruteur?.company?.siret}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [lbaRecruteur?.company?.siret])

  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0]?.scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  const { formValues } = React.useContext(DisplayContext)

  return (
    <>
      <Box mt={6} mb={4} position="relative" background="white" pt={4} pb={6} px={6} mx={["0", "30px"]}>
        <Text mb={6} color="bluefrance.500" fontSize="22px" fontWeight={700} as="h2">
          Qu’est ce qu’une candidature spontanée ?
        </Text>
        <Flex alignItems="flex-start">
          <Box maxWidth="760px">
            <Text mb={2} fontWeight={700}>
              Cette entreprise n’a pas déposé d’offre mais est susceptible de recruter des alternants.
            </Text>
            <Text mb={2}>Intéressé.e ? Transmettez-lui votre CV en soulignant votre intérêt pour intégrer son équipe dans le cadre de votre alternance.</Text>
            <Text fontWeight={700}>Les candidats envoyant des candidatures spontanées ont plus de chance de trouver un employeur.</Text>
          </Box>
          <Box ml={4} display={{ base: "none", md: "block" }}>
            <Image minWidth="168px" src="/images/lba_recruteur_advice.svg" alt="" aria-hidden={true} />
          </Box>
        </Flex>
      </Box>

      <Box
        data-testid="lbb-component"
        pb="0px"
        mt={6}
        mb={8}
        position="relative"
        background="white"
        padding={["1px 12px 12px 12px", "1px 24px 12px 24px", "1px 12px 12px 12px"]}
        mx={["0", "30px"]}
      >
        <CandidatureLbaExplanation about={"what"} />
        <CandidatureLbaExplanation about={"how"} />
      </Box>

      <Box bg="#f5f5fe" border="1px solid #e3e3fd" mx={8} mb={8} px={6} py={4}>
        <Box color="bluefrance.500" fontSize="22px" fontWeight={700}>
          Besoin d&apos;aide ?
        </Box>
        <Box color="grey.700">Découvrez les modules de formation de La bonne alternance. Des modules de quelques minutes pour bien préparer vos candidatures.</Box>
        <Box pl={6}>
          <Box pt={4}>
            &bull;
            <Link
              variant="basicUnderlined"
              ml={4}
              isExternal
              href="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
              aria-label="Formation Chercher un employeur - nouvelle fenêtre"
            >
              Chercher un employeur <ExternalLinkIcon mb="3px" mx="2px" />
            </Link>
          </Box>
          <Box pt={4}>
            &bull;
            <Link
              variant="basicUnderlined"
              ml={4}
              isExternal
              href="https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
              aria-label="Formation préparer un entretien avec un employeur - nouvelle fenêtre"
            >
              Préparer un entretien avec un employeur <ExternalLinkIcon mb="3px" mx="2px" />
            </Link>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default LbaRecruteurDetail
