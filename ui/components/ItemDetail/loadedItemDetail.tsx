import { Box, Divider, Flex, Link, Text } from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import DemandeDeContact from "@/components/RDV/DemandeDeContact"
import { focusWithin } from "@/theme/theme-lba-tools"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { isCfaEntreprise } from "../../services/cfaEntreprise"
import { filterLayers } from "../../utils/mapTools"
import { SendPlausibleEvent } from "../../utils/plausible"
import InfoBanner from "../InfoBanner/InfoBanner"

import AideApprentissage from "./AideApprentissage"
import CandidatureLba, { NoCandidatureLba } from "./CandidatureLba/CandidatureLba"
import isCandidatureLba from "./CandidatureLba/services/isCandidatureLba"
import DidYouKnow from "./DidYouKnow"
import FTJobDetail from "./FTJobDetail"
import GoingToContactQuestion, { getGoingtoId } from "./GoingToContactQuestion"
import getActualTitle from "./ItemDetailServices/getActualTitle"
import { BuildSwipe, buttonJePostuleShouldBeDisplayed, buttonRdvShouldBeDisplayed, getNavigationButtons } from "./ItemDetailServices/getButtons"
import getJobPublishedTimeAndApplications from "./ItemDetailServices/getJobPublishedTimeAndApplications"
import getTags from "./ItemDetailServices/getTags"
import hasAlsoEmploi from "./ItemDetailServices/hasAlsoEmploi"
import ItemDetailCard from "./ItemDetailServices/ItemDetailCard"
import JobItemCardHeader from "./ItemDetailServices/JobItemCardHeader"
import LbaJobDetail from "./LbaJobComponents/LbaJobDetail"
import LbaRecruteurDetail from "./LbaRecruteurComponents/LbaRecruteurDetail"
import LocationDetail from "./LocationDetail"
import TrainingDetail from "./TrainingDetail"

const LoadedItemDetail = ({ handleClose, handleSelectItem }) => {
  const { jobs, extendedSearch, selectedItem, trainings } = useContext(SearchResultContext)
  const { activeFilters } = useContext(DisplayContext)

  const kind: LBA_ITEM_TYPE_OLD = selectedItem?.ideaType

  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire

  useEffect(() => {
    try {
      filterLayers(activeFilters)
    } catch (err) {
      //notice: gère des erreurs qui se présentent à l'initialisation de la page quand mapbox n'est pas prêt.
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
    /* @ts-expect-error: à cracker */
  }, [selectedItem?.id, selectedItem?.company?.siret, selectedItem?.job?.id])

  const actualTitle = getActualTitle({ kind, selectedItem })

  const hasAlsoJob = hasAlsoEmploi({ isCfa, company: selectedItem?.company, searchedMatchaJobs: jobs?.matchas })

  const { swipeHandlers, goNext, goPrev } = BuildSwipe({ jobs, trainings, extendedSearch, activeFilters, handleSelectItem, selectedItem })

  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const maxScroll = 100
  const handleScroll = () => {
    let currentScroll = document.querySelector("#itemDetailColumn").scrollTop
    currentScroll += isCollapsedHeader ? 100 : -100
    setIsCollapsedHeader(currentScroll > maxScroll)
  }

  const postuleSurFranceTravail = () => {
    if (selectedItem.ideaType === LBA_ITEM_TYPE_OLD.PEJOB) {
      SendPlausibleEvent("Clic Postuler - Fiche entreprise Offre FT", {
        info_fiche: selectedItem.job.id,
      })
    }
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
      display={selectedItem ? "block" : "none"}
      height="100%"
      id="itemDetailColumn"
      sx={{
        overflowY: "auto",
        position: "relative",
      }}
      {...swipeHandlers}
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
          <Flex mb={2} justifyContent="flex-end">
            {getTags({ kind, isCfa, isMandataire })}
            {getNavigationButtons({ goPrev, goNext, handleClose })}
          </Flex>

          {kind === LBA_ITEM_TYPE_OLD.FORMATION && (
            <Text as="p" textAlign="left" color="grey.600" mt={4} mb={3} fontWeight={700} fontSize="1rem">
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
            color={kind !== LBA_ITEM_TYPE_OLD.FORMATION ? "pinksoft.600" : "greensoft.500"}
            sx={{
              fontWeight: 700,
              marginBottom: "11px",
              paddingBottom: "0",
              textAlign: "left",
              wordBreak: "break-word",
            }}
          >
            {actualTitle || ""}
          </Text>

          {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}

          {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.PEJOB && buttonJePostuleShouldBeDisplayed(selectedItem) && (
            <Box my={4}>
              <Link
                data-tracking-id="postuler-offre-partenaire"
                {...focusWithin}
                variant="postuler"
                href={selectedItem.url}
                target="francetravail"
                onClick={postuleSurFranceTravail}
              >
                Je postule sur France Travail
              </Link>
            </Box>
          )}

          {isCandidatureLba(selectedItem) && (
            <>
              <Divider my={2} />
              <CandidatureLba item={selectedItem} />
            </>
          )}

          {kind === LBA_ITEM_TYPE_OLD.LBA && !isCandidatureLba(selectedItem) && <NoCandidatureLba />}

          {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.FORMATION && buttonRdvShouldBeDisplayed(selectedItem) && (
            <>
              <Divider my={2} />
              <DemandeDeContact context={selectedItem.rdvContext} referrer="LBA" showInModal />
            </>
          )}
        </Box>
      </Box>

      {kind === LBA_ITEM_TYPE_OLD.PEJOB && <FTJobDetail job={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.MATCHA && <LbaJobDetail job={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.LBA && <LbaRecruteurDetail lbaRecruteur={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.FORMATION && <TrainingDetail training={selectedItem} hasAlsoJob={hasAlsoJob} />}

      {kind !== LBA_ITEM_TYPE_OLD.LBA && <LocationDetail item={selectedItem} isCfa={isCfa} />}

      <AideApprentissage />

      {kind === LBA_ITEM_TYPE_OLD.PEJOB && (
        <>
          <DidYouKnow />
          {!buttonJePostuleShouldBeDisplayed(selectedItem) && (
            <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
          )}
        </>
      )}
      {kind === LBA_ITEM_TYPE_OLD.FORMATION && !buttonRdvShouldBeDisplayed(selectedItem) && (
        <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
      )}
      {kind === LBA_ITEM_TYPE_OLD.LBA && !isCandidatureLba(selectedItem) && (
        <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
      )}
    </Box>
  )
}

export default LoadedItemDetail
