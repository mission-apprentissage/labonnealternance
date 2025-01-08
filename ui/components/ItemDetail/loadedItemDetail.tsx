import { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "@/../shared"
import { Box, Divider, Flex, Text } from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import DemandeDeContact from "@/components/RDV/DemandeDeContact"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { isCfaEntreprise } from "../../services/cfaEntreprise"
import { filterLayers } from "../../utils/mapTools"
import InfoBanner from "../InfoBanner/InfoBanner"

import AideApprentissage from "./AideApprentissage"
import CandidatureLba, { NoCandidatureLba } from "./CandidatureLba/CandidatureLba"
import isCandidatureLba from "./CandidatureLba/services/isCandidatureLba"
import DidYouKnow from "./DidYouKnow"
import FTJobDetail from "./FTJobDetail"
import GoingToContactQuestion, { getGoingtoId } from "./GoingToContactQuestion"
import getActualTitle from "./ItemDetailServices/getActualTitle"
import { BuildSwipe, buttonJePostuleShouldBeDisplayed, buttonRdvShouldBeDisplayed, getNavigationButtons } from "./ItemDetailServices/getButtons"
import GetFranceTravailButton from "./ItemDetailServices/getFranceTravailButton"
import getJobPublishedTimeAndApplications from "./ItemDetailServices/getJobPublishedTimeAndApplications"
import getTags from "./ItemDetailServices/getTags"
import ItemDetailApplicationsStatus, { hasApplied } from "./ItemDetailServices/ItemDetailApplicationStatus"
import ItemDetailCard from "./ItemDetailServices/ItemDetailCard"
import JobItemCardHeader from "./ItemDetailServices/JobItemCardHeader"
import { LbaJobDetail } from "./LbaJobComponents/LbaJobDetail"
import { PartnerJobDetail } from "./PartnerJobComponents/PartnerJobDetail"
import { PartnerJobPostuler } from "./PartnerJobComponents/PartnerJobPostuler"
import RecruteurLbaDetail from "./RecruteurLbaComponents/RecruteurLbaDetail"
import ShareLink from "./ShareLink"
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

  const actualTitle = getActualTitle({ kind, selectedItem }) || ""

  const { swipeHandlers, goNext, goPrev } = BuildSwipe({ jobs, trainings, extendedSearch, activeFilters, handleSelectItem, selectedItem })

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
            {actualTitle}
          </Text>

          {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}

          <Divider my={2} />

          <Flex flexDirection={{ base: "column", sm: "row" }}>
            <Box flex={1}>
              {isCandidatureLba(selectedItem) && <CandidatureLba item={selectedItem} />}

              {kind === LBA_ITEM_TYPE_OLD.LBA && !isCandidatureLba(selectedItem) && <NoCandidatureLba />}

              {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.FORMATION && buttonRdvShouldBeDisplayed(selectedItem) && !hasApplied(selectedItem) && (
                <DemandeDeContact context={selectedItem.rdvContext} referrer="LBA" showInModal />
              )}
              {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.FORMATION && <ItemDetailApplicationsStatus item={selectedItem} mt={2} mb={2} />}

              {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.PARTNER_JOB && <PartnerJobPostuler job={selectedItem} />}

              {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.PEJOB && GetFranceTravailButton(selectedItem)}
            </Box>
            <Box pt={{ base: 0, sm: 4 }}>
              <ShareLink item={selectedItem} />
            </Box>
          </Flex>
        </Box>
      </Box>

      {kind === LBA_ITEM_TYPE_OLD.PEJOB && <FTJobDetail job={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.MATCHA && <LbaJobDetail title={actualTitle} job={selectedItem as ILbaItemLbaJob} />}
      {kind === LBA_ITEM_TYPE_OLD.LBA && <RecruteurLbaDetail recruteurLba={selectedItem as ILbaItemLbaCompany} />}
      {kind === LBA_ITEM_TYPE_OLD.FORMATION && <TrainingDetail training={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.PARTNER_JOB && <PartnerJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJob} />}

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
