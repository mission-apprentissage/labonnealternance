import React from "react"

import refreshSearchOnMap from "public/images/icons/refreshSearchOnMap.svg"
import lookingGlassOnMap from "public/images/glass.svg"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { Box, Button, Flex, Image, Text } from "@chakra-ui/react"

const MapSearchButton = ({ handleSearchClick }) => {
  const { formValues } = React.useContext(DisplayContext)
  const { hasSearch } = React.useContext(SearchResultContext)

  const buttonContainerStyleParameters = {
    zIndex: 1,
    position: "absolute",
    width: "260px",
    margin: "0 auto",
    left: 0,
    right: 0,
    top: "2rem",
  }

  const buttonStyleParameters = {
    backgroundColor: "white",
    fontSize: "14px",
    color: "grey.700",
    fontWeight: 400,
    borderRadius: "58px",
    border: "none",
    padding: "8px 15px",
    margin: "auto",
    boxShadow: "0px 0px 12px 6px rgba(121, 121, 121, 0.4)",
  }

  return hasSearch ? (
    <Box {...buttonContainerStyleParameters}>
      <Button {...buttonStyleParameters} onClick={handleSearchClick} title="Lancer une rechercher centrée sur la carte">
        <Flex alignItems="center">
          {formValues ? (
            <>
              <Image src={refreshSearchOnMap} alt="" />
              <Text as="span" marginLeft={2}>
                Rechercher dans cette zone
              </Text>
            </>
          ) : (
            <>
              <Image src={lookingGlassOnMap} alt="" />
              <Text as="span" marginLeft={2}>
                Lancer une recherche
              </Text>
            </>
          )}
        </Flex>
      </Button>
    </Box>
  ) : (
    ""
  )
}

export default MapSearchButton
