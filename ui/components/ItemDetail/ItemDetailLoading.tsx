import { LBA_ITEM_TYPE_OLD } from "@/../shared/constants/lbaitem"
import { Box, Image, Progress, SkeletonCircle, SkeletonText, Text } from "@chakra-ui/react"
import React, { useEffect, useState } from "react"

const ItemDetailLoading = ({ item }) => {
  const getNextLoadingIllustration = (currentIllustration) => {
    const currentIndex = loadingIllustrations.findIndex((ill) => ill.src === currentIllustration.src)
    return loadingIllustrations[(currentIndex + 1) % loadingIllustrations.length]
  }

  const loadingIllustrations: { src: string; text: string }[] =
    item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION
      ? [
          {
            src: "/images/loading/training_description.svg",
            text: "Chargement du descriptif de la formation",
          },
          {
            src: "/images/loading/search_training.svg",
            text: "Vérification des coordonnées du centre de formation",
          },
          {
            src: "/images/loading/training_help.svg",
            text: "Lien vers le simulateur d’aides aux alternants",
          },
        ]
      : [
          {
            src: "/images/loading/job_description.svg",
            text: "Chargement du descriptif de l’offre",
          },
          {
            src: "/images/loading/job_contact_info.svg",
            text: "Vérification des coordonnées de l’entreprise",
          },
          {
            src: "/images/loading/job_help.svg",
            text: "Lien vers le simulateur d’aides aux alternants",
          },
        ]

  const [currentIllustration, setCurrentIllustration] = useState(loadingIllustrations[0])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    let iterations = 0
    let current = currentIllustration
    interval = setInterval(() => {
      if (iterations < 5) {
        current = getNextLoadingIllustration(current)
        setCurrentIllustration(current)
      } else {
        setCurrentIllustration({
          src: "/images/loading/hourglass.svg",
          text: "Hum... Ce chargement semble plus long que prévu",
        })
        clearInterval(interval)
      }
      iterations++
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [item.loadedItemDetail, item.id])

  const resultListProperties = {
    color: "grey.425",
    fontWeight: 500,
    fontSize: "18px",
    mt: [0, 0, 2],
  }

  return (
    <Box pt="0">
      <Box {...resultListProperties}>
        <Box textAlign="center">
          <Image margin="auto" src={currentIllustration.src} aria-hidden={true} alt="" />
          <Text mt={1}>{currentIllustration.text}</Text>

          <Box maxWidth="400px" mx="auto" my={4}>
            <Progress colorScheme={item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "teal" : "orange"} isIndeterminate size="sm" borderRadius="20px" />
          </Box>

          <Box padding="6" boxShadow="lg" bg="white">
            <SkeletonCircle size="10" />
            <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default ItemDetailLoading
