import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Flex, Image, ListItem, /*Link,*/ Text, UnorderedList } from "@chakra-ui/react"
import { SyntheticEvent, useContext, useEffect } from "react"
import { ILbaItemLbaCompanyJson, ILbaItemNaf } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { scrollToNestedElement } from "@/utils/tools"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { getCompanyGoogleSearchLink } from "../ItemDetailServices/getCompanyGoogleSearchLink"
import { getCompanySize } from "../ItemDetailServices/getCompanySize"
import ItemGoogleSearchLink from "../ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "../ItemDetailServices/ItemLocalisation"
import { ReportJobLink } from "../ReportJobLink"

const RecruteurLbaDetail = ({ recruteurLba }: { recruteurLba: ILbaItemLbaCompanyJson }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", {
      partner_label: recruteurLba.ideaType,
      info_fiche: `${recruteurLba?.company?.siret}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [recruteurLba?.company?.siret])

  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0]?.scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  const { formValues } = useContext(DisplayContext)

  const onClick = (e: SyntheticEvent) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target as HTMLElement, yOffsett: 220 })
    }, 200)
  }

  return (
    <>
      <Box mt={6} mb={4} position="relative" background="white" pt={4} pb={6} px={6} maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
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

      <Box mt={6} mb={4} position="relative" background="white" pt={4} pb={6} px={6} maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text mb={6} color="bluefrance.500" fontSize="22px" fontWeight={700} as="h2">
          Comment candidater ?
        </Text>
        <Accordion allowMultiple={false} allowToggle defaultIndex={0}>
          <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    1. Renseignez-vous sur l’entreprise
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel pb={4}>
                  <Box background="#f6f6f6" mb={4} p={4}>
                    <ItemLocalisation item={recruteurLba} />
                    <Text mt={1}>
                      <Text as="span" fontWeight={700}>
                        Taille de l'entreprise :{" "}
                      </Text>
                      <Text as="span">{getCompanySize(recruteurLba)}</Text>
                    </Text>
                    <Text mt={1}>
                      <Text as="span" fontWeight={700}>
                        Secteur d'activité :{" "}
                      </Text>
                      <Text as="span">{(recruteurLba?.nafs as ILbaItemNaf[])?.[0].label}</Text>
                    </Text>
                    {recruteurLba?.contact?.phone && (
                      <Text mt={1}>
                        <Text as="span" fontWeight={700}>
                          Téléphone :{" "}
                        </Text>
                        <Text as="span">
                          <DsfrLink href={`tel:${recruteurLba.contact.phone}`} aria-label="Appeler la société au téléphone">
                            {recruteurLba.contact.phone}
                          </DsfrLink>
                        </Text>
                      </Text>
                    )}
                    <ItemGoogleSearchLink item={recruteurLba} />
                  </Box>

                  <Text>
                    Avant de candidater, il est indispensable de prendre le temps de vous renseigner sur les activités de l’entreprise.{" "}
                    <DsfrLink href={getCompanyGoogleSearchLink(recruteurLba)} aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre">
                      Démarrez une recherche
                    </DsfrLink>{" "}
                    et visitez son site internet. Posez-vous les questions suivantes :
                  </Text>
                  <UnorderedList pl={3} mt={3}>
                    <ListItem>Est-ce que les activités de l’entreprise correspondent au métier que je souhaite exercer, en lien avec ma formation ?</ListItem>
                    <ListItem>Pourquoi cette entreprise plutôt que ses concurrents ?</ListItem>
                    <ListItem>Quelles compétences souhaiteriez-vous développer en intégrant cette entreprise ?</ListItem>
                    <ListItem>Parmi mes qualités, lesquelles pourraient être utiles à cette entreprise ?</ListItem>
                  </UnorderedList>
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
          <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    2. Préparez votre candidature spontanée
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel pb={4}>
                  <Text>
                    Après une recherche approfondie sur l'entreprise, personnalisez votre lettre de motivation en précisant tout d'abord pourquoi elle vous intéresse
                    particulièrement : son domaine d'activité, ses valeurs, etc.
                    <br />
                    Mettez ensuite en avant vos qualités en lien avec le métier recherché. Puis terminez en exposant ce que vous pensez apporter à l'entreprise lors de votre
                    alternance. Adaptez également votre CV.
                    <br />
                    <br />
                    Pour cela, le service{" "}
                    <DsfrLink href="https://diagoriente.beta.gouv.fr/" aria-label="Accéder au site de Diagoriente">
                      Diagoriente
                    </DsfrLink>{" "}
                    vous aide à valoriser vos compétences sur votre CV sur la base de vos expériences et vos centres d’intérêt.
                    <br />
                    <br />
                    Pour rendre votre CV plus beau et professionnel, vous pouvez utiliser ces outils gratuits :
                  </Text>
                  <UnorderedList pl={3} mt={3}>
                    <ListItem mb={3}>
                      <DsfrLink href="https://cv.clicnjob.fr/" aria-label="Accéder au site cv.clicnjob.fr">
                        https://cv.clicnjob.fr/
                      </DsfrLink>
                    </ListItem>
                    <ListItem mb={3}>
                      <DsfrLink href="https://cvdesignr.com/fr" aria-label="Accéder au site cvdesignr.com">
                        https://cvdesignr.com/fr
                      </DsfrLink>
                    </ListItem>
                    <ListItem mb={3}>
                      <DsfrLink href="https://www.canva.com/fr_fr/creer/cv/" aria-label="Accéder au site www.canva.com pour créer un cv">
                        https://www.canva.com/fr_fr/creer/cv/
                      </DsfrLink>
                    </ListItem>
                  </UnorderedList>
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
          <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    3. Anticiper la suite
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel pb={4}>
                  <Text>
                    Une fois votre candidature envoyée, notez-vous un rappel pour pouvoir relancer l’entreprise dans 10 jours si vous n’avez pas de réponse d’ici là.
                    <br />
                    <br />
                    <strong>Vous ne recevez pas de réponse ?</strong>
                    <br />
                    Voici un exemple de relance par téléphone :
                    <br />
                    <Text as="span" py={4} fontStyle="italic" color="grey.425">
                      “Bonjour,
                      <br />
                      Je suis [Prénom Nom]. Je vous appelle car je vous ai envoyé ma candidature par mail le [jour/mois] pour un poste d'apprenti [intitulé du poste visé]. N'ayant
                      pas reçu de réponse, je me permets de vous relancer car je suis vraiment très intéressé·e par votre entreprise. Je serai heureux·se de vous expliquer plus en
                      détail ma motivation lors d'un rendez-vous. Pourriez-vous me dire à qui je dois m’adresser pour savoir où en est ma candidature et quand puis-je espérer
                      recevoir une réponse ?”
                    </Text>
                    <br />
                    <br />
                    <strong>Vous avez une proposition d’entretien ?</strong>
                    <br />
                    Préparez-vous avec ce quizz interactif :
                  </Text>
                  <UnorderedList pl={3} mt={3}>
                    <ListItem mb={3}>
                      <DsfrLink
                        href="https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
                        aria-label="Accéder aux site de conseils didask pour préparer un entretient avec un employeur"
                      >
                        Préparer un entretien avec un employeur
                      </DsfrLink>
                    </ListItem>
                  </UnorderedList>
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        </Accordion>
        <Box marginTop="10px">
          <ReportJobLink
            itemId={recruteurLba?.company?.siret}
            type={LBA_ITEM_TYPE.RECRUTEURS_LBA}
            linkLabelNotReported="Signaler l’entreprise"
            linkLabelReported="Entreprise signalée"
            tooltip={
              <Box>
                <Text fontSize="16px" lineHeight="24px" fontWeight="700" marginBottom="8px" color="#161616">
                  Cette entreprise vous semble peu recommandable ? Voici les raisons pour lesquelles vous pouvez nous signaler une entreprise :
                </Text>
                <UnorderedList style={{ color: "#383838", fontSize: "16px", lineHeight: "24px" }}>
                  <ListItem>Informations trompeuses ou fausses</ListItem>
                  <ListItem>Non-respect des lois du travail </ListItem>
                  <ListItem>Fraude ou arnaque</ListItem>
                  <ListItem>Comportement inapproprié ou abusif </ListItem>
                </UnorderedList>
              </Box>
            }
          />
        </Box>
      </Box>
    </>
  )
}
export default RecruteurLbaDetail
