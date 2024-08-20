import { Box, Image, Progress, Text } from "@chakra-ui/react"
import React, { /*useContext,*/ useEffect, useState } from "react"

// import { ScopeContext } from "../../../context/ScopeContext"

enum LOADING_ILLUSTRATION_TYPES {
  PARTNER = "PARTNER",
  FORMATION = "FORMATION",
  JOB = "JOB",
}

const ResultListsLoadingIllustration = ({ isTrainingSearchLoading, isJobSearchLoading, isPartnerJobSearchLoading }) => {
  // console.log("inside ? ", isTrainingSearchLoading, isJobSearchLoading, isPartnerJobSearchLoading)

  // const scopeContext = useContext(ScopeContext)

  const getNextLoadingIllustration = (currentIllustrationIndex: number | null) => {
    //if (scopeContext.isJob && (isJobSearchLoading || isPartnerJobSearchLoading)) {
    //scopeContext.isTraining && isTrainingSearchLoading
    const initialIndex = currentIllustrationIndex ?? Math.floor(Math.random() * loadingIllustrations.length)

    const filteredIndexes = loadingIllustrations
      .map((item, index) => {
        if (
          (item.type === LOADING_ILLUSTRATION_TYPES.PARTNER && isPartnerJobSearchLoading) ||
          (item.type === LOADING_ILLUSTRATION_TYPES.JOB && isJobSearchLoading) ||
          (item.type === LOADING_ILLUSTRATION_TYPES.FORMATION && isTrainingSearchLoading)
        )
          return index
        else {
          return -1
        }
      })
      .filter((index) => index !== -1)

    if (filteredIndexes.length === 0) {
      return initialIndex
    }

    // Select a random index from the filtered indexes
    const randomIndex = Math.floor(Math.random() * filteredIndexes.length)

    // Return the original array's index corresponding to the random filtered index
    return filteredIndexes[randomIndex]
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

  const [currentIllustrationIndex, setCurrentIllustrationIndex] = useState(0)

  const isLoading = isTrainingSearchLoading || isJobSearchLoading || isPartnerJobSearchLoading

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    // console.log("là ? ? ", isLoading, isTrainingSearchLoading, isJobSearchLoading, isPartnerJobSearchLoading, currentIllustrationIndex, "interval = ", interval)

    if (isLoading) {
      // Start changing the illustration every second
      interval = setInterval(() => {
        const nextIndex = getNextLoadingIllustration(currentIllustrationIndex)

        console.log("chicha ? ", nextIndex)

        setCurrentIllustrationIndex(nextIndex)
      }, 500)
    } else if (!isLoading && interval) {
      // Clear the interval when loading is done
      // console.log("ouf ? ", interval)
      clearInterval(interval)
    }

    return () => {
      // console.log("ZTHERE", "interval=", interval)
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTrainingSearchLoading, isJobSearchLoading, isPartnerJobSearchLoading])

  return isLoading && currentIllustrationIndex !== null ? (
    <>
      <Image margin="auto" src={loadingIllustrations[currentIllustrationIndex].src} aria-hidden={true} alt="" />
      <Text>{loadingIllustrations[currentIllustrationIndex].text}</Text>
    </>
  ) : (
    <></>
  )
}

const ResultListsLoading = ({ jobSearchError, partnerJobSearchError, trainingSearchError, isTrainingSearchLoading, isJobSearchLoading, isPartnerJobSearchLoading }) => {
  const isLoading = isTrainingSearchLoading || isJobSearchLoading || isPartnerJobSearchLoading

  // console.log("ici ? ", isLoading, isTrainingSearchLoading, isJobSearchLoading, isPartnerJobSearchLoading)

  if (jobSearchError && partnerJobSearchError && trainingSearchError) {
    return <></>
  }

  //if (scopeContext.isJob && (isJobSearchLoading || isPartnerJobSearchLoading)) {
  //scopeContext.isTraining && isTrainingSearchLoading

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
            <ResultListsLoadingIllustration
              isTrainingSearchLoading={isTrainingSearchLoading}
              isJobSearchLoading={isJobSearchLoading}
              isPartnerJobSearchLoading={isPartnerJobSearchLoading}
            />
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
