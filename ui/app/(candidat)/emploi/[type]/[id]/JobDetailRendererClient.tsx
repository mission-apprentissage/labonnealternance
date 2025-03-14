"use client"
import { Box, Flex, Text } from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { RecruteurLbaDetail } from "@/components"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import { CandidatureLba, NoCandidatureLba } from "@/components/ItemDetail/CandidatureLba/CandidatureLba"
import isCandidatureLba from "@/components/ItemDetail/CandidatureLba/services/isCandidatureLba"
import DidYouKnow from "@/components/ItemDetail/DidYouKnow"
import GoingToContactQuestion, { getGoingtoId } from "@/components/ItemDetail/GoingToContactQuestion"
import { buttonJePostuleShouldBeDisplayed } from "@/components/ItemDetail/ItemDetailServices/getButtons"
import getJobPublishedTimeAndApplications from "@/components/ItemDetail/ItemDetailServices/getJobPublishedTimeAndApplications"
import getTags from "@/components/ItemDetail/ItemDetailServices/getTags"
import ItemDetailCard from "@/components/ItemDetail/ItemDetailServices/ItemDetailCard"
import JobItemCardHeader from "@/components/ItemDetail/ItemDetailServices/JobItemCardHeader"
import { LbaJobDetail } from "@/components/ItemDetail/LbaJobComponents/LbaJobDetail"
import { PartnerJobDetail } from "@/components/ItemDetail/PartnerJobComponents/PartnerJobDetail"
import { PartnerJobPostuler } from "@/components/ItemDetail/PartnerJobComponents/PartnerJobPostuler"
import ShareLink from "@/components/ItemDetail/ShareLink"
import { DisplayContext } from "@/context/DisplayContextProvider"
// import { SearchResultContext } from "@/context/SearchResultContextProvider"
import { isCfaEntreprise } from "@/services/cfaEntreprise"
import { filterLayers } from "@/utils/mapTools"

export default function JobOfferRendererClient({ selectedItem }: { selectedItem: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob }) {
  // const { jobs, extendedSearch, trainings } = useContext(SearchResultContext)
  const { activeFilters } = useContext(DisplayContext)

  const kind = selectedItem.ideaType

  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire

  useEffect(() => {
    try {
      filterLayers(activeFilters)
    } catch (err) {
      //notice: gère des erreurs qui se présentent à l'initialisation de la page quand mapbox n'est pas prêt.
    }
  }, [selectedItem, activeFilters])

  const actualTitle = selectedItem.title

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
        backgroundColor: "#f8f8f8",
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
          {!isCollapsedHeader && <hr />}

          <Flex flexDirection={{ base: "column", sm: "row" }} justifyContent="space-between">
            <Box>
              {isCandidatureLba(selectedItem) && <CandidatureLba item={selectedItem as ILbaItemLbaJob | ILbaItemLbaCompany} />}
              {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && !isCandidatureLba(selectedItem) && <NoCandidatureLba />}
              {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobPostuler isCollapsedHeader={isCollapsedHeader} job={selectedItem} />}
            </Box>
            <Box pt={{ base: 0, sm: 4 }}>
              <ShareLink item={selectedItem} />
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <FTJobDetail job={selectedItem} />} */}
      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && <LbaJobDetail title={actualTitle} job={selectedItem as ILbaItemLbaJob} />}
      {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaDetail recruteurLba={selectedItem as ILbaItemLbaCompany} />}
      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJob} />}

      <AideApprentissage />

      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && (
        <>
          <DidYouKnow />
          {!buttonJePostuleShouldBeDisplayed(selectedItem) && (
            <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
          )}
        </>
      )}

      {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && !isCandidatureLba(selectedItem) && (
        <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
      )}
    </Box>
  )
}
