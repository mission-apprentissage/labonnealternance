import React, { useContext } from "react"

import HeaderForm from "../../components/HeaderForm/HeaderForm"
import LogoIdea from "../../components/LogoIdea/LogoIdea"
import { useRouter } from "next/router"
import { includes } from "lodash"

import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { Box, Flex, Text } from "@chakra-ui/react"

const WidgetHeader = ({ handleSearchSubmit, isHome }) => {
  const router = useRouter()

  const { selectedItem } = useContext(SearchResultContext)

  const handleSearchSubmitFunction = (values) => {
    return handleSearchSubmit({ values })
  }

  const isFicheDetail = selectedItem && includes(router.asPath, "page=fiche") ? true : false
  const formDisplayValue = isFicheDetail ? "none" : isHome ? "block" : ["none", "none", "block"]

  return (
    <Box zIndex={9} display={formDisplayValue} boxShadow={isHome ? "none" : "0 0 12px 2px rgb(0 0 0 / 21%)"} padding="8px">
      <Flex>
        {!isHome && <LogoIdea />}

        <Box>
          {isHome && (
            <Text mb={3} as="h1" fontSize={["26px", "29px"]} fontWeight={700}>
              <Text as="span" display={{ base: "block", md: "inline" }}>
                Se former et travailler{" "}
              </Text>
              <Text as="span" color="info" display={{ base: "block", md: "inline" }}>
                en alternance
              </Text>
            </Text>
          )}
          <HeaderForm handleSearchSubmit={handleSearchSubmitFunction} isHome={isHome} />
        </Box>
      </Flex>
    </Box>
  )
}

export default WidgetHeader
