import { Flex, Stack } from "@chakra-ui/react"
import { AUTHTYPE } from "../../common/contants"
import { AnimationContainer, Etablissement } from "../../components"

export default () => {
  return (
    <Flex align="center" h="100%">
      <AnimationContainer>
        <Stack direction={["column", "column", "column", "row"]} spacing="27px" align="stretch" my={10}>
          <Etablissement
            bg="bluefrance.100"
            title="Vous êtes une entreprise"
            subtitle="Simplifiez la diffusion de vos offres en alternance"
            description="Exprimez vos besoins de recrutement en alternance pour les afficher au plus près des jeunes : La Bonne Alternance, Parcoursup, 1 jeune 1 solution, Affelnet"
            buttonLabel="Diffuser une offre"
            link="/creation/entreprise"
            buttonLabel2="Déléguer la gestion"
            link2="/accompagner-entreprise-recherche-alternant"
            type={AUTHTYPE.ENTREPRISE}
          />
          <Etablissement
            bg="bluefrance.200"
            title="Vous êtes un organisme de formation"
            subtitle="Déposez les offres de vos entreprises partenaires"
            description="Gérez facilement vos mandats de recrutement et la diffusion de vos offres en alternance"
            buttonLabel="Créer votre espace dédié"
            buttonLabel2="Développer mon réseau"
            link="/creation/cfa"
            link2="/deleguer-gestion-offre-alternant-of"
            type={AUTHTYPE.CFA}
          />
        </Stack>
      </AnimationContainer>
    </Flex>
  )
}
