import { Box, Button, Flex, Image, Link, Text } from "@chakra-ui/react"
import React, { useContext, useState } from "react"
import { buildTrainingUrl } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { focusWithin } from "@/theme/theme-lba-tools"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { ScopeContext } from "../../context/ScopeContext"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { fetchAddresses } from "../../services/baseAdresse"
import { getSearchQueryParameters } from "../../utils/getSearchParameters"
import { setSelectedMarker } from "../../utils/mapTools"

import ItemDetailApplicationsStatus from "./ItemDetailServices/ItemDetailApplicationStatus"
import TagCfaDEntreprise from "./TagCfaDEntreprise"
import TagFormation from "./TagFormation"

const Training = ({ training, handleSelectItem, showTextOnly = undefined, searchForJobsOnNewCenter, isCfa }) => {
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
    if (selectedMapPopupItem?.ideaType === LBA_ITEM_TYPE_OLD.FORMATION) {
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
        <Image mb="2px" mr="5px" src="/images/icons/jobPin.svg" alt="" />{" "}
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

  const dimItemOnMap = () => {
    if (allowDim) {
      setSelectedMarker(null)
    } else {
      setAllowDim(true)
    }
  }

  const actualLink = `${buildTrainingUrl(training.id, training.title)}?${getSearchQueryParameters(formValues)}`

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

  return (
    // @ts-expect-error: TODO
    <Link
      {...focusWithin}
      as="a"
      className="resultCard training"
      {...cardProperties}
      onClick={onSelectItem}
      onMouseOver={highlightItemOnMap}
      onMouseOut={dimItemOnMap}
      href={actualLink}
    >
      <Flex align="flex-start" id={`id${training.id}`}>
        <Box flex="1">
          <Flex m="0">
            <Box flex="initial" textAlign="left">
              <Box color="black" as="h2" fontSize="1rem" fontWeight={700}>
                {training.title ? training.title : training.longTitle}
              </Box>
            </Box>
            <Box my={[1, 1, 1, "0"]} flex="auto" textAlign="right">
              {isCfa ? <TagCfaDEntreprise /> : <TagFormation />}
            </Box>
          </Flex>

          <Box as="h3" pt={[4, 4, 4, 1]} fontWeight={500} fontSize="14px">
            {training.company.name}
          </Box>
          <Box pt={2} fontWeight={500} fontSize="12px">
            {training.place.fullAddress}
          </Box>
          <Text display="flex" fontSize="12px" color="grey.600" as="span" pt={1}>
            {training?.place?.distance !== null && `${training.place.distance} km(s) du lieu de recherche`}
            {!showTextOnly && (
              <Text mt={4} ml="auto" as="span" fontSize="14px" display={["none", "none", "block"]}>
                <Button tabIndex={-1} variant="knowMore" aria-label="Accéder au détail de la formation">
                  En savoir plus
                </Button>
              </Text>
            )}
          </Text>
          {!showTextOnly && (training.place.distance === null || training.place.distance > currentSearchRadius) && scopeContext.isJob && <>{getCenterSearchOnTrainingButton()}</>}
          <ItemDetailApplicationsStatus item={training} mt={2} mb={2} />
        </Box>
      </Flex>
    </Link>
  )
}

export default Training
