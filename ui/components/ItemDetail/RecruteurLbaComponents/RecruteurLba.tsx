import { Box, Button, Flex, Image, Link, Text } from "@chakra-ui/react"
import { paramCase } from "param-case"
import React, { useState } from "react"
import { oldItemTypeToNewItemType } from "shared/constants/lbaitem"

import { focusWithin } from "@/theme/theme-lba-tools"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { fetchAddresses } from "../../../services/baseAdresse"
import { getSearchQueryParameters } from "../../../utils/getSearchParameters"
import { setSelectedMarker } from "../../../utils/mapTools"
import ItemDetailApplicationsStatus from "../ItemDetailServices/ItemDetailApplicationStatus"
import TagCandidatureSpontanee from "../TagCandidatureSpontanee"

const RecruteurLba = ({ company, handleSelectItem, showTextOnly = undefined, searchForTrainingsOnNewCenter }) => {
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
        <Image mb="2px" mr="5px" src="/images/icons/trainingPin.svg" alt="" />{" "}
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

  const dimItemOnMap = () => {
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

  const actualLink = `/emploi/${oldItemTypeToNewItemType(company.ideaType)}/${company.id}/${paramCase(company.title)}?&${getSearchQueryParameters(formValues)}`

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
      as="a"
      className={`resultCard lba ${company?.contact?.email && "hasEmail"}`}
      {...cardProperties}
      {...focusWithin}
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
              <Box as="h2" color="black" fontSize="1rem" fontWeight={700}>
                {company.company.name}
              </Box>
            </Box>
            <Box my={[1, 1, 1, "0"]} flex="auto" textAlign="right">
              <TagCandidatureSpontanee />
            </Box>
          </Flex>

          <Box as="h3" pt={2} fontWeight={500} fontSize="14px">
            Secteur d'activité : {company?.nafs[0]?.label ?? ""}
          </Box>
          <Box pt={2} fontWeight={500} fontSize="12px">
            {company.place.fullAddress}
          </Box>

          <Box as="span" fontSize="12px" color="grey.600" pt={1}>
            {company.place.distance && <Text display="flex">{company.place.distance} km(s) du lieu de recherche</Text>}
            {!showTextOnly && (
              <Flex mt={4} alignItems="center">
                <Flex alignItems="center">
                  <Image mr={1} src="/images/eclair.svg" alt="" />
                  <Text color="#0063CB" display="flex" fontSize="12px" whiteSpace="nowrap" mr={2}>
                    {company.applicationCount} candidature(s)
                  </Text>
                </Flex>

                <Text ml="auto" display={["none", "none", "block"]}>
                  <Button tabIndex={-1} variant="knowMore" aria-label="Accéder au détail de l'entreprise">
                    En savoir plus
                  </Button>
                </Text>
              </Flex>
            )}
            <ItemDetailApplicationsStatus item={company} mt={2} mb={2} />
          </Box>
          {!showTextOnly && company.place.distance > currentSearchRadius && <>{getCenterSearchOnCompanyButton()}</>}
        </Box>
      </Flex>
    </Link>
  )
}

export default RecruteurLba
