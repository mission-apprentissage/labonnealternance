"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { ILbaItemJobsGlobal, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemNaf, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { hasValidEmail } from "@/app/(candidat)/(recherche)/recherche/_components/hasValidEmail"
import { RechercheCarte } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultats/RechercheMap"
import type { IUseRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { Footer } from "@/app/_components/Footer"
import { useBuildNavigation } from "@/app/hooks/useBuildNavigation"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import { CandidatureLba } from "@/components/ItemDetail/CandidatureLba/CandidatureLba"
import getJobPublishedTimeAndApplications from "@/components/ItemDetail/ItemDetailServices/getJobPublishedTimeAndApplications"
import ItemDetailCard from "@/components/ItemDetail/ItemDetailServices/ItemDetailCard"
import JobItemCardHeader from "@/components/ItemDetail/ItemDetailServices/JobItemCardHeader"
import { LbaItemTags } from "@/components/ItemDetail/ItemDetailServices/LbaItemTags"
import { NavigationButtons } from "@/components/ItemDetail/ItemDetailServices/NavigationButtons"
import { LbaJobDetail } from "@/components/ItemDetail/LbaJobComponents/LbaJobDetail"
import { PartnerJobDetail } from "@/components/ItemDetail/PartnerJobComponents/PartnerJobDetail"
import { PartnerJobPostuler } from "@/components/ItemDetail/PartnerJobComponents/PartnerJobPostuler"
import { RecruteurLbaCandidater } from "@/components/ItemDetail/RecruteurLbaComponents/RecruteurLbaCandidater"
import RecruteurLbaDetail from "@/components/ItemDetail/RecruteurLbaComponents/RecruteurLbaDetail"
import ShareLink from "@/components/ItemDetail/ShareLink"
import { ValorisationCandidatureSpontanee } from "@/components/ItemDetail/ValorisationCandidatureSpontanee"
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

  const [firstNaf] = selectedItem?.nafs as ILbaItemNaf[]
  const actualTitle = kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && firstNaf ? firstNaf.label : selectedItem.title

  const maxScroll = 100
  const handleScroll = () => {
    let currentScroll = document.querySelector("#itemDetailColumn").scrollTop
    currentScroll += isCollapsedHeader ? 100 : -100
    setIsCollapsedHeader(currentScroll > maxScroll)
  }

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
      <Box role="main" component="main" sx={{ mb: fr.spacing("6w") }}>
        <Box
          sx={{
            filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
            padding: "10px 20px 0px 20px",
            backgroundColor: "white",
            zIndex: 2, // DSFR Accordion gets zIndex 1 when manipulated for some reason.
          }}
          {...(isCollapsedHeader
            ? {
                position: "sticky",
                zIndex: "1",
                top: "0",
                left: "0",
                display: "flex",
                width: "100%",
              }
            : {})}
        >
          <Box sx={{ width: "100%", pl: 0, pb: isCollapsedHeader ? 0 : fr.spacing("1w") }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <LbaItemTags item={selectedItem} />
              <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
            </Box>
            {!isCollapsedHeader && getJobPublishedTimeAndApplications({ item: selectedItem })}
            {!isCollapsedHeader && <JobItemCardHeader selectedItem={selectedItem} kind={kind as LBA_ITEM_TYPE} isMandataire={isMandataire} />}

            <Typography
              id="detail-header"
              variant={"h3"}
              sx={{ color: kind === LBA_ITEM_TYPE.RECRUTEURS_LBA ? "#716043" : fr.colors.decisions.border.default.blueCumulus.default }}
            >
              {actualTitle}
            </Typography>

            {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}
            {!isCollapsedHeader && <hr style={{ paddingBottom: "1px" }} />}
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
              <div>
                {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && hasValidEmail(selectedItem) && <CandidatureLba item={selectedItem as ILbaItemLbaJobJson} />}
                {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaCandidater item={selectedItem as ILbaItemLbaCompanyJson} />}
                {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobPostuler job={selectedItem} />}
              </div>
              <div>
                <ShareLink item={selectedItem} />
              </div>
            </Box>
          </Box>
        </Box>

        <Box id="detail-content-container" />
        {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && <LbaJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJobJson} />}
        {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaDetail recruteurLba={selectedItem as ILbaItemLbaCompanyJson} />}
        {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJobJson} />}

        <AideApprentissage />

        {[LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA].includes(kind as LBA_ITEM_TYPE) && (
          <Box
            sx={{
              mx: { xs: 0, lg: "auto" },
              my: fr.spacing("3w"),
              maxWidth: "970px",
            }}
          >
            <ValorisationCandidatureSpontanee
              overridenQueryParams={{
                utm_source: "lba",
                utm_medium: "website",
                utm_campaign: "lba_fiche-offre_promo-candidature-spontanee",
              }}
            />
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  )
}
