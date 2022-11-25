import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text, useToast } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getFormulaire } from "../../../api"
import { dayjs } from "../../../common/dayjs"
import { LoadingEmptySpace } from "../../../components"
import style from "../../../components/Voeux.module.css"
import { Copy, InfoCircle, Minus, Plus } from "../../../theme/components/icons"

export const PropositionOffreId = () => {
  const { idFormulaire, idOffre } = useParams()
  const toast = useToast()

  const [offre, setOffre] = useState()
  const [formulaire, setFormulaire] = useState()

  /**
   * @description Copy in clipboard.
   * @return {Promise<void>}
   */
  const copyInClipboard = () => {
    navigator.clipboard.writeText(
      `https://doctrina${window.location.href.includes("recette") ? "-recette" : ""}/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${offre._id}`
    )
    toast({
      title: "Lien copié.",
      position: "bottom-right",
      status: "info",
      duration: 5000,
    })
  }

  /**
   * @description Gets offre.
   * @return {void}
   */
  useEffect(async () => {
    const { data } = await getFormulaire(idFormulaire)

    const offre = data.offres.find((offre) => offre._id === idOffre)

    setFormulaire(data)
    setOffre(offre)
  }, [])

  if (!offre) {
    return <LoadingEmptySpace />
  }

  return (
    <Container maxW="container.xl" mb={20}>
      <Box>
        <Heading fontSize="32px" mt={8} mb={6}>
          Détails de la demande
        </Heading>
        <hr />
      </Box>
      <Box mt={10} p={6} bg={"bluefrance.100"}>
        <Heading fontSize="20px">Souhaitez-vous proposer des candidats à cette entreprise ?</Heading>
        <Text fontSize="16px" mt={5}>
          Vous pouvez contacter directement l’entreprise pour évaluer son besoin, ou alors partager le lien vers l’offre à vos étudiants :
        </Text>
        <Button mt={5} type="submit" variant="primary" leftIcon={<Copy width={5} />} onClick={copyInClipboard}>
          Copier l'url
        </Button>
      </Box>
      <SimpleGrid columns={2} spacing={10} mt={10}>
        <Box>
          <Heading fontSize="24px" mb={10}>
            Offre d’alternance
          </Heading>
          <Stack direction="column" spacing={7}>
            <Flex align="center">
              <Text mr={3}>Métier :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1} maxW="80%">
                {offre.libelle}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Type de contrat :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {offre.type.join(",")}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Niveau de formation : </Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {offre.niveau}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Date de début :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {dayjs(offre.date_debut_apprentissage).format("DD/MM/YYYY")}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Durée du contrat :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {offre.duree_contrat > 1 ? `${offre.duree_contrat} ans` : `${offre.duree_contrat} an`}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Nombre de postes :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {offre.quantite}
              </Text>
            </Flex>
          </Stack>
        </Box>
        <Box border="solid 1px #000091" p={10}>
          <Heading fontSize="24px" mb={10}>
            Informations de contact
          </Heading>
          <Stack direction="column" spacing={7}>
            <Flex align="center">
              <Text mr={3}>Email :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.email}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Téléphone :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.telephone}
              </Text>
            </Flex>
            <hr />
            <Heading fontSize="24px" mb={10}>
              Informations légales
            </Heading>
            <Flex align="center">
              <Text mr={3}>SIRET :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.siret}
              </Text>
            </Flex>
            {formulaire.enseigne && (
              <Flex align="center">
                <Text mr={3}>Enseigne :</Text>
                <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                  {formulaire.enseigne}
                </Text>
              </Flex>
            )}
            <Flex align="center">
              <Text mr={3}>Raison sociale :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.raison_sociale}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Adresse :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.adresse}
              </Text>
            </Flex>
          </Stack>
        </Box>
      </SimpleGrid>
      <SimpleGrid columns={2} spacing={10} mt={10}>
        <Box>
          <Heading fontSize="24px" mb={10}>
            {offre.rome_detail.libelle}
          </Heading>
          <Flex alignItems="flex-start">
            <InfoCircle mr={2} mt={2} color="bluefrance.500" />
            <Text>Voici la description visible par les candidats lors de la mise en ligne de l’offre d’emploi en alternance.</Text>
          </Flex>
          <Accordion defaultIndex={[0]} mt={4}>
            <AccordionItem key={0}>
              {({ isExpanded }) => (
                <>
                  <h2>
                    <AccordionButton>
                      <Text fontWeight="700" flex="1" textAlign="left">
                        Description du métier
                      </Text>
                      {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} ml={6} mr={3}>
                    {offre.rome_detail.definition.split("\\n").map((line) => (
                      <Text>{line}</Text>
                    ))}
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
            <hr />
            <AccordionItem key={1}>
              {({ isExpanded }) => (
                <>
                  <h2>
                    <AccordionButton>
                      <Text fontWeight="700" flex="1" textAlign="left">
                        Quelles sont les compétences visées ?
                      </Text>
                      {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                    </AccordionButton>
                  </h2>
                  <AccordionPanel maxH="50%" pb={4} ml={6} mr={3}>
                    <ul className={style.voeux}>
                      {offre?.rome_detail?.competencesDeBase.map((competance, index) => (
                        <li key={index}>{competance.libelle}</li>
                      ))}
                    </ul>
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
          </Accordion>
        </Box>
      </SimpleGrid>
    </Container>
  )
}
