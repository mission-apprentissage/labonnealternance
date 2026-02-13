"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import QRCode from "react-qr-code"
import { NIVEAUX_POUR_LBA } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { LoadingEmptySpace } from "@/components/espace_pro"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import { LbaNew } from "@/theme/components/logos/LbaNew"
import { PAGES } from "@/utils/routes.utils"

const printExactColor = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }

export default function PrintableJobPage() {
  const { jobId } = useParams() as { jobId: string }

  const { data: offre, isLoading } = useQuery({
    queryKey: ["offre"],
    queryFn: () => fetchLbaJobDetails({ id: jobId }),
    enabled: !!jobId,
    gcTime: 0,
  })

  useEffect(() => {
    if (isLoading || !jobId) {
      return
    }
    // window.print()
  }, [isLoading, jobId])

  if (isLoading || !jobId) {
    return <LoadingEmptySpace label="Chargement en cours" />
  }

  return (
    <Box component="main" role="main" sx={{ maxWidth: "21cm", textAlign: "center", py: fr.spacing("3w"), px: fr.spacing("3w") }}>
      <Image style={{ margin: "auto" }} src="/images/espace_pro/images/illustration-impression.svg" width="209" height="95" alt="" aria-hidden={true} />
      <Typography sx={{ mx: "auto", fontSize: "24px", mt: fr.spacing("4w") }}>{offre.company.name}</Typography>
      <Typography
        sx={{
          mx: "auto",
          fontSize: "28px",
          fontWeight: 700,
        }}
      >
        recrute en alternance !
      </Typography>
      <Typography
        sx={{
          mx: "auto",
          fontSize: "32px",
          mt: 7,
          color: "#417DC4",
          fontWeight: 700,
          ...printExactColor,
        }}
      >
        {offre.title}
      </Typography>
      {((offre.target_diploma_level && offre.target_diploma_level !== NIVEAUX_POUR_LBA.INDIFFERENT) || offre.job.jobStartDate) && (
        <Box sx={{ ...printExactColor, backgroundColor: "#F6F6F6", maxWidth: "500px", mx: "auto", mt: 6, p: 6, textAlign: "center" }}>
          {offre.job.jobStartDate && (
            <Typography
              sx={{
                color: "#161616",
                fontSize: "16px",
              }}
            >
              Date de début :{" "}
              <Typography
                component="span"
                sx={{
                  fontWeight: 700,
                }}
              >
                {dayjs(offre.job.jobStartDate).format("DD/MM/YYYY")}
              </Typography>
            </Typography>
          )}
          {offre.target_diploma_level && offre.target_diploma_level !== NIVEAUX_POUR_LBA.INDIFFERENT ? (
            <Typography
              sx={{
                color: "#161616",
                fontSize: "16px",
              }}
            >
              Niveau visé en fin d'études :{" "}
              <Typography
                component="span"
                sx={{
                  fontWeight: 700,
                }}
              >
                {offre.target_diploma_level}
              </Typography>
            </Typography>
          ) : (
            <></>
          )}
        </Box>
      )}
      <Typography
        sx={{
          mt: 6,
          fontWeight: 700,
          mx: "auto",
          color: "#161616",
        }}
      >
        Pour lire plus de détails sur l’offre et postuler
      </Typography>
      <Typography sx={{ ...printExactColor, color: "#417DC4", fontWeight: 700, mx: "auto", mb: 2 }}>Rendez-vous sur La bonne alternance</Typography>
      <QRCode
        value={`${window.location.origin}${PAGES.dynamic
          .jobDetail({
            type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
            jobId,
          })
          .getPath()}?utm_source=lba-phygital&utm_medium=phygital&utm_campaign=offre-phygital`}
        size={128}
        style={{ margin: "auto", height: "auto", maxWidth: "128x", width: "128px" }}
        viewBox={`0 0 128 128`}
      />
      <Typography
        sx={{
          mt: 6,
          fontSize: "12px",
          mx: "auto",
          color: "#161616",
        }}
      >
        Scannez ce QR Code pour voir le détail de l'offre
        <br />
        ou rendez-vous sur{" "}
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
          }}
        >
          labonnealternance.apprentissage.beta.gouv.fr
        </Typography>
      </Typography>
      <LbaNew sx={{ mt: 6, width: "143px", height: "37px" }} />
    </Box>
  )
}
