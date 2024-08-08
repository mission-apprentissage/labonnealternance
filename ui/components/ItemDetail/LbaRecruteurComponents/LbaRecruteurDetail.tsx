import { ILbaItemLbaCompany } from "@/../shared"
import { AddIcon, ExternalLinkIcon, /*ExternalLinkIcon,*/ MinusIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Flex, Image, Link, ListItem, /*Link,*/ Text, UnorderedList } from "@chakra-ui/react"
import React, { useEffect } from "react"

import { getPathLink, scrollToNestedElement } from "@/utils/tools"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { getCompanyGoogleSearchLink } from "../ItemDetailServices/getCompanyGoogleSearchLink"
import { getCompanySize } from "../ItemDetailServices/getCompanySize"

const LbaRecruteurDetail = ({ lbaRecruteur }: { lbaRecruteur: ILbaItemLbaCompany }) => {
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

  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
    }, 200)
  }

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

      <Box mt={6} mb={4} position="relative" background="white" pt={4} pb={6} px={6} mx={["0", "30px"]}>
        <Text mb={6} color="bluefrance.500" fontSize="22px" fontWeight={700} as="h2">
          Comment candidater ?
        </Text>
        <Accordion allowMultiple={false} allowToggle defaultIndex={0}>
          <AccordionItem onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton borderBottom={isExpanded ? "none" : "1px solid #E5E5E5"} fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    1. Renseignez-vous sur l’entreprise
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel borderBottom="1px solid #E5E5E5" pb={4}>
                  <Box background="#f6f6f6" mb={4} p={4}>
                    <Text>
                      <Text as="span" fontWeight={700}>
                        Localisation :{" "}
                      </Text>
                      <Text as="span">{lbaRecruteur?.place?.fullAddress}</Text>
                      <Link ml={4} isExternal variant="basicUnderlined" href={getPathLink(lbaRecruteur)} aria-label="Localisation sur google maps - nouvelle fenêtre">
                        Obtenir l'itinéraire <ExternalLinkIcon mb="3px" ml="2px" />
                      </Link>
                      {(lbaRecruteur?.place?.distance ?? -1) >= 0 && (
                        <Text mt={2} color="grey.425" fontSize={14}>
                          {lbaRecruteur?.place?.distance} km(s) du lieu de recherche
                        </Text>
                      )}
                    </Text>
                    <Text mt={4}>
                      <Text as="span" fontWeight={700}>
                        Taille de l'entreprise :{" "}
                      </Text>
                      <Text as="span">{getCompanySize(lbaRecruteur)}</Text>
                    </Text>
                    <Text>
                      <Text as="span" fontWeight={700}>
                        Secteur d'activité :{" "}
                      </Text>
                      <Text as="span">{lbaRecruteur.nafs[0].label}</Text>
                    </Text>
                    {lbaRecruteur?.contact?.phone && (
                      <Text>
                        <Text as="span" fontWeight={700}>
                          Téléphone :{" "}
                        </Text>
                        <Text as="span">
                          <Link ml="2px" isExternal variant="basicUnderlined" href={`tel:${lbaRecruteur.contact.phone}`} aria-label="Appeler la société au téléphone">
                            {lbaRecruteur.contact.phone} <ExternalLinkIcon mb="3px" ml="2px" />
                          </Link>
                        </Text>
                      </Text>
                    )}

                    <Text mt={4}>
                      <Text as="span">
                        Lancer une recherche Google sur
                        <Link
                          ml="2px"
                          isExternal
                          variant="basicUnderlined"
                          href={getCompanyGoogleSearchLink(lbaRecruteur)}
                          aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre"
                        >
                          {lbaRecruteur.company.name} <ExternalLinkIcon mb="3px" ml="2px" />
                        </Link>
                      </Text>
                    </Text>
                  </Box>

                  <Text>
                    Avant de candidater, il est indispensable de prendre le temps de vous renseigner sur les activités de l’entreprise.{" "}
                    <Link
                      ml="2px"
                      isExternal
                      variant="basicUnderlined"
                      href={getCompanyGoogleSearchLink(lbaRecruteur)}
                      aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre"
                    >
                      Démarrez une recherche <ExternalLinkIcon mb="3px" ml="2px" />
                    </Link>{" "}
                    et visitez son site internet. Posez-vous les questions suivantes :
                  </Text>
                  <UnorderedList pl={3} mt={3}>
                    <ListItem>Est-ce que les activités de l’entreprise correspondent au métier que je souhaite exercer, en lien avec ma formation ?</ListItem>
                    <ListItem>Pourquoi cette entreprise plutôt que ses concurrents ?</ListItem>
                    <ListItem>Quelles compétences souhaiteriez-vous développer en intégrant cette entreprise ?</ListItem>
                    <ListItem>Parmi mes qualités, lesquelles pourraient être utiles à cette entreprise ?</ListItem>
                  </UnorderedList>
                  {/* <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" mx={["0", "30px"]}>
        <Text as="h2" variant="itemDetailH2" mt={2}>
          {getTitle(item)}
        </Text>

        {item?.company?.mandataire && (
          <Box color="grey.700" mt={6}>
            Le centre de formation peut vous renseigner sur cette offre d’emploi ainsi que les formations qu’il propose.
          </Box>
        )}

        <Box color="grey.700" mt={6}>
          {item?.place?.fullAddress}
        </Box>

        {item?.place?.distance !== null && !item?.company?.mandataire && <Box color="grey.600" fontSize="14px">{`${item?.place?.distance} km(s) du lieu de recherche`}</Box>}

        <Flex mt={4} alignItems="center" direction="row">
          <Box width="30px" minWidth="30px" pl="1px" mr={2}>
            <Image mt="2px" src="/images/icons/small_map_point.svg" alt="" />
          </Box>
          <Link isExternal variant="basicUnderlined" href={getPathLink(item)} aria-label="Localisation sur google maps - nouvelle fenêtre">
            Obtenir l'itinéraire <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </Flex>

        {item?.company?.url && (
          <Flex alignItems="center" mt={2} direction="row">
            <Box width="30px" minWidth="30px" mr={2}>
              <Image mt="2px" src="/images/icons/small_info.svg" alt="" />
            </Box>
            <Text as="span">
              En savoir plus sur
              <Link ml="2px" isExternal variant="basicUnderlined" href={item?.company?.url} aria-label="Site de l'entreprise - nouvelle fenêtre">
                {item?.company?.url} <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Text>
          </Flex>
        )}

        {item?.contact?.phone && (
          <Flex mt={2} mb={4}>
            <Box fontWeight={700} pl="2px" mr={2}>
              Téléphone :
            </Box>
            <Link ml="2px" isExternal variant="basicUnderlined" href={`tel:${item.contact.phone}`} aria-label="Contacter par téléphone - nouvelle fenêtre">
              {item.contact.phone} <ExternalLinkIcon mx="2px" />
            </Link>
          </Flex>
        )}

        {isCfa && (
          <Box background="#f6f6f6" borderRadius="8px" mt={6} p={4}>
            <Flex alignItems="center" pt={1} pb={2}>
              <Image src="/images/info.svg" alt="" width="24px" height="24px" />
              <Text as="span" ml={2} fontWeight={700}>
                Cet établissement est un CFA d&apos;entreprise
              </Text>
            </Flex>
            <Text>
              La particularité ? Il s&apos;agit d&apos;une formule complète <strong>Emploi + Formation</strong> ! Cette formation vous intéresse ? La marche à suivre diffère selon
              le CFA d&apos;entreprise concerné :
            </Text>

            <Box mt={3}>
              &bull;{" "}
              <Text as="span" ml={4}>
                Commencez par vous inscrire à la formation pour accéder ensuite au contrat,
              </Text>
            </Box>
            <Box mt={2}>
              &bull;{" "}
              <Text as="span" ml={4}>
                Ou commencez par postuler à une offre d&apos;emploi pour être ensuite inscrit en formation.
              </Text>
            </Box>

            <Text>Prenez contact avec cet établissement ou consultez son site web pour en savoir + !</Text>

            <Box my={2}>
              Vous vous posez des questions sur votre orientation ou votre recherche d&apos;emploi ?&nbsp;
              <Link
                isExternal
                variant="basicUnderlined"
                href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
                aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA - nouvelle fenêtre"
              >
                Préparez votre premier contact avec un CFA&nbsp;
                <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Box>
          </Box>
        )}

        {[LBA_ITEM_TYPE_OLD.MATCHA, LBA_ITEM_TYPE_OLD.LBA].includes(kind) && (
          <>
            <Text fontStyle="italic" color="grey.425">
              Renseignez-vous sur l’entreprise, ses activités et ses valeurs pour préparer votre candidature. Vous pouvez rechercher leur site internet et leur présence sur les
              réseaux sociaux.
            </Text>
            <Flex mt={2} mb={4}>
              <Box width="30px" pl="2px" minWidth="30px" mr={2}>
                <Image mt="2px" src="/images/info.svg" alt="A noter" />
              </Box>
              <Text as="span">
                En savoir plus sur
                <Link
                  ml="2px"
                  isExternal
                  variant="basicUnderlined"
                  href={`https://www.google.fr/search?q=${getGoogleSearchParameters()}`}
                  aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre"
                >
                  {item.company.name} <ExternalLinkIcon mb="3px" ml="2px" />
              Box/Flex>
            <Box pl={10}>
              <Text fontSize="14px" fontStyle="italic" color="grey.500">
                Renseignez-vous sur l&apos;établissement pour préparer votre candidature
              </Text>
            </Box>
            {!item?.company?.mandataire && (
              <Box mt={4} mb={1}>
                <strong>Taille de l&apos;entreprise :&nbsp;</strong> {companySize}
              </Box>
            )}
          </>
        )}
      </Box> */}
                </AccordionPanel>
              </>
            )}
          </AccordionItem>

          <AccordionItem onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton borderBottom={isExpanded ? "none" : "1px solid #E5E5E5"} fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    2. Préparez votre candidature spontanée
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel borderBottom="1px solid #E5E5E5" pb={4}>
                  TEXTE
                </AccordionPanel>
              </>
            )}
          </AccordionItem>

          <AccordionItem onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton borderBottom={isExpanded ? "none" : "1px solid #E5E5E5"} fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    3. Anticiper la suite
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel borderBottom="1px solid #E5E5E5" pb={4}>
                  TEXTE
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        </Accordion>
      </Box>
    </>
  )
}

export default LbaRecruteurDetail
