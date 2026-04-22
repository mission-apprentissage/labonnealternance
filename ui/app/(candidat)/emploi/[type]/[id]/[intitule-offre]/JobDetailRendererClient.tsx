"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Stack, Typography, useMediaQuery, useTheme } from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { ILbaItemJobsGlobal, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemNaf, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { Footer } from "@/app/_components/Footer"
import type { IUseRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { useBuildNavigation } from "@/app/hooks/useBuildNavigation"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import { BackToTopButton } from "@/components/ItemDetail/BackToTopButton"
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
import { getMatomoJobOfferType, MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"
import { PAGES } from "@/utils/routes.utils"

export default function JobDetailRendererClient({ job, rechercheParams }: { job: ILbaItemJobsGlobal; rechercheParams: IRecherchePageParams }) {
  const result = useRechercheResults(rechercheParams)

  return <JobDetail selectedItem={job} resultList={result.displayedItems} rechercheParams={rechercheParams} />
}

function CandidatureStickyBar({ selectedItem }: { selectedItem: ILbaItemJobsGlobal }) {
  const kind = selectedItem.ideaType
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: "white",
        borderTop: "1px solid",
        borderColor: fr.colors.decisions.border.default.grey.default,
        padding: fr.spacing("3v"),
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: fr.spacing("2v"),
      }}
    >
      <Box sx={{ flex: 1 }}>
        {(kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) && selectedItem.contact?.hasEmail && (
          <CandidatureLba item={selectedItem as ILbaItemLbaJobJson | ILbaItemPartnerJobJson} showScrollToTop />
        )}
        {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaCandidater item={selectedItem as ILbaItemLbaCompanyJson} showScrollToTop />}
        {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && !selectedItem.contact?.hasEmail && <PartnerJobPostuler job={selectedItem} showScrollToTop />}
      </Box>
    </Box>
  )
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"))
  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const headerHeightRef = useRef(0)
  const isCollapsed = isMobile && isCollapsedHeader
  const lastTrackedItemIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        headerHeightRef.current = headerRef.current.offsetHeight
      }
    }
    updateHeaderHeight()
    window.addEventListener("resize", updateHeaderHeight)
    return () => window.removeEventListener("resize", updateHeaderHeight)
  }, [])

  useEffect(() => {
    if (lastTrackedItemIdRef.current === selectedItem.id) return
    lastTrackedItemIdRef.current = selectedItem.id
    const position = resultList.findIndex((item) => item.id === selectedItem.id) + 1
    pushMatomoEvent({
      event: MATOMO_EVENTS.JOB_OFFER_VIEWED,
      job_offer_id: selectedItem.id,
      job_offer_type: getMatomoJobOfferType(selectedItem.ideaType),
      job_offer_company: selectedItem.company?.name || "non_renseigné",
      job_offer_name: selectedItem.title || "non_renseigné",
      position_in_list: position > 0 ? position : undefined,
      has_contact: Boolean((selectedItem as any).contact?.hasEmail || (selectedItem as any).contact?.url || (selectedItem as any).contact?.phone),
      search_job_name: rechercheParams.job_name || "non_renseigné",
      search_address: rechercheParams.geo?.address || "non_renseigné",
    })
  }, [selectedItem.id, resultList, rechercheParams.job_name, rechercheParams.geo?.address])
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

  useEffect(() => {
    const handleScroll = () => {
      if (headerHeightRef.current === 0) return
      const currentScroll = window.scrollY || document.documentElement.scrollTop
      if (!isCollapsedHeader && currentScroll > headerHeightRef.current) {
        setIsCollapsedHeader(true)
      } else if (isCollapsedHeader && currentScroll < headerHeightRef.current) {
        setIsCollapsedHeader(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isCollapsedHeader])

  return (
    <Box
      id="itemDetailColumn"
      sx={{
        display: selectedItem ? "block" : "none",
        position: "relative",
        backgroundColor: "#f8f8f8",
      }}
      {...swipeHandlers}
    >
      {/* Header sticky pleine largeur — visible uniquement quand on a scrollé au-delà du header carte */}
      {isCollapsedHeader && (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: "white",
            filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
            boxShadow: "0 4px 12px 0 rgba(0, 0, 18, 0.16)",
          }}
        >
          {isMobile ? (
            <Box
              sx={{
                padding: `${fr.spacing("2v")} ${fr.spacing("4v")}`,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
            </Box>
          ) : (
            <Container maxWidth="xl" sx={{ px: { xs: 0, lg: "auto" } }}>
              <Box sx={{ padding: "10px 20px 0px 20px", pb: fr.spacing("2v") }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <LbaItemTags item={selectedItem} />
                  <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
                </Box>
                <Typography variant={"h3"} sx={{ color: kind === LBA_ITEM_TYPE.RECRUTEURS_LBA ? "#716043" : fr.colors.decisions.border.default.blueCumulus.default }}>
                  {actualTitle}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", flexDirection: "row", gap: { xs: 0, md: fr.spacing("4v") }, alignItems: "center" }}>
                  <Box sx={{ mr: fr.spacing("4v") }}>
                    {(kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) && selectedItem.contact?.hasEmail && (
                      <CandidatureLba item={selectedItem as ILbaItemLbaJobJson | ILbaItemPartnerJobJson} />
                    )}
                    {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaCandidater item={selectedItem as ILbaItemLbaCompanyJson} />}
                    {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && !selectedItem.contact?.hasEmail && <PartnerJobPostuler job={selectedItem} />}
                  </Box>
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: fr.spacing("4v"), alignItems: "center" }}>
                    <ShareLink item={selectedItem} />
                  </Box>
                </Box>
              </Box>
            </Container>
          )}
        </Box>
      )}

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, py: { xs: 0, lg: fr.spacing("6v") }, px: { xs: 0, lg: "auto" } }}>
        <Box role="main" component="main" sx={{ mb: fr.spacing("12v") }}>
          {/* Header carte — toujours dans le flux, scrolle normalement */}
          <Box
            ref={headerRef}
            sx={{
              filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
              borderRadius: { xs: 0, lg: fr.spacing("2v") },
              boxShadow: { xs: "unset", lg: "0 4px 12px 0 rgba(0, 0, 18, 0.16)" },
              padding: "10px 20px 0px 20px",
              backgroundColor: "white",
            }}
          >
            <Box sx={{ width: "100%", pl: 0, pb: fr.spacing("2v") }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <LbaItemTags item={selectedItem} />
                <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
              </Box>
              {getJobPublishedTimeAndApplications({ item: selectedItem })}
              <JobItemCardHeader selectedItem={selectedItem} kind={kind as LBA_ITEM_TYPE} isMandataire={isMandataire} />
              <Typography
                id="detail-header"
                variant={"h3"}
                sx={{ color: kind === LBA_ITEM_TYPE.RECRUTEURS_LBA ? "#716043" : fr.colors.decisions.border.default.blueCumulus.default }}
              >
                {actualTitle}
              </Typography>
              <ItemDetailCard selectedItem={selectedItem} />
              <hr style={{ paddingBottom: "1px" }} />
              <Box sx={{ display: "flex", flexWrap: "wrap", flexDirection: "row", gap: { xs: 0, md: fr.spacing("4v") }, alignItems: "center" }}>
                <Box sx={{ mr: fr.spacing("4v") }}>
                  {(kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) && selectedItem.contact?.hasEmail && (
                    <CandidatureLba item={selectedItem as ILbaItemLbaJobJson | ILbaItemPartnerJobJson} />
                  )}
                  {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaCandidater item={selectedItem as ILbaItemLbaCompanyJson} />}
                  {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && !selectedItem.contact?.hasEmail && <PartnerJobPostuler job={selectedItem} />}
                </Box>
                <Box sx={{ flex: 1, display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: fr.spacing("4v"), alignItems: "center" }}>
                  <ShareLink item={selectedItem} />
                </Box>
              </Box>
              {selectedItem.company?.mandataire && selectedItem.contact?.hasEmail && (
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    mt: 0,
                    mb: { xs: fr.spacing("2v"), md: 0 },
                  }}
                >
                  <Box component="span">
                    <Image width={16} height={16} src="/images/icons/small_info.svg" aria-hidden="true" alt="" />
                  </Box>
                  <Typography component="span" variant="body2" sx={{ ml: fr.spacing("2v"), fontSize: "12px", fontStyle: "italic" }}>
                    Votre candidature sera envoyée à l'organisme en charge du recrutement pour le compte de l'entreprise.{" "}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>

          <Box id="detail-content-container" />
          <Box sx={{ mx: { md: 0, lg: fr.spacing("6v") } }}>
            {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && <LbaJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJobJson} />}
            {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <RecruteurLbaDetail recruteurLba={selectedItem as ILbaItemLbaCompanyJson} />}
            {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && <PartnerJobDetail title={actualTitle} job={selectedItem as ILbaItemPartnerJobJson} />}

            <AideApprentissage />

            {[LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA].includes(kind as LBA_ITEM_TYPE) && (
              <Box
                sx={{
                  mx: { xs: 0, lg: "auto" },
                  my: fr.spacing("6v"),
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
        </Box>
      </Container>
      {isCollapsed && <CandidatureStickyBar selectedItem={selectedItem} />}
      {!isMobile && <BackToTopButton />}
      <Footer />
    </Box>
  )
}
