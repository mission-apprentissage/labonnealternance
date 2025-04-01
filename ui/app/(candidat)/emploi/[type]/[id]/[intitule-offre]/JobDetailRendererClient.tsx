"use client"
import { Box, Flex, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ILbaItemJobsGlobal, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { IUseRechercheResultsSuccess, useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { useBuildNavigation } from "@/app/hooks/useBuildNavigation"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import { CandidatureLba, NoCandidatureLba } from "@/components/ItemDetail/CandidatureLba/CandidatureLba"
import isCandidatureLba from "@/components/ItemDetail/CandidatureLba/services/isCandidatureLba"
import DidYouKnow from "@/components/ItemDetail/DidYouKnow"
import GoingToContactQuestion, { getGoingtoId } from "@/components/ItemDetail/GoingToContactQuestion"
import { getNavigationButtons } from "@/components/ItemDetail/ItemDetailServices/getButtons"
import getJobPublishedTimeAndApplications from "@/components/ItemDetail/ItemDetailServices/getJobPublishedTimeAndApplications"
import getTags from "@/components/ItemDetail/ItemDetailServices/getTags"
import ItemDetailCard from "@/components/ItemDetail/ItemDetailServices/ItemDetailCard"
import JobItemCardHeader from "@/components/ItemDetail/ItemDetailServices/JobItemCardHeader"
import { LbaJobDetail } from "@/components/ItemDetail/LbaJobComponents/LbaJobDetail"
import { PartnerJobDetail } from "@/components/ItemDetail/PartnerJobComponents/PartnerJobDetail"
import { PartnerJobPostuler } from "@/components/ItemDetail/PartnerJobComponents/PartnerJobPostuler"
import RecruteurLbaDetail from "@/components/ItemDetail/RecruteurLbaComponents/RecruteurLbaDetail"
import ShareLink from "@/components/ItemDetail/ShareLink"
import { isCfaEntreprise } from "@/services/cfaEntreprise"
import { PAGES } from "@/utils/routes.utils"

export default function JobDetailRendererClient({ job, params }: WithRecherchePageParams<{ job: ILbaItemJobsGlobal }>) {
  const result = useRechercheResults(params)

  if (params?.displayMap) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh", overflow: "hidden" }}>
        <JobDetail selectedItem={job} resultList={result.status === "success" ? result.items : []} params={params} />
        {/* TODO : remove extended search button from map view */}
        <RechercheCarte item={job} variant="detail" params={params} />
      </Box>
    )
  }

  return <JobDetail selectedItem={job} resultList={result.status === "success" ? result.items : []} params={params} />
}

function JobDetail({ selectedItem, resultList, params }: WithRecherchePageParams<{ selectedItem: ILbaItemJobsGlobal; resultList: IUseRechercheResultsSuccess["items"] }>) {
  // const { activeFilters } = useContext(DisplayContext)
  const currentItem = resultList.find((item) => item.id === selectedItem.id)
  const router = useRouter()
  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const { swipeHandlers, goNext, goPrev } = useBuildNavigation({ items: resultList, currentItem, params })

  const kind = selectedItem.ideaType
  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire
  const handleClose = () => router.push(PAGES.dynamic.recherche(params).getPath())

  const actualTitle = selectedItem.title

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

          {!isCollapsedHeader && getJobPublishedTimeAndApplications({ item: selectedItem })}
          {!isCollapsedHeader && <JobItemCardHeader selectedItem={selectedItem} kind={kind} isMandataire={isMandataire} />}

          <Text
            as="h1"
            fontSize={isCollapsedHeader ? "20px" : "28px"}
            color={"pinksoft.600"}
            sx={{
              fontWeight: 700,
              marginBottom: "4px",
              paddingBottom: "0",
              textAlign: "left",
              wordBreak: "break-word",
            }}
          >
            {actualTitle}
          </Text>

          {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}
          {!isCollapsedHeader && <hr style={{ paddingBottom: "1px" }} />}

          <Flex flexDirection={{ base: "column", sm: "row" }} justifyContent="space-between">
            <Box>
              {isCandidatureLba(selectedItem) && <CandidatureLba item={selectedItem as ILbaItemLbaJobJson | ILbaItemLbaCompanyJson} />}
              {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && !isCandidatureLba(selectedItem) && <NoCandidatureLba />}
              {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobPostuler isCollapsedHeader={isCollapsedHeader} job={selectedItem} />}
            </Box>
            <Box pt={{ base: 0, sm: 4 }}>
              <ShareLink item={selectedItem} />
            </Box>
          </Flex>
        </Box>
      </Box>

      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && <LbaJobDetail title={actualTitle} job={selectedItem as ILbaItemLbaJobJson} />}
      {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaDetail recruteurLba={selectedItem as ILbaItemLbaCompanyJson} />}
      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJobJson} />}

      <AideApprentissage />

      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && (
        <>
          <DidYouKnow />
          {/**TODO: before check was only on FT jobs (LBA_ITEM_TYPE_OLD.PE) */}
          {!(kind !== LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) && (
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
