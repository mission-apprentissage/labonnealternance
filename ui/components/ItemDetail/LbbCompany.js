import React, { useState } from "react"
import TagCandidatureSpontanee from "./TagCandidatureSpontanee"
import { fetchAddresses } from "../../services/baseAdresse"
import extendedSearchPin from "../../public/images/icons/trainingPin.svg"
import { get } from "lodash"
import { setSelectedMarker } from "../../utils/mapTools"
import { getItemQueryParameters } from "../../utils/getItemId"
import { getSearchQueryParameters } from "../../utils/getSearchParameters"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { Box, Button, Flex, Image, Link, Text } from "@chakra-ui/react"

const LbbCompany = ({ company, handleSelectItem, showTextOnly, searchForTrainingsOnNewCenter }) => {
  const { selectedMapPopupItem } = React.useContext(SearchResultContext)
  const { formValues } = React.useContext(DisplayContext)

  const currentSearchRadius = formValues?.radius || 30

  const [allowDim, setAllowDim] = useState(true) // cet état évite un appel qui masque la mise en avant de l'icône lors de l'ouverture du détail

  const onSelectItem = (e) => {
    e.preventDefault()
    setAllowDim(false) // fixation du flag
    handleSelectItem(company, company.ideaType)
  }

  const getCenterSearchOnCompanyButton = () => {
    return (
      <Button variant="centerSearch" title="Voir les formations proches" color="#01ac8c" onClick={centerSearchOnCompany}>
        <Image mb="2px" mr="5px" src={extendedSearchPin} alt="" />{" "}
        <Text textDecoration="underline" as="span">
          Voir les formations proches
        </Text>
      </Button>
    )
  }

  const centerSearchOnCompany = async (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    // récupération du code insee manquant depuis la base d'adresse
    if (!company.place.insee) {
      const addresses = await fetchAddresses(company.place.address, "municipality")
      company.place.insee = ""
      company.place.zipCode = ""
      if (addresses.length) {
        company.place.insee = addresses[0].insee
        company.place.zipCode = addresses[0].zipcode
      }
    }

    const newCenter = {
      insee: company.place.insee,
      label: company.place.address,
      zipcode: company.place.zipCode,
      value: {
        type: "Point",
        coordinates: [company.place.longitude, company.place.latitude],
      },
    }

    searchForTrainingsOnNewCenter(newCenter)
  }

  const highlightItemOnMap = () => {
    setSelectedMarker(company)
  }

  const dimItemOnMap = (e) => {
    if (allowDim) {
      setSelectedMarker(null)
    } else {
      setAllowDim(true)
    }
  }

  const shouldBeHighlighted = () => {
    if (selectedMapPopupItem?.ideaType === "job") {
      return selectedMapPopupItem.items.find((item) => {
        return item?.company?.siret === company.company.siret
      })
    } else {
      return false
    }
  }

  const actualLink = `/recherche-apprentissage?display=list&page=fiche&${getItemQueryParameters(company)}&${getSearchQueryParameters(formValues)}`

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
      data-testid={`${company.ideaType}${company.company.siret}`}
    >
      <Flex align="flex-start" id={`${company.ideaType}${company.company.siret}`}>
        <Box flex="1">
          <Flex m="0">
            <Box flex="initial" textAlign="left">
              <Box color="black" fontSize="1rem" fontWeight={700}>
                {company.company.name}
              </Box>
            </Box>
            <Box my={[1, 1, 1, "0"]} flex="auto" textAlign="right">
              <TagCandidatureSpontanee />
            </Box>
          </Flex>

          <Box pt={2} fw={500} fs="14px" lineHeight="24px">
            Secteur d'activité : {get(company, "nafs[0].label", "")}
          </Box>
          <Box pt={2} fw={500} fs="14px" lineHeight="24px">
            {company.place.fullAddress}
          </Box>

          <Text display="flex" fs="14px" color="grey.600" as="span" pt={1}>
            {company.place.distance ? `${company.place.distance} km(s) du lieu de recherche` : ""}
            {showTextOnly ? (
              ""
            ) : (
              <Text ml="auto" as="span" display={["none", "none", "block"]}>
                <Button variant="knowMore">En savoir plus</Button>
              </Text>
            )}
          </Text>
          {showTextOnly ? "" : <>{Math.round(company.place.distance) > currentSearchRadius ? getCenterSearchOnCompanyButton() : ""}</>}
        </Box>
      </Flex>
    </Link>
  )
}

export default LbbCompany
