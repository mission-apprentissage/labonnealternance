import { Box, Image, Progress, Text } from "@chakra-ui/react"
import React, { useEffect, useState } from "react"

enum LOADING_ILLUSTRATION_TYPES {
  PARTNER = "PARTNER",
  FORMATION = "FORMATION",
  JOB = "JOB",
}

const ResultListsLoading = ({ jobSearchError, partnerJobSearchError, trainingSearchError, isTrainingSearchLoading, isJobSearchLoading, isPartnerJobSearchLoading }) => {
  const isLoading = isTrainingSearchLoading || isJobSearchLoading || isPartnerJobSearchLoading

  const getNextLoadingIllustration = (currentIllustrationIndex: number | null) => {
    const initialIndex = currentIllustrationIndex ?? Math.floor(Math.random() * loadingIllustrations.length)

    // filtered relevant illustrations
    const filteredIllustrationIndexes = loadingIllustrations
      .map((item, index) => {
        if (
          ((item.type === LOADING_ILLUSTRATION_TYPES.PARTNER && isPartnerJobSearchLoading) ||
            (item.type === LOADING_ILLUSTRATION_TYPES.JOB && isJobSearchLoading) ||
            (item.type === LOADING_ILLUSTRATION_TYPES.FORMATION && isTrainingSearchLoading)) &&
          index !== initialIndex
        )
          return index
        else {
          return -1
        }
      })
      .filter((index) => index !== -1)

    if (filteredIllustrationIndexes.length === 0) {
      return initialIndex
    }

    // Select a random index from the filtered indexes
    const randomIndex = Math.floor(Math.random() * filteredIllustrationIndexes.length)

    // Return the original array's index corresponding to the random filtered index
    return filteredIllustrationIndexes[randomIndex]
  }

  const loadingIllustrations: { type: LOADING_ILLUSTRATION_TYPES; src: string; text: string }[] = [
    {
      type: LOADING_ILLUSTRATION_TYPES.PARTNER,
      src: "/images/loading/search_partners.svg",
      text: "Chargement des offres partenaires",
    },
    {
      type: LOADING_ILLUSTRATION_TYPES.JOB,
      src: "/images/loading/search_companies.svg",
      text: "Identification des entreprises qui recrutent",
    },
    {
      type: LOADING_ILLUSTRATION_TYPES.FORMATION,
      src: "/images/loading/search_trainings.svg",
      text: "Tri des formations par métier",
    },
    {
      type: LOADING_ILLUSTRATION_TYPES.FORMATION,
      src: "/images/loading/search_qualiopi.svg",
      text: "Sélection des formations",
    },
  ]

  const [currentIllustrationIndex, setCurrentIllustrationIndex] = useState(isJobSearchLoading ? 0 : 2)

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = getNextLoadingIllustration(currentIllustrationIndex)
      setCurrentIllustrationIndex(nextIndex)
    }, 1000)

    if (!isLoading) {
      clearInterval(interval)
    }

    return () => {
      clearInterval(interval)
    }
  }, [isLoading])

  if (jobSearchError && partnerJobSearchError && trainingSearchError) {
    return <></>
  }

  const resultListProperties = {
    color: "grey.425",
    fontWeight: 500,
    fontSize: "18px",
    mt: [0, 0, 2],
  }

  return (
    <Box pt="0">
      <Box {...resultListProperties}>
        {isLoading ? (
          <Box textAlign="center">
            <Image margin="auto" src={loadingIllustrations[currentIllustrationIndex].src} aria-hidden={true} alt="" />
            <Text mt={1}>{loadingIllustrations[currentIllustrationIndex].text}</Text>
            <Box maxWidth="400px" mx="auto" my={4}>
              <Progress isIndeterminate size="sm" borderRadius="20px" />
            </Box>
          </Box>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  )
}

export default ResultListsLoading
