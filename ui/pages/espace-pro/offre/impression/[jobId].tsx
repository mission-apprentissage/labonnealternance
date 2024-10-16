import { Box, Image, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import QRCode from "react-qr-code"
import { useQuery } from "react-query"
import { NIVEAUX_POUR_LBA } from "shared/constants"
import { getDirectJobPath } from "shared/constants/lbaitem"

import { LoadingEmptySpace } from "@/components/espace_pro"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import { LbaNew } from "@/theme/components/logos"

const printExactColor = { sx: { "-webkit-print-color-adjust": "exact", "print-color-adjust": "exact" } }

export default function PrintableJobPage() {
  const router = useRouter()
  const { jobId } = router.query as { jobId: string }

  const { data: offre, isLoading } = useQuery("offre", () => fetchLbaJobDetails({ id: jobId }), {
    enabled: !!jobId,
    cacheTime: 0,
  })

  if (isLoading || !jobId) {
    return <LoadingEmptySpace label="Chargement en cours" />
  } else {
    setTimeout(() => {
      window.print()
    }, 2000)
  }

  return (
    <Box maxWidth="21cm" textAlign="center" py={12} px={12}>
      <Image mx="auto" src="/images/espace_pro/images/illustration-impression.svg" alt="" aria-hidden={true} />
      <Text mx="auto" fontSize="24px" mt={6}>
        {offre.company.name}
      </Text>
      <Text mx="auto" fontSize="28px" fontWeight={700}>
        recrute en alternance !
      </Text>
      <Text mx="auto" fontSize="32px" mt={7} {...printExactColor} color="pinksoft.600" fontWeight={700}>
        {offre.title}
      </Text>
      {((offre.target_diploma_level && offre.target_diploma_level !== NIVEAUX_POUR_LBA.INDIFFERENT) || offre.job.jobStartDate) && (
        <Box {...printExactColor} backgroundColor="#F6F6F6" maxWidth="500px" mx="auto" mt={6} p={6} textAlign="center">
          {offre.job.jobStartDate && (
            <Text color="#161616" fontSize="16px">
              Date de début :{" "}
              <Text as="span" fontWeight={700}>
                {dayjs(offre.job.jobStartDate).format("DD/MM/YYYY")}
              </Text>
            </Text>
          )}
          {offre.target_diploma_level && offre.target_diploma_level !== NIVEAUX_POUR_LBA.INDIFFERENT ? (
            <Text color="#161616" fontSize="16px">
              Niveau visé en fin d'études :{" "}
              <Text as="span" fontWeight={700}>
                {offre.target_diploma_level}
              </Text>
            </Text>
          ) : (
            <></>
          )}
        </Box>
      )}
      <Text mt={6} fontWeight={700} mx="auto" color="#161616">
        Pour lire plus de détails sur l’offre et postuler
      </Text>
      <Text fontWeight={700} mx="auto" mb={6} {...printExactColor} color="pinksoft.600">
        Rendez-vous sur La bonne alternance
      </Text>
      <QRCode
        value={`${window.location.origin}${getDirectJobPath(jobId)}`}
        size={128}
        style={{ margin: "auto", height: "auto", maxWidth: "128x", width: "128px" }}
        viewBox={`0 0 128 128`}
      />
      <Text mt={6} fontSize="12px" mx="auto" color="#161616">
        Scannez ce QR Code pour voir le détail de l'offre
        <br />
        ou rendez-vous sur{" "}
        <Text as="span" fontWeight={700}>
          labonnealternance.apprentissage.beta.gouv.fr
        </Text>
      </Text>
      <LbaNew mt={6} w="143px" h="37px" />
    </Box>
  )
}
