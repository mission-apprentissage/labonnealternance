"use client"
import { Box, Divider, Flex, Image, Text } from "@chakra-ui/react"
import { Fragment, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { ILbaItemFormation2 } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import GoingToContactQuestion, { getGoingtoId } from "@/components/ItemDetail/GoingToContactQuestion"
import { buttonRdvShouldBeDisplayed } from "@/components/ItemDetail/ItemDetailServices/getButtons"
import getJobPublishedTimeAndApplications from "@/components/ItemDetail/ItemDetailServices/getJobPublishedTimeAndApplications"
import getTags from "@/components/ItemDetail/ItemDetailServices/getTags"
import ItemDetailApplicationsStatus, { hasApplied } from "@/components/ItemDetail/ItemDetailServices/ItemDetailApplicationStatus"
import ItemDetailCard from "@/components/ItemDetail/ItemDetailServices/ItemDetailCard"
import ItemGoogleSearchLink from "@/components/ItemDetail/ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "@/components/ItemDetail/ItemDetailServices/ItemLocalisation"
import JobItemCardHeader from "@/components/ItemDetail/ItemDetailServices/JobItemCardHeader"
import ShareLink from "@/components/ItemDetail/ShareLink"
import StatsInserJeunes from "@/components/ItemDetail/StatsInserJeunes"
import DemandeDeContact from "@/components/RDV/DemandeDeContact"
import { isCfaEntreprise } from "@/services/cfaEntreprise"
import fetchInserJeuneStats from "@/services/fetchInserJeuneStats"
import { getPrdvContext } from "@/utils/api"
import { SendPlausibleEvent } from "@/utils/plausible"
import { formatDate } from "@/utils/strutils"

// Read https://css-tricks.com/snippets/css/prevent-long-urls-from-breaking-out-of-container/
const dontBreakOutCssParameters = {
  overflowWrap: "break-word",
  wordWrap: "break-word",
  wordBreak: "break-word",
  hyphens: "auto",
}

export default function TrainingDetailRendererClient({ selectedItem }: { selectedItem: ILbaItemFormation2 }) {
  console.log("TrainingDetailRendererClient", selectedItem)
  const kind: LBA_ITEM_TYPE = selectedItem?.type
  const actualTitle = selectedItem.training.title
  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire
  // const { jobs, extendedSearch, selectedItem, trainings } = useContext(SearchResultContext)
  // const { activeFilters } = useContext(DisplayContext)

  const priseDeRendezVous = useQuery(["getPrdv", selectedItem.training.cleMinistereEducatif], () => getPrdvContext(selectedItem.training.cleMinistereEducatif), {
    enabled: Boolean(selectedItem.training.cleMinistereEducatif),
  })

  console.log(" priseDeRendezVous", priseDeRendezVous.data)

  // useEffect(() => {
  //   try {
  //     filterLayers(activeFilters)
  //   } catch (err) {
  //     //notice: gère des erreurs qui se présentent à l'initialisation de la page quand mapbox n'est pas prêt.
  //   }
  //   /* eslint react-hooks/exhaustive-deps: 0 */
  //   /* @ts-expect-error: à cracker */
  // }, [selectedItem?.id, selectedItem?.company?.siret, selectedItem?.job?.id])

  // const { swipeHandlers, goNext, goPrev } = BuildSwipe({ jobs, trainings, extendedSearch, activeFilters, handleSelectItem, selectedItem })

  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const maxScroll = 100
  const handleScroll = () => {
    let currentScroll = document.querySelector("#itemDetailColumn").scrollTop
    currentScroll += isCollapsedHeader ? 100 : -100
    setIsCollapsedHeader(currentScroll > maxScroll)
  }

  const stickyHeaderProperties = isCollapsedHeader
    ? {
        position: "sticky",
        zIndex: "1",
        top: "0",
        left: "0",
        display: "flex",
        width: "100%",
      }
    : {}

  return (
    <Box
      as="section"
      onScroll={handleScroll}
      id="itemDetailColumn"
      display={selectedItem ? "block" : "none"}
      sx={{
        overflowY: "auto",
        position: "relative",
        height: "100vh",
      }}
      // {...swipeHandlers}
    >
      <InfoBanner />
      {/* @ts-expect-error: TODO */}
      <Box
        as="header"
        sx={{
          filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
          padding: "10px 20px 0px 10px",
        }}
        background="white"
        {...stickyHeaderProperties}
      >
        <Box width="100%" pl={["0", 4]} pb={isCollapsedHeader ? "0" : 2}>
          <Flex justifyContent="flex-end">
            {getTags({ kind, isCfa, isMandataire })}
            {/* {getNavigationButtons({ goPrev, goNext, handleClose })} */}
          </Flex>

          {kind === LBA_ITEM_TYPE.FORMATION && (
            <Text as="p" textAlign="left" color="grey.600" mt={isCollapsedHeader ? 1 : 4} mb={isCollapsedHeader ? 1 : 3} fontWeight={700} fontSize="1rem">
              <Text as="span">{`${selectedItem?.company?.name || ""} (${selectedItem.company.place.city})`}</Text>
              <Text as="span" fontWeight={400}>
                &nbsp;propose cette formation
              </Text>
            </Text>
          )}

          {!isCollapsedHeader && getJobPublishedTimeAndApplications({ item: selectedItem })}
          {!isCollapsedHeader && <JobItemCardHeader selectedItem={selectedItem} kind={kind} isMandataire={isMandataire} />}

          <Text
            as="h1"
            fontSize={isCollapsedHeader ? "20px" : "28px"}
            color={"pinksoft.600"}
            sx={{
              fontWeight: 700,
              marginBottom: isCollapsedHeader ? "4px" : "11px",
              paddingBottom: "0",
              textAlign: "left",
              wordBreak: "break-word",
            }}
          >
            {actualTitle}
          </Text>

          {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}

          {!isCollapsedHeader && <Divider my={2} />}

          <Flex flexDirection={{ base: "column", sm: "row" }}>
            <Box flex={1}>
              {kind === LBA_ITEM_TYPE.FORMATION && priseDeRendezVous.isFetched && !hasApplied(selectedItem) && (
                <DemandeDeContact isCollapsedHeader={isCollapsedHeader} context={priseDeRendezVous.data} referrer="LBA" showInModal />
              )}
              {kind === LBA_ITEM_TYPE.FORMATION && <ItemDetailApplicationsStatus item={selectedItem} mt={2} mb={2} />}
            </Box>
            <Box pt={{ base: 0, sm: 4 }}>
              <ShareLink item={selectedItem} />
            </Box>
          </Flex>
        </Box>
      </Box>

      {kind === LBA_ITEM_TYPE.FORMATION && <TrainingDetail training={selectedItem} />}

      <AideApprentissage />

      {kind === LBA_ITEM_TYPE.FORMATION && !buttonRdvShouldBeDisplayed(selectedItem) && (
        <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
      )}
    </Box>
  )
}

function TrainingDetail({ training }: { training: ILbaItemFormation2 }) {
  console.log("TrainingDetailRendererClient", training)
  // const [IJStats, setIJStats] = useState(null)
  const isCfaDEntreprise = isCfaEntreprise(training?.company?.siret, training?.company?.headquarter?.siret)
  // const { trainings, setTrainingsAndSelectedItem } = useContext(SearchResultContext)
  // const { formValues } = React.useContext(DisplayContext)

  // useQuery(["getPrdv", training.id], () => fetchPrdvContext(training.id), {
  //   enabled: training && !training.prdvLoaded,
  // })

  // const fetchPrdvContext = async (cleMinistereEducatif: string) => {
  //   const context = await getPrdvContext(cleMinistereEducatif)
  //   const updatedTrainings = trainings
  //   updatedTrainings.forEach(async (v) => {
  //     if (v.id === training.id) {
  //       if (!v.prdvLoaded) {
  //         v.prdvLoaded = true
  //         v.rdvContext = context && !("error" in context) ? context : null
  //         setTrainingsAndSelectedItem(updatedTrainings, v)
  //       }
  //     }
  //   })
  //   return
  // }

  const IJStats = useQuery(["getIJStats", training.training.cfd], () => fetchInserJeuneStats(training), {
    enabled: Boolean(training.training.cfd),
  })

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche formation", {
      // info_fiche: `${training.cleMinistereEducatif}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
  }, [training.training.cleMinistereEducatif])

  return (
    <>
      <Box
        pb="0px"
        mt={6}
        position="relative"
        background="white"
        padding={["1px 12px 36px 12px", "1px 24px 36px 24px", "1px 12px 24px 12px"]}
        maxWidth="970px"
        mx={["0", "30px", "30px", "auto"]}
      >
        <TrainingDescriptionDetails training={training.training} />
        <Box background="#f6f6f6" borderRadius="8px" mt={8} pl={8} py="10px" pr="10px">
          {training.training.onisepUrl && (
            <Box>
              <Text as="span">Descriptif du {training.training.title} sur&nbsp;</Text>
              <Text as="span">
                <DsfrLink href={training.training.onisepUrl} aria-label="Formation sur le site de l'onisep - nouvelle fenêtre">
                  le site Onisep&nbsp;
                </DsfrLink>
              </Text>
            </Box>
          )}
          <Box my={2}>
            Vous vous posez des questions sur votre orientation ou votre recherche d&apos;emploi ?&nbsp;
            <DsfrLink
              href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
              aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA - nouvelle fenêtre"
            >
              Préparez votre premier contact avec un CFA&nbsp;
            </DsfrLink>
          </Box>
        </Box>
      </Box>

      {IJStats.isFetched && <StatsInserJeunes stats={IJStats.data} />}

      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" my={2}>
          Quelques informations l'établissement
        </Text>

        <ItemLocalisation item={training} />

        {training?.contact?.phone && (
          <Text mt={1}>
            <Text as="span" fontWeight={700}>
              Téléphone :{" "}
            </Text>
            <Text as="span">
              <DsfrLink href={`tel:${training.contact.phone}`} aria-label="Appeler la société au téléphone">
                {training.contact.phone}
              </DsfrLink>
            </Text>
          </Text>
        )}

        <ItemGoogleSearchLink item={training} />

        {training.contact.url && (
          <Flex alignItems="center" mt={2} direction="row">
            <Box width="30px" minWidth="30px" mr={2}>
              <Image mt="2px" src="/images/icons/small_info.svg" alt="" />
            </Box>
            <Text as="span">
              En savoir plus sur
              <DsfrLink href={training.contact.url} aria-label="Site de l'entreprise - nouvelle fenêtre">
                {training.contact.url}
              </DsfrLink>
            </Text>
          </Flex>
        )}
      </Box>

      {isCfaDEntreprise && (
        <Box background="white" borderRadius="8px" mt={6} padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
          <Flex alignItems="center" pt={1} pb={2}>
            <Image src="/images/info.svg" alt="" width="24px" height="24px" />
            <Text as="span" ml={2} fontWeight={700}>
              Cet établissement est un CFA d&apos;entreprise
            </Text>
          </Flex>
          <Text>
            La particularité ? Il s&apos;agit d&apos;une formule complète <strong>Emploi + Formation</strong> ! Cette formation vous intéresse ? La marche à suivre diffère selon le
            CFA d&apos;entreprise concerné :
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
            <DsfrLink
              href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
              aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA - nouvelle fenêtre"
            >
              Préparez votre premier contact avec un CFA&nbsp;
            </DsfrLink>
          </Box>
        </Box>
      )}
    </>
  )
}

const TrainingDescriptionDetails = ({ training }) => {
  return (
    <>
      {training.description && training.description.length > 30 && (
        <Flex alignItems="flex-start" mt={5}>
          <Image src="/images/icons/traning-clipboard-list.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Description de la formation
            </Text>
            <Text as="span" sx={dontBreakOutCssParameters}>
              {training.description}
            </Text>
          </Box>
        </Flex>
      )}
      {training.objectif && training.objectif.length > 20 && (
        <Flex alignItems="flex-start" mt={5}>
          <Image mt={1} src="/images/icons/training-target.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Objectifs
            </Text>
            <Text as="span" sx={dontBreakOutCssParameters}>
              {training.objectif}
            </Text>
          </Box>
        </Flex>
      )}
      {training.sessions.length ? (
        <Flex alignItems="flex-start" mt={5}>
          <Image src="/images/icons/training-academic-cap.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Sessions de formation
            </Text>
            {training["sessions"][0].isPermanentEntry
              ? "Il est possible de s’inscrire à cette formation tout au long de l’année."
              : training["sessions"].map((session, i) => (
                  <Fragment key={i}>
                    du {formatDate(session.startDate)} au {formatDate(session.endDate)}
                    <br />
                  </Fragment>
                ))}
          </Box>
        </Flex>
      ) : null}
    </>
  )
}
