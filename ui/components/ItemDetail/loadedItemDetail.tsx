import { Box, Divider, Flex, Text } from "@chakra-ui/react"
import { useContext, useState } from "react"
import { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import DemandeDeContact from "@/components/RDV/DemandeDeContact"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { isCfaEntreprise } from "../../services/cfaEntreprise"
import InfoBanner from "../InfoBanner/InfoBanner"

import AideApprentissage from "./AideApprentissage"
import { NoCandidatureLba, CandidatureLba } from "./CandidatureLba/CandidatureLba"
import isCandidatureLba from "./CandidatureLba/services/isCandidatureLba"
import DidYouKnow from "./DidYouKnow"
import FTJobDetail from "./FTJobDetail"
import GoingToContactQuestion, { getGoingtoId } from "./GoingToContactQuestion"
import getActualTitle from "./ItemDetailServices/getActualTitle"
/* @ts-ignore TODO */
import { BuildSwipe, buttonJePostuleShouldBeDisplayed, buttonRdvShouldBeDisplayed, getNavigationButtons } from "./ItemDetailServices/getButtons"
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

  const kind: LBA_ITEM_TYPE_OLD | LBA_ITEM_TYPE = selectedItem?.ideaType

  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire

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
      id="itemDetailColumn"
      display={selectedItem ? "block" : "none"}
      sx={{
        overflowY: "auto",
        position: "relative",
        height: "100vh",
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
          <Flex justifyContent="flex-end">
            {getTags({ kind, isCfa, isMandataire })}
            {getNavigationButtons({ goPrev, goNext, handleClose })}
          </Flex>

          {kind === LBA_ITEM_TYPE_OLD.FORMATION && (
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
            color={kind !== LBA_ITEM_TYPE_OLD.FORMATION ? "pinksoft.600" : "greensoft.500"}
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
              {isCandidatureLba(selectedItem) && <CandidatureLba item={selectedItem as ILbaItemLbaJobJson | ILbaItemLbaCompanyJson} />}

              {kind === LBA_ITEM_TYPE_OLD.LBA && !isCandidatureLba(selectedItem) && <NoCandidatureLba />}

              {/* @ts-ignore TODO */}
              {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.FORMATION && buttonRdvShouldBeDisplayed(selectedItem) && !hasApplied(selectedItem) && (
                <DemandeDeContact isCollapsedHeader={isCollapsedHeader} context={selectedItem.rdvContext} referrer="LBA" showInModal />
              )}
              {/* @ts-ignore TODO */}
              {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.FORMATION && <ItemDetailApplicationsStatus item={selectedItem} mt={2} mb={2} />}

              {selectedItem.ideaType === LBA_ITEM_TYPE_OLD.PARTNER_JOB && <PartnerJobPostuler isCollapsedHeader={isCollapsedHeader} job={selectedItem} />}
            </Box>
            <Box pt={{ base: 0, sm: 4 }}>
              <ShareLink item={selectedItem} />
            </Box>
          </Flex>
        </Box>
      </Box>

      {kind === LBA_ITEM_TYPE_OLD.PEJOB && <FTJobDetail job={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.MATCHA && <LbaJobDetail title={actualTitle} job={selectedItem as ILbaItemLbaJobJson} />}
      {kind === LBA_ITEM_TYPE_OLD.LBA && <RecruteurLbaDetail recruteurLba={selectedItem as ILbaItemLbaCompanyJson} />}
      {kind === LBA_ITEM_TYPE_OLD.FORMATION && <TrainingDetail training={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.PARTNER_JOB && <PartnerJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJobJson} />}

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
