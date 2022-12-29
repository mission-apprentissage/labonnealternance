import React, { useState, useContext } from "react"
import { fetchAddresses } from "../../services/baseAdresse"
import extendedSearchPin from "../../public/images/icons/jobPin.svg"
import { ScopeContext } from "../../context/ScopeContext"
import TagCfaDEntreprise from "./TagCfaDEntreprise"
import TagFormation from "./TagFormation"
import { setSelectedMarker } from "../../utils/mapTools"
import { getItemQueryParameters } from "../../utils/getItemId"
import { getSearchQueryParameters } from "../../utils/getSearchParameters"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { Box, Button, Flex, Image, Link, Text } from "@chakra-ui/react"

const Training = ({ training, handleSelectItem, showTextOnly, searchForJobsOnNewCenter, isCfa }) => {
  const { selectedMapPopupItem } = React.useContext(SearchResultContext)
  const { formValues } = React.useContext(DisplayContext)
  const scopeContext = useContext(ScopeContext)

  const currentSearchRadius = formValues?.radius || 30

  const [allowDim, setAllowDim] = useState(true) // cet état évite un appel qui masque la mise en avant de l'icône lors de l'ouverture du détail

  const onSelectItem = (e) => {
    e.preventDefault()
    setAllowDim(false) // fixation du flag
    handleSelectItem(training, "training")
  }

  const shouldBeHighlighted = () => {
    if (selectedMapPopupItem?.ideaType === "formation") {
      return selectedMapPopupItem.items.find((item) => {
        return item.id === training.id
      })
    } else {
      return false
    }
  }

  const getCenterSearchOnTrainingButton = () => {
    return (
      <Button variant="centerSearch" color="#ff8d7e" title="Voir les entreprises proches" onClick={centerSearchOnTraining}>
        <Image mb="2px" mr="5px" src={extendedSearchPin} alt="" />{" "}
        <Text textDecoration="underline" as="span">
          Voir les entreprises proches
        </Text>
      </Button>
    )
  }

  const centerSearchOnTraining = async (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    // reconstruction des critères d'adresse selon l'adresse du centre de formation
    const label = `${training.place.city} ${training.place.zipCode}`

    // récupération du code insee depuis la base d'adresse
    if (!training.place.insee) {
      const addresses = await fetchAddresses(label, "municipality")
      if (addresses.length) {
        training.place.insee = addresses[0].insee
      }
    }

    const newCenter = {
      insee: training.place.insee,
      label,
      zipcode: training.place.zipCode,
      value: {
        type: "Point",
        coordinates: [training.place.longitude, training.place.latitude],
      },
    }

    searchForJobsOnNewCenter(newCenter)
  }

  const highlightItemOnMap = () => {
    setSelectedMarker(training)
  }

  const dimItemOnMap = (e) => {
    if (allowDim) {
      setSelectedMarker(null)
    } else {
      setAllowDim(true)
    }
  }

  const actualLink = `/recherche-apprentissage?display=list&page=fiche&${getItemQueryParameters(training)}&${getSearchQueryParameters(formValues)}`

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
    <Link as="a" className="resultCard" {...cardProperties} onClick={onSelectItem} onMouseOver={highlightItemOnMap} onMouseOut={dimItemOnMap} href={actualLink}>
      <Flex align="flex-start" id={`id${training.id}`}>
        <Box flex="1">
          <Flex m="0">
            <Box flex="initial" textAlign="left">
              <Box color="black" fontSize="1rem" fontWeight={700}>
                {training.title ? training.title : training.longTitle}
              </Box>
            </Box>
            <Box my={[1, 1, 1, "0"]} flex="auto" textAlign="right">
              {isCfa ? <TagCfaDEntreprise /> : <TagFormation />}
            </Box>
          </Flex>

          <Box pt={[4, 4, 4, 1]} fw={500} fs="14px" lineHeight="24px">
            {training.company.name}
          </Box>
          <Box pt={2} fw={500} fs="14px" lineHeight="24px">
            {training.place.fullAddress}
          </Box>
          <Text display="flex" fs="14px" color="grey.600" as="span" pt={1}>
            {training.place.distance !== null && `${Math.round(training.place.distance)} km(s) du lieu de recherche`}
            {!showTextOnly && (
              <Text ml="auto" as="span" display={["none", "none", "block"]}>
                <Button variant="knowMore" aria-label="Accéder au détail de la formation">
                  En savoir plus
                </Button>
              </Text>
            )}
          </Text>
          {!showTextOnly && (training.place.distance === null || Math.round(training.place.distance) > currentSearchRadius) && scopeContext.isJob && (
            <>{getCenterSearchOnTrainingButton()}</>
          )}
        </Box>
      </Flex>
    </Link>
  )
}

export default Training
