import { LBA_ITEM_TYPE_OLD } from "@/../shared/constants/lbaitem"
import { Box, Image, Progress, SkeletonCircle, SkeletonText, Text } from "@chakra-ui/react"
import "./ItemDetailLoading.css"

const ItemDetailLoading = ({ type }) => {
  const loadingIllustrations =
    type === LBA_ITEM_TYPE_OLD.FORMATION
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
          <Box className="loading-animation">
            {loadingIllustrations.map((item, index) => (
              <div key={index} className="loading-item">
                <Image margin="auto" src={item.src} aria-hidden={true} alt="" />
                <Text mt={1}>{item.text}</Text>
              </div>
            ))}
            <div className="loading-item">
              <Image margin="auto" src="/images/loading/hourglass.svg" aria-hidden={true} alt="" />
              <Text mt={1}>Hum... Ce chargement semble plus long que prévu</Text>
            </div>
          </Box>

          <Box maxWidth="400px" mx="auto" my={4}>
            <Progress colorScheme={type === LBA_ITEM_TYPE_OLD.FORMATION ? "teal" : "orange"} isIndeterminate size="sm" borderRadius="20px" />
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
