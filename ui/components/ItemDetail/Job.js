import React, { useState } from "react"
import TagOffreEmploi from "./TagOffreEmploi"
import { isDepartmentJob } from "../../utils/itemListUtils"
import extendedSearchPin from "../../public/images/icons/trainingPin.svg"
import ReactHtmlParser from "react-html-parser"
import { fetchAddresses } from "../../services/baseAdresse"
import { setSelectedMarker } from "../../utils/mapTools"
import { getItemQueryParameters } from "../../utils/getItemId"
import { getSearchQueryParameters } from "../../utils/getSearchParameters"
import TagFormationAssociee from "./TagFormationAssociee"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { Box, Button, Flex, Image, Link, Text } from "@chakra-ui/react"

const Job = ({ job, handleSelectItem, showTextOnly, searchForTrainingsOnNewCenter }) => {
  const { selectedMapPopupItem } = React.useContext(SearchResultContext)
  const { formValues } = React.useContext(DisplayContext)

  const currentSearchRadius = formValues?.radius || 30

  const hasLocation = formValues?.location?.value ? true : false

  const [allowDim, setAllowDim] = useState(true) // cet état évite un appel qui masque la mise en avant de l'icône lors de l'ouverture du détail

  const kind = job?.ideaType

  const onSelectItem = (e) => {
    e.preventDefault()
    setAllowDim(false) // fixation du flag
    handleSelectItem(job)
  }

  const shouldBeHighlighted = () => {
    if (selectedMapPopupItem?.ideaType === "job") {
      return selectedMapPopupItem.items.find((item) => {
        return item?.job?.id === job.job.id
      })
    } else {
      return false
    }
  }

  const getCenterSearchOnJobButton = () => {
    return (
      <Button variant="centerSearch" color="#01ac8c" title="Voir les formations proches" onClick={centerSearchOnJob}>
        <Image mb="2px" mr="5px" src={extendedSearchPin} alt="" />{" "}
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

    let jobPlace = job.place

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

  const dimItemOnMap = (e) => {
    if (allowDim) {
      setSelectedMarker(null)
    } else {
      setAllowDim(true)
    }
  }

  const actualLink = `/recherche-apprentissage?display=list&page=fiche&${getItemQueryParameters(job)}&${getSearchQueryParameters(formValues)}`

  let cardProperties = {
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
  }

  if (shouldBeHighlighted()) {
    cardProperties.filter = "drop-shadow(0px 0px 8px rgba(30, 30, 30, 0.25))"
  }

  return (
    <Link
      as="a"
      className="resultCard"
      {...cardProperties}
      onClick={onSelectItem}
      onMouseOver={highlightItemOnMap}
      onMouseOut={dimItemOnMap}
      href={actualLink}
      data-testid={`${kind}${job.job.id}`}
    >
      <Flex align="flex-start" id={`${kind}${job.job.id}`}>
        <Box flex="1">
          <Flex m="0">
            <Box flex="initial" textAlign="left">
              <Box color="black" fontSize="1rem" fontWeight={700}>
                {job.title}
              </Box>
            </Box>
            <Box my={[1, 1, 1, "0"]} flex="auto" textAlign="right">
              <TagOffreEmploi />
              <TagFormationAssociee isMandataire={job?.company?.mandataire} />
            </Box>
          </Flex>

          <Box pt={2} fw={500} fs="14px" lineHeight="24px">
            {job.company && job.company.name ? job.company.name : ReactHtmlParser("<i>Offre anonyme</i>")}
          </Box>
          <Box pt={2} fw={500} fs="14px" lineHeight="24px">
            {job.place.fullAddress}
          </Box>

          <Text display="flex" fs="14px" color="grey.600" as="span" pt={1}>
            {hasLocation ? isDepartmentJob(job) ? "Dans votre zone de recherche" : <>{job.place.distance} km(s) du lieu de recherche</> : ""}
            {showTextOnly ? (
              ""
            ) : (
              <Text ml="auto" as="span" display={["none", "none", "block"]}>
                <Button variant="knowMore" aria-label="Accéder au détail de l'offre">
                  En savoir plus
                </Button>
              </Text>
            )}
          </Text>
          {Math.round(job.place.distance) > currentSearchRadius ? getCenterSearchOnJobButton() : ""}
        </Box>
      </Flex>
    </Link>
  )
}

export default Job
