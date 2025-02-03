import { Box, Button, Flex, Image, Text } from "@chakra-ui/react"
import React from "react"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"

const MapListSwitchButton = ({ showResultMap, showResultList, isFormVisible }) => {
  const { hasSearch } = React.useContext(SearchResultContext)
  const { visiblePane } = React.useContext(DisplayContext)

  const floatingButtonProperties = {
    position: "fixed",
    bottom: ["2.5rem", "1.5rem"],
    left: "50%",
    right: ["unset", "40%"],
    transform: "translateX(-40%)",
    minWidth: "110px",
  }

  const buttonProperties = {
    cursor: "pointer",
    marginRight: "2rem",
    backgroundColor: "grey.750",
    fontSize: "14px",
    fontWeight: 700,
    color: "white",
    borderRadius: "19px",
    border: "none",
    padding: "10px 20px",
    minWidth: "110px",
    _focus: {
      boxShadow: "none",
    },
    _hover: {
      backgroundColor: "grey.750",
    },
  }

  const resultListFloatingButtonDisplayProperty = isFormVisible ? "none" : ["block", "block", "none"]
  const mapFloatingButtonDisplayProperty = ["block", "block", "none"]

  if (visiblePane === "resultList") {
    if (hasSearch)
      return (
        // @ts-expect-error: TODO
        <Box display={resultListFloatingButtonDisplayProperty} {...floatingButtonProperties}>
          <Button {...buttonProperties} onClick={showResultMap} title="Afficher la carte">
            <Flex alignItems="center">
              <Image src="/images/icons/toggleCard.svg" alt="" />
              <Text as="span" marginLeft={2}>
                Carte
              </Text>
            </Flex>
          </Button>
        </Box>
      )
    else return ""
  } else {
    return (
      // @ts-expect-error: TODO
      <Box display={mapFloatingButtonDisplayProperty} {...floatingButtonProperties}>
        {hasSearch ? (
          <Button {...buttonProperties} onClick={showResultList} title="Afficher la liste">
            <Flex alignItems="center">
              <Image src="/images/icons/toggleList.svg" alt="" />
              <Text as="span" marginLeft={2}>
                Liste
              </Text>
            </Flex>
          </Button>
        ) : (
          ""
        )}
      </Box>
    )
  }
}

export default MapListSwitchButton
