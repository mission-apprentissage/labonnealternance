import { Box, Button, Flex, Image, Link, Text } from "@chakra-ui/react"
import React, { useState } from "react"
import ReactHtmlParser from "react-html-parser"
import { LBA_ITEM_TYPE_OLD, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { buildJobUrl } from "shared/metier/lbaitemutils"

import { focusWithin } from "@/theme/theme-lba-tools"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { fetchAddresses } from "../../services/baseAdresse"
import { getDaysSinceDate } from "../../utils/dateUtils"
import { getSearchQueryParameters } from "../../utils/getSearchParameters"
import { isDepartmentJob } from "../../utils/itemListUtils"
import { setSelectedMarker } from "../../utils/mapTools"

import ItemDetailApplicationsStatus from "./ItemDetailServices/ItemDetailApplicationStatus"
import TagFormationAssociee from "./TagFormationAssociee"
import TagOffreEmploi from "./TagOffreEmploi"

const Job = ({ job, handleSelectItem, showTextOnly = undefined, searchForTrainingsOnNewCenter }) => {
  const { selectedMapPopupItem } = React.useContext(SearchResultContext)
  const { formValues } = React.useContext(DisplayContext)

  const currentSearchRadius = formValues?.radius || 30

  const hasLocation = formValues?.location?.value ? true : false

  const [allowDim, setAllowDim] = useState(true) // cet état évite un appel qui masque la mise en avant de l'icône lors de l'ouverture du détail

  const kind: LBA_ITEM_TYPE_OLD = job?.ideaType

  const onSelectItem = (e) => {
    e.preventDefault()
    setAllowDim(false) // fixation du flag
    handleSelectItem(job)
  }

  const shouldBeHighlighted = () => {
    if (selectedMapPopupItem?.ideaType === "job") {
      return selectedMapPopupItem.items.find((item) => {
        return item?.id === job.id
      })
    } else {
      return false
    }
  }

  const getCenterSearchOnJobButton = () => {
    return (
      <Button variant="centerSearch" color="#01ac8c" title="Voir les formations proches" onClick={centerSearchOnJob}>
        <Image mb="2px" mr="5px" src="/images/icons/trainingPin.svg" alt="" />{" "}
        <Text textDecoration="underline" as="span">
          Voir les formations proches
        </Text>
      </Button>
    )
  }

  const centerSearchOnJob = async (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    const jobPlace = job.place

    if (!jobPlace.insee) {
      const addresses = await fetchAddresses(job.place.address, "municipality")
      jobPlace.insee = ""
      jobPlace.zipCode = ""
      if (addresses.length) {
        jobPlace.insee = addresses[0].insee
        jobPlace.zipCode = addresses[0].zipcode
      }
    }

    const newCenter = {
      insee: jobPlace.insee,
      label: jobPlace.fullAddress,
      zipcode: jobPlace.zipCode,
      value: {
        type: "Point",
        coordinates: [jobPlace.longitude, jobPlace.latitude],
      },
    }

    searchForTrainingsOnNewCenter(newCenter)
  }

  const highlightItemOnMap = () => {
    setSelectedMarker(job)
  }

  const dimItemOnMap = () => {
    if (allowDim) {
      setSelectedMarker(null)
    } else {
      setAllowDim(true)
    }
  }

  const actualLink = `${buildJobUrl(oldItemTypeToNewItemType(job.ideaType), job.id, job.title)}?&${getSearchQueryParameters(formValues)}`

  const cardProperties = {
    display: "block",
    color: "grey.650",
    cursor: "pointer",
    bg: "white",
    textAlign: "left",
    m: ["0.5rem 0", "18px 25px", "0.5rem 0", "0.5rem 25px"],
    p: ["20px 10px", "20px 25px", "20px 10px", "20px 25px"],
    _hover: {
      textDecoration: "none",
      color: "inherit",
    },
    filter: undefined,
  }

  if (shouldBeHighlighted()) {
    cardProperties.filter = "drop-shadow(0px 0px 8px rgba(30, 30, 30, 0.25))"
  }

  const daysPublished = getDaysSinceDate(job.job.creationDate)

  return (
    // @ts-expect-error: TODO
    <Link
      as="a"
      className={`resultCard ${kind}`}
      {...cardProperties}
      onClick={onSelectItem}
      onMouseOver={highlightItemOnMap}
      onMouseOut={dimItemOnMap}
      {...focusWithin}
      href={actualLink}
      data-testid={`${kind}${job.job.id}`}
    >
      <Flex align="flex-start" id={`${kind}${job.job.id}`}>
        <Box flex="1">
          <Flex m="0">
            <Box flex="initial" textAlign="left">
              <Box as="h2" color="black" fontSize="1rem" fontWeight={700}>
                {job.title}
              </Box>
            </Box>
            <Box my={[1, 1, 1, "0"]} flex="auto" textAlign="right">
              <TagOffreEmploi />
              <TagFormationAssociee isMandataire={job?.company?.mandataire} />
            </Box>
          </Flex>

          <Box as="h3" pt={2} fontWeight={500} fontSize="14px">
            {job.company && job.company.name ? job.company.name : ReactHtmlParser("<i>Offre anonyme</i>")}
          </Box>
          <Box pt={2} fontWeight={500} fontSize="12px">
            {job?.company?.mandataire ? job.place.city : job.place.fullAddress}
          </Box>

          <Box fontSize="12px" color="grey.600" as="span" pt={1}>
            {hasLocation ? (isDepartmentJob(job) ? "Dans votre zone de recherche" : `${job.place.distance} km(s) du lieu de recherche`) : ""}
            {!showTextOnly && (
              <Flex mt={4} alignItems="center">
                {job?.job?.creationDate && (
                  <Text color="grey.600" fontSize="12px" mr={4}>
                    Publiée {`${daysPublished ? `depuis ${daysPublished} jour(s)` : "aujourd'hui"}`}
                  </Text>
                )}
                {kind === LBA_ITEM_TYPE_OLD.MATCHA && (
                  <Flex alignItems="center">
                    <Image mr={1} src="/images/eclair.svg" alt="" />
                    <Text color="#0063CB" display="flex" fontSize="12px" whiteSpace="nowrap" mr={2}>
                      {job.applicationCount} candidature(s)
                    </Text>
                  </Flex>
                )}
                <Text ml="auto" as="span" display={["none", "none", "block"]}>
                  <Button tabIndex={-1} variant="knowMore" aria-label="Accéder au détail de l'offre">
                    En savoir plus
                  </Button>
                </Text>
              </Flex>
            )}
            <ItemDetailApplicationsStatus item={job} mt={2} mb={2} />
          </Box>
          {job.place.distance > currentSearchRadius ? getCenterSearchOnJobButton() : ""}
        </Box>
      </Flex>
    </Link>
  )
}

export default Job
