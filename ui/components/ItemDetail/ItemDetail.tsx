import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Divider, Flex, Link, Text } from "@chakra-ui/react"
import { defaultTo } from "lodash"
import { useContext, useEffect, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import DemandeDeContact from "@/components/RDV/DemandeDeContact"
import { focusWithin } from "@/theme/theme-lba-tools"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { isCfaEntreprise } from "../../services/cfaEntreprise"
import { filterLayers } from "../../utils/mapTools"
import { SendPlausibleEvent } from "../../utils/plausible"

import AideApprentissage from "./AideApprentissage"
import CandidatureLba from "./CandidatureLba/CandidatureLba"
import isCandidatureLba from "./CandidatureLba/services/isCandidatureLba"
import DidYouKnow from "./DidYouKnow"
import GoingToContactQuestion, { getGoingtoId } from "./GoingToContactQuestion"
import getActualTitle from "./ItemDetailServices/getActualTitle"
import { BuildSwipe, buttonJePostuleShouldBeDisplayed, buttonRdvShouldBeDisplayed, getNavigationButtons } from "./ItemDetailServices/getButtons"
import getCurrentList from "./ItemDetailServices/getCurrentList"
import getJobPublishedTimeAndApplications from "./ItemDetailServices/getJobPublishedTimeAndApplications"
import getJobSurtitre from "./ItemDetailServices/getJobSurtitre"
import getSoustitre from "./ItemDetailServices/getSoustitre"
import getTags from "./ItemDetailServices/getTags"
import hasAlsoEmploi from "./ItemDetailServices/hasAlsoEmploi"
import LbbCompanyDetail from "./LbbCompanyDetail"
import LocationDetail from "./LocationDetail"
import MatchaDetail from "./MatchaDetail"
import PeJobDetail from "./PeJobDetail"
import TrainingDetail from "./TrainingDetail"

const ItemDetail = ({ selectedItem, handleClose, handleSelectItem }) => {
  const kind: LBA_ITEM_TYPE_OLD = selectedItem?.ideaType

  const { activeFilters } = useContext(DisplayContext)

  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire

  useEffect(() => {
    try {
      filterLayers(activeFilters)
    } catch (err) {
      //notice: gère des erreurs qui se présentent à l'initialisation de la page quand mapbox n'est pas prêt.
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [selectedItem?.id, selectedItem?.company?.siret, selectedItem?.job?.id])

  const actualTitle = getActualTitle({ kind, selectedItem })

  const { trainings, jobs, extendedSearch } = useContext(SearchResultContext)
  const hasAlsoJob = hasAlsoEmploi({ isCfa, company: selectedItem?.company, searchedMatchaJobs: jobs?.matchas })
  const currentList = getCurrentList({ store: { trainings, jobs }, activeFilters, extendedSearch })

  const { swipeHandlers, goNext, goPrev } = BuildSwipe({ currentList, handleSelectItem, selectedItem })

  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const maxScroll = 100
  const handleScroll = () => {
    let currentScroll = document.querySelector("#itemDetailColumn").scrollTop
    currentScroll += isCollapsedHeader ? 100 : -100
    setIsCollapsedHeader(currentScroll > maxScroll)
  }

  const postuleSurPoleEmploi = () => {
    SendPlausibleEvent("Clic Postuler - Fiche entreprise Offre PE", {
      info_fiche: selectedItem.job.id,
    })
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
          {!isCollapsedHeader && getJobSurtitre({ selectedItem, kind, isMandataire })}

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
            {defaultTo(actualTitle, "")}
          </Text>

          {!isCollapsedHeader && getSoustitre({ selectedItem })}

          {buttonJePostuleShouldBeDisplayed(kind, selectedItem) && (
            <Box my={4}>
              <Link data-tracking-id="postuler-offre-partenaire" {...focusWithin} variant="postuler" href={selectedItem.url} target="poleemploi" onClick={postuleSurPoleEmploi}>
                Je postule sur Pôle emploi
              </Link>
            </Box>
          )}

          {isCandidatureLba(selectedItem) && (
            <>
              <Divider my={2} />
              <CandidatureLba item={selectedItem} />
            </>
          )}

          {kind === LBA_ITEM_TYPE_OLD.FORMATION && buttonRdvShouldBeDisplayed(selectedItem) && (
            <>
              <Divider my={2} />
              <DemandeDeContact context={selectedItem.rdvContext} referrer="LBA" showInModal />
            </>
          )}
        </Box>
      </Box>

      {kind === LBA_ITEM_TYPE_OLD.PEJOB && <PeJobDetail job={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.MATCHA && <MatchaDetail job={selectedItem} />}
      {kind === LBA_ITEM_TYPE_OLD.LBA && <LbbCompanyDetail lbb={selectedItem} />}

      {kind === LBA_ITEM_TYPE_OLD.FORMATION && <TrainingDetail training={selectedItem} hasAlsoJob={hasAlsoJob} />}

      {kind === LBA_ITEM_TYPE_OLD.LBA && (
        <Box bg="#f5f5fe" border="1px solid #e3e3fd" mx={8} mb={8} px={6} py={4}>
          <Box color="bluefrance.500" fontSize="22px" fontWeight={700}>
            Besoin d&apos;aide ?
          </Box>
          <Box color="grey.700">Découvrez les modules de formation de La bonne alternance. Des modules de quelques minutes pour bien préparer vos candidatures.</Box>
          <Box pl={6}>
            <Box pt={4}>
              &bull;
              <Link
                variant="basicUnderlined"
                ml={4}
                isExternal
                href="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
                aria-label="Formation Chercher un employeur - nouvelle fenêtre"
              >
                Chercher un employeur <ExternalLinkIcon mb="3px" mx="2px" />
              </Link>
            </Box>
            <Box pt={4}>
              &bull;
              <Link
                variant="basicUnderlined"
                ml={4}
                isExternal
                href="https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
                aria-label="Formation préparer un entretien avec un employeur - nouvelle fenêtre"
              >
                Préparer un entretien avec un employeur <ExternalLinkIcon mb="3px" mx="2px" />
              </Link>
            </Box>
          </Box>
        </Box>
      )}

      <LocationDetail item={selectedItem} isCfa={isCfa}></LocationDetail>

      <AideApprentissage item={selectedItem}></AideApprentissage>

      {kind === LBA_ITEM_TYPE_OLD.PEJOB && (
        <>
          <DidYouKnow />
          {!buttonJePostuleShouldBeDisplayed(kind, selectedItem) && (
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

export default ItemDetail
