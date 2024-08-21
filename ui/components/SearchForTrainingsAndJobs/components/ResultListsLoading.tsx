import { Box, Image, Progress, Text } from "@chakra-ui/react"
import React, { useRef, useState } from "react"

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
      text: "Sélection des formations Qualiopi",
    },
  ]

  const [currentIllustrationIndex, setCurrentIllustrationIndex] = useState(isJobSearchLoading ? 0 : 2)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startInterval = () => {
    // typeof window... ensures that interval is not created server side
    if (typeof window !== "undefined" && isLoading && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        const nextIndex = getNextLoadingIllustration(currentIllustrationIndex)

        setCurrentIllustrationIndex(nextIndex)
      }, 1000)
    }
  }

  const stopInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  if (!isLoading && intervalRef.current !== null) {
    stopInterval()
  }

  if (isLoading && intervalRef.current === null) {
    startInterval()
  }

  if (jobSearchError && partnerJobSearchError && trainingSearchError) {
    return <></>
  }

  const resultListProperties = {
    textAlign: "left",
    marginLeft: "10px",
    color: "grey.650",
    fontWeight: 600,
    fontSize: "22px",
    marginBottom: "0px",
    padding: "0 20px",
    mt: [0, 0, 2],
  }

  return (
    <Box pt="0">
      {/* @ts-expect-error: TODO */}
      <Box {...resultListProperties}>
        {isLoading ? (
          <Box textAlign="center">
            <Image margin="auto" src={loadingIllustrations[currentIllustrationIndex].src} aria-hidden={true} alt="" />
            <Text>{loadingIllustrations[currentIllustrationIndex].text}</Text>
            <Box maxWidth="400px" margin="auto">
              <Progress width="80%" isIndeterminate size="sm" borderRadius="20px" />
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
