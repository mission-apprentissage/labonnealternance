import { Box, LinearProgress, Typography } from "@mui/material"
import React, { useEffect, useState } from "react"
import { fr } from "@codegouvfr/react-dsfr"

enum LOADING_ILLUSTRATION_TYPES {
  PARTNER = "PARTNER",
  FORMATION = "FORMATION",
  JOB = "JOB",
}

interface Props {
  isTrainingSearchLoading: boolean
  isJobSearchLoading: boolean
}

const ResultListsLoading = ({ isTrainingSearchLoading, isJobSearchLoading }: Props) => {
  const isLoading = isTrainingSearchLoading || isJobSearchLoading

  const getNextLoadingIllustration = (currentIllustrationIndex: number | null) => {
    // eslint-disable-next-line react-hooks/purity
    const initialIndex = currentIllustrationIndex ?? Math.floor(Math.random() * loadingIllustrations.length)

    // filtered relevant illustrations
    const filteredIllustrationIndexes = loadingIllustrations
      .map((item, index) => {
        if (
          ((item.type === LOADING_ILLUSTRATION_TYPES.JOB && isJobSearchLoading) || (item.type === LOADING_ILLUSTRATION_TYPES.FORMATION && isTrainingSearchLoading)) &&
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
    // eslint-disable-next-line react-hooks/purity
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

  const resultListProperties = {
    color: "grey.700",
    fontWeight: 500,
    fontSize: "18px",
    mt: { xs: 0, sm: 0, md: 2 },
  }

  return (
    <Box
      sx={{
        pt: "0",
      }}
    >
      <Box sx={resultListProperties}>
        {isLoading ? (
          <Box
            sx={{
              textAlign: "center",
            }}
          >
            <Box component="img" src={loadingIllustrations[currentIllustrationIndex].src} aria-hidden={true} alt="" sx={{ margin: "auto", display: "block" }} />
            <Typography sx={{ mt: fr.spacing("2v") }}>{loadingIllustrations[currentIllustrationIndex].text}</Typography>
            <Box sx={{ maxWidth: "400px", mx: "auto", my: 4 }}>
              <LinearProgress sx={{ borderRadius: "20px" }} />
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
