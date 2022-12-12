import React, { useState, useEffect, useContext } from "react"
import PeJobDetail from "./PeJobDetail"
import MatchaDetail from "./MatchaDetail"
import LbbCompanyDetail from "./LbbCompanyDetail"
import TrainingDetail from "./TrainingDetail"
import { defaultTo } from "lodash"
import { amongst } from "../../utils/arrayutils"
import { isCfaEntreprise } from "../../services/cfaEntreprise"
import { filterLayers } from "../../utils/mapTools"
import ExternalLink from "../externalLink"
import { SearchResultContext } from "../../context/SearchResultContextProvider"

import LocationDetail from "./LocationDetail"
import DidYouKnow from "./DidYouKnow"
import CandidatureSpontanee from "./CandidatureSpontanee/CandidatureSpontanee"
import isCandidatureSpontanee from "./CandidatureSpontanee/services/isCandidatureSpontanee"
import getJobSurtitre from "./ItemDetailServices/getJobSurtitre"
import hasAlsoEmploi from "./ItemDetailServices/hasAlsoEmploi"
import getSoustitre from "./ItemDetailServices/getSoustitre"
import getActualTitle from "./ItemDetailServices/getActualTitle"
import getCurrentList from "./ItemDetailServices/getCurrentList"
import getTags from "./ItemDetailServices/getTags"
import { buttonJePostuleShouldBeDisplayed, buttonPRDVShouldBeDisplayed, buildPrdvButton, getNavigationButtons, BuildSwipe } from "./ItemDetailServices/getButtons"

import GoingToContactQuestion, { getGoingtoId } from "./GoingToContactQuestion"
import gotoIcon from "../../public/images/icons/goto.svg"
import { SendPlausibleEvent } from "../../utils/plausible"
import { Box, Divider, Flex, Text } from "@chakra-ui/react"

const ItemDetail = ({ selectedItem, handleClose, handleSelectItem, activeFilter }) => {
  const kind = selectedItem?.ideaType

  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire

  const [seeInfo, setSeeInfo] = useState(false)

  useEffect(() => {
    setSeeInfo(false)
    try {
      filterLayers(activeFilter)
    } catch (err) {
      //notice: gère des erreurs qui se présentent à l'initialisation de la page quand mapbox n'est pas prêt.
    }
  }, [selectedItem?.id, selectedItem?.company?.siret, selectedItem?.job?.id])

  let actualTitle = getActualTitle({ kind, selectedItem })

  const { trainings, jobs, extendedSearch } = useContext(SearchResultContext)
  const hasAlsoJob = hasAlsoEmploi({ isCfa, company: selectedItem?.company, searchedMatchaJobs: jobs?.matchas })
  const currentList = getCurrentList({ store: { trainings, jobs }, activeFilter, extendedSearch })

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
        background: "#fff",
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
      className="itemDetail"
      {...swipeHandlers}
    >
      <Box
        as="header"
        sx={{
          filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
        }}
        {...stickyHeaderProperties}
      >
        <Box width="100%" pl={["0", 4]} pb={isCollapsedHeader ? "0" : 2}>
          <Flex mb={2} justifyContent="flex-end">
            {getTags({ kind, isCfa, isMandataire, hasAlsoJob })}
            {getNavigationButtons({ goPrev, goNext, setSeeInfo, handleClose })}
          </Flex>

          {kind === "formation" && (
            <Text as="p" textAlign="left" color="grey.600" mt={4} mb={3} fontWeight={700} fontSize="1rem">
              <Text as="span">{`${selectedItem?.company?.name || ""} (${selectedItem.company.place.city})`}</Text>
              <Text as="span" fontWeight={400}>
                &nbsp;propose cette formation
              </Text>
            </Text>
          )}

          {!isCollapsedHeader && getJobSurtitre({ selectedItem, kind, isMandataire })}

          <Text
            as="h1"
            fontSize={isCollapsedHeader ? "20px" : "28px"}
            color={kind !== "formation" ? "pinksoft.600" : "greensoft.500"}
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

          {!isCollapsedHeader && getSoustitre({ selectedItem, kind })}

          {buttonJePostuleShouldBeDisplayed(kind, selectedItem) && (
            <div className="c-detail-description-me">
              <div className="c-detail-pelink my-3">
                <a className="btn btn-blue gtmContactPE" onClick={postuleSurPoleEmploi} target="poleemploi" href={selectedItem.url}>
                  Je postule sur Pôle emploi
                </a>
              </div>
            </div>
          )}

          {isCandidatureSpontanee(selectedItem) && (
            <>
              <Divider my="0" />
              <CandidatureSpontanee item={selectedItem} />
            </>
          )}

          {kind === "formation" && buttonPRDVShouldBeDisplayed(selectedItem) && (
            <>
              <hr className={"c-detail-header-separator c-detail-header-separator--upperformation"} />
              <div className="c-detail-prdv mt-3 pb-4 w-75">{buildPrdvButton(selectedItem)}</div>
            </>
          )}
        </Box>
      </Box>

      {kind === "peJob" ? <PeJobDetail job={selectedItem} seeInfo={seeInfo} setSeeInfo={setSeeInfo} /> : ""}
      {kind === "matcha" ? <MatchaDetail job={selectedItem} seeInfo={seeInfo} setSeeInfo={setSeeInfo} /> : ""}
      {amongst(kind, ["lbb", "lba"]) ? <LbbCompanyDetail lbb={selectedItem} seeInfo={seeInfo} setSeeInfo={setSeeInfo} /> : ""}

      {kind === "formation" ? <TrainingDetail training={selectedItem} hasAlsoJob={hasAlsoJob} /> : ""}

      {amongst(kind, ["lbb", "lba"]) ? (
        <div className="c-needHelp">
          <div className="c-needHelp-title">Besoin d&apos;aide ?</div>
          <div className="c-needHelp-text">Découvrez les modules de formation de La bonne alternance. Des modules de quelques minutes pour bien préparer vos candidatures.</div>
          <ul className="c-needHelp-listLinks">
            <li>
              <span className="c-detail-traininglink ml-1">
                <ExternalLink
                  className="gtmDidask1 c-nice-link"
                  url="https://dinum-beta.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
                  title="Chercher un employeur"
                  withPic={<img src={gotoIcon} alt="Ouverture dans un nouvel onglet" />}
                />
              </span>
            </li>
            <li>
              <span className="c-detail-traininglink ml-1">
                <ExternalLink
                  className="gtmDidask2 c-nice-link"
                  url="https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
                  title="Préparer un entretien avec un employeur"
                  withPic={<img src={gotoIcon} alt="Ouverture dans un nouvel onglet" />}
                />
              </span>
            </li>
          </ul>
        </div>
      ) : (
        ""
      )}

      <LocationDetail item={selectedItem} isCfa={isCfa}></LocationDetail>

      {kind === "peJob" ? (
        <>
          <DidYouKnow item={selectedItem}></DidYouKnow>

          {buttonJePostuleShouldBeDisplayed(kind, selectedItem) ? (
            ""
          ) : (
            <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
          )}
        </>
      ) : (
        <></>
      )}
      {kind === "formation" ? (
        <>
          {buttonPRDVShouldBeDisplayed(selectedItem) ? (
            ""
          ) : (
            <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
          )}
        </>
      ) : (
        <></>
      )}
      {kind === "lbb" || kind === "lba" ? (
        <>
          {isCandidatureSpontanee(selectedItem) ? (
            ""
          ) : (
            <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />
          )}
        </>
      ) : (
        <></>
      )}
    </Box>
  )
}

export default ItemDetail
