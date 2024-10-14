import { Box, Image, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { useQuery } from "react-query"

import { LoadingEmptySpace } from "@/components/espace_pro"
import { getOffre } from "@/utils/api"

export default function PrintableJobPage() {
  const router = useRouter()
  const { jobId } = router.query as { jobId: string }

  const { data: offre, isLoading } = useQuery("offre", () => getOffre(jobId), {
    enabled: !!jobId,
    cacheTime: 0,
  })

  if (isLoading || !jobId) return <LoadingEmptySpace label="Chargement en cours" />

  return (
    <Box maxWidth="21cm" textAlign="center" py={12} px={12}>
      <Image mx="auto" src="/images/espace_pro/images/illustration-impression.svg" alt="" aria-hidden={true} />
      <Text mx="auto" fontSize="24px" mt={6}>
        {}
      </Text>
      <Text mx="auto" fontSize="28px" fontWeight={700}>
        recrute en alternance !
      </Text>
      <Text mx="auto" fontSize="32px" mt={8} color="pinksoft.600" fontWeight={700}>
        {offre.rome_appellation_label}
      </Text>
      <Box backgroundColor="#F6F6F6" maxWidth="500px" mx="auto" mt={6} p={6} textAlign="center">
        <Text color="#161616" fontSize="16px">
          Date de début :{" "}
          <Text as="span" fontWeight={700}>
            {dayjs(offre.job_start_date).format("DD/MM/YYYY")}
          </Text>
        </Text>
        <Text color="#161616" fontSize="16px">
          Niveau visé en fin d'études :{" "}
          <Text as="span" fontWeight={700}>
            {offre.job_level_label}
          </Text>
        </Text>
      </Box>
      <Text mt={6} fontWeight={700} mx="auto" color="#161616">
        Pour lire plus de détails sur l’offre et postuler
      </Text>
      <Text fontWeight={700} mx="auto" color="pinksoft.600">
        Rendez-vous sur La bonne alternance
      </Text>
      <Text mt={6} fontSize="12px" mx="auto" color="#161616">
        Scannez ce QR Code pour voir le détail de l'offre
      </Text>
    </Box>
  )
}
