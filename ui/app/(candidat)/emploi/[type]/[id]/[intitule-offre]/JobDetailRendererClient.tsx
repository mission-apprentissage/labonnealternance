"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ILbaItemJobsGlobal, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { IUseRechercheResults, useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { useBuildNavigation } from "@/app/hooks/useBuildNavigation"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import { CandidatureLba, NoCandidatureLba } from "@/components/ItemDetail/CandidatureLba/CandidatureLba"
import isCandidatureLba from "@/components/ItemDetail/CandidatureLba/services/isCandidatureLba"
import DidYouKnow from "@/components/ItemDetail/DidYouKnow"
import GoingToContactQuestion, { getGoingtoId } from "@/components/ItemDetail/GoingToContactQuestion"
import getJobPublishedTimeAndApplications from "@/components/ItemDetail/ItemDetailServices/getJobPublishedTimeAndApplications"
import ItemDetailCard from "@/components/ItemDetail/ItemDetailServices/ItemDetailCard"
import JobItemCardHeader from "@/components/ItemDetail/ItemDetailServices/JobItemCardHeader"
import { LbaItemTags } from "@/components/ItemDetail/ItemDetailServices/LbaItemTags"
import { NavigationButtons } from "@/components/ItemDetail/ItemDetailServices/NavigationButtons"
import { LbaJobDetail } from "@/components/ItemDetail/LbaJobComponents/LbaJobDetail"
import { PartnerJobDetail } from "@/components/ItemDetail/PartnerJobComponents/PartnerJobDetail"
import { PartnerJobPostuler } from "@/components/ItemDetail/PartnerJobComponents/PartnerJobPostuler"
import RecruteurLbaDetail from "@/components/ItemDetail/RecruteurLbaComponents/RecruteurLbaDetail"
import ShareLink from "@/components/ItemDetail/ShareLink"
import { PAGES } from "@/utils/routes.utils"

export default function JobDetailRendererClient({ job, rechercheParams }: { job: ILbaItemJobsGlobal; rechercheParams: IRecherchePageParams }) {
  const result = useRechercheResults(rechercheParams)

  const jobDetail = <JobDetail selectedItem={job} resultList={result.displayedItems} rechercheParams={rechercheParams} />

  if (rechercheParams?.displayMap) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh", overflow: "hidden" }}>
        {jobDetail}
        {/* TODO : remove extended search button from map view */}
        <RechercheCarte item={job} variant="detail" rechercheParams={rechercheParams} />
      </Box>
    )
  }

  return jobDetail
}

function JobDetail({
  selectedItem,
  resultList,
  rechercheParams,
}: {
  rechercheParams: IRecherchePageParams
  selectedItem: ILbaItemJobsGlobal
  resultList: IUseRechercheResults["displayedItems"]
}) {
  const router = useRouter()
  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const { swipeHandlers, goNext, goPrev } = useBuildNavigation({
    items: resultList,
    currentItemId: selectedItem.id,
    rechercheParams: rechercheParams,
  })

  const kind = selectedItem.ideaType
  const isMandataire = selectedItem?.company?.mandataire
  const handleClose = () => router.push(PAGES.dynamic.recherche(rechercheParams).getPath())

  // @ts-expect-error
  const actualTitle = kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && selectedItem?.nafs?.length > 0 ? selectedItem.nafs[0]?.label : selectedItem.title

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
      onScroll={handleScroll}
      id="itemDetailColumn"
      sx={{
        display: selectedItem ? "block" : "none",
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
        sx={{
          filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
          padding: "10px 20px 0px 10px",
          backgroundColor: "white",
          zIndex: 2, // DSFR Accordion gets zIndex 1 when manipulated for some reason.
        }}
        {...stickyHeaderProperties}
      >
        <Box sx={{ width: "100%", pl: { xs: 0, md: 4, pb: isCollapsedHeader ? 0 : 2 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <LbaItemTags item={selectedItem} />
            <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
          </Box>
          {!isCollapsedHeader && getJobPublishedTimeAndApplications({ item: selectedItem })}
          {!isCollapsedHeader && <JobItemCardHeader selectedItem={selectedItem} kind={kind as LBA_ITEM_TYPE} isMandataire={isMandataire} />}

          <Typography variant={"h3"} sx={{ color: fr.colors.decisions.border.default.blueCumulus.default }}>
            {actualTitle}
          </Typography>

          {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}
          {!isCollapsedHeader && <hr style={{ paddingBottom: "1px" }} />}
          <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
            <div>
              {isCandidatureLba(selectedItem) && <CandidatureLba item={selectedItem as ILbaItemLbaJobJson | ILbaItemLbaCompanyJson} />}
              {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && !isCandidatureLba(selectedItem) && <NoCandidatureLba />}
              {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobPostuler isCollapsedHeader={isCollapsedHeader} job={selectedItem} />}
            </div>
            <div>
              <ShareLink item={selectedItem} />
            </div>
          </Box>
        </Box>
      </Box>

      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && <LbaJobDetail title={actualTitle} job={selectedItem as ILbaItemLbaJobJson} />}
      {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaDetail recruteurLba={selectedItem as ILbaItemLbaCompanyJson} />}
      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJobJson} />}

      <AideApprentissage />

      {[LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA].includes(kind as LBA_ITEM_TYPE) && <DidYouKnow />}

      {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <GoingToContactQuestion kind={kind} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />}
    </Box>
  )
}
