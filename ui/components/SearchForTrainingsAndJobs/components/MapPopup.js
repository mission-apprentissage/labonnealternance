import React, { useEffect } from "react"

import { getJobAddress } from "../../../utils/jobs"
import { logError } from "../../../utils/tools"
import { ErrorMessage } from "../.."
import { setSelectedMarker } from "../../../utils/mapTools"
import bookIcon from "../../../public/images/icons/book.svg"
import jobIcon from "../../../public/images/icons/job.svg"
import { Box, Button, ChakraProvider, Flex, Image, Text, VStack } from "@chakra-ui/react"
import theme from "../../../theme"

const MapPopup = ({ type, item, handleSelectItem, setSelectedItem, setSelectedMapPopupItem }) => {
  const openItemDetail = (item) => {
    setSelectedItem(item)
    setSelectedMarker(item)
    handleSelectItem(item)
  }

  useEffect(() => {
    setSelectedMapPopupItem(item)
  }, [])

  const getContent = () => {
    try {
      const list = item.items

      if (type === "job") {
        return (
          <Box>
            <Flex ml={4} my={4} alignItems="center" direction="row">
              <Image mr={2} width="24px" src={jobIcon} alt="" />
              <Text as="span" fontSize="16px" fontWeight={700} color="black">
                {`Opportunité${list.length > 1 ? "s" : ""} d'emploi`}
              </Text>
            </Flex>
            <Box mx={4} my={2} mb={4}>
              {getJobAddress(list[0])}
            </Box>
            <Box bg="beige" borderRadius="11px">
              <VStack alignItems="flex-start" px={4} py={2} whiteSpace="pre-wrap" overflow="hidden">
                {list.map((job, idx) => (
                  <Box mb={1} key={idx}>
                    <Button as="a" variant="mapPopupItem" aria-label={`Accéder au détail de l'opportunité d'emploi ${job.title}`} onClick={() => openItemDetail(job)}>
                      {job.title}
                    </Button>
                    {job.ideaType === "peJob" && job?.company?.name && (
                      <Text ml={4} as="span" color="grey.700" fontSize="14px">
                        - {job.company.name}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          </Box>
        )
      } else {
        return (
          <Box>
            <Flex ml={4} my={4} alignItems="center" direction="row">
              <Image mr={2} width="24px" src={bookIcon} alt="" />
              <Text as="span" fontSize="16px" fontWeight={700} color="black">
                Formations :
              </Text>
            </Flex>
            <Box mx={4} my={2}>
              {list[0].company.name}
            </Box>
            <Box mx={4} mt={2} mb={4}>
              {list[0].place.fullAddress}
            </Box>
            <Box background="beige" borderRadius="11px">
              <VStack alignItems="flex-start" px={4} py={2} whiteSpace="pre-wrap" overflow="hidden">
                {getTrainings(list)}
              </VStack>
            </Box>
          </Box>
        )
      }
    } catch (err) {
      logError(`Popup error ${type}`, err)
      console.log("Erreur de format des éléments emplois : ", type, item)
      return (
        <ErrorMessage
          message={
            <Box ml={2}>
              Le format de l&apos;élément sélectionné est erroné.
              <br />
              <br />
              Veuillez accepter nos excuses.
              <br />
              L&apos;équipe Labonnealternance.
            </Box>
          }
        />
      )
    }
  }

  const getTrainings = (list) => {
    let result = (
      <>
        {list.map((training, idx) => (
          <Box mb={1} key={idx}>
            <Button as="a" variant="mapPopupItem" aria-label="Accéder au détail de la formation" onClick={() => openItemDetail(training)}>
              {training.title ? training.title : training.longTitle}
            </Button>
          </Box>
        ))}
      </>
    )
    return result
  }

  return <ChakraProvider theme={theme}>{getContent()}</ChakraProvider>
}

export default MapPopup
