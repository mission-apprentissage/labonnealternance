"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, GlobalStyles, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import Image from "next/image"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import QRCode from "react-qr-code"
import { NIVEAUX_POUR_LBA } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { JOB_START_TYPE } from "shared/models/job.model"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import fetchLbaJobDetails from "@/services/fetch-lba-job-details"
import { PAGES } from "@/utils/routes.utils"

const printExactColor = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }

export default function PrintableJobPage() {
  const { jobId } = useParams() as { jobId: string }
  const searchParams = useSearchParams()
  // Repli sur `source`, ancien nom de print_source (paramètre réservé de Plausible), pour les
  // liens déjà émis (onglets ouverts, favoris).
  const printSource = searchParams.get("print_source") ?? searchParams.get("source")
  const utmCampaign = printSource === "cfa-sharing" ? "mer-cfa-entreprise" : "offre-phygital-sur-affiche"

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

  const isUrgentRecruitment = offre.job.startType === JOB_START_TYPE.DES_QUE_POSSIBLE

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        width: "210mm",
        minHeight: "297mm",
        display: "flex",
        flexDirection: "column",
        pt: fr.spacing("10v"),
        pb: fr.spacing("6v"),
        px: fr.spacing("7v"),
      }}
    >
      {/* Marges du navigateur à zéro : l'affiche occupe toute la feuille et porte ses propres paddings. */}
      <GlobalStyles styles={{ "@page": { size: "A4", margin: 0 } }} />
      <Box component="main" role="main" sx={{ textAlign: "center", mb: fr.spacing("11v") }}>
        <Image style={{ margin: "auto" }} src="/images/espace_pro/images/illustration-impression.svg" width="209" height="95" alt="" aria-hidden={true} />
        <Typography sx={{ mx: "auto", fontSize: "24px", mt: fr.spacing("8v") }}>{offre.company.name}</Typography>
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
            mt: fr.spacing("14v"),
            color: "#417DC4",
            fontWeight: 700,
            ...printExactColor,
          }}
        >
          {offre.title}
        </Typography>
        {((offre.target_diploma_level && offre.target_diploma_level !== NIVEAUX_POUR_LBA.INDIFFERENT) || offre.job.jobStartDate) && (
          <Box sx={{ ...printExactColor, backgroundColor: "#F6F6F6", maxWidth: "500px", mx: "auto", mt: 6, p: 6, textAlign: "center" }}>
            {(offre.job.jobStartDate || isUrgentRecruitment) && (
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
                  {isUrgentRecruitment ? "Démarrage dès que possible" : dayjs(offre.job.jobStartDate).format("DD/MM/YYYY")}
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
            mt: fr.spacing("12v"),
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
            .getPath()}&utm_source=lba-phygital&utm_medium=phygital&utm_campaign=${utmCampaign}`}
          size={128}
          style={{ margin: "auto", height: "auto", maxWidth: "128px", width: "128px" }}
          viewBox={`0 0 128 128`}
        />
        <Typography
          sx={{
            mt: fr.spacing("12v"),
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
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            labonnealternance.apprentissage.beta.gouv.fr
          </Typography>
        </Typography>
      </Box>
      <Box component="footer" sx={{ mt: "auto", height: "61px", px: fr.spacing("9v"), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Le bloc marque DSFR mesure 91,3125 px et ses cotes sont en rem : zoom le ramène aux 61 px de la maquette sans le déformer. */}
          <p className="fr-logo" style={{ zoom: 61 / 91.3125 }}>
            RÉPUBLIQUE
            <br />
            FRANÇAISE
          </p>
          <Image src="/images/logo_LBA.svg" width="145" height="37" alt="La bonne alternance" style={{ marginInline: fr.spacing("6v") }} />
        </Box>
        <Image src="/images/logo_numerique_gouv.svg" width="195" height="55" alt="Un service proposé par numerique.gouv" />
      </Box>
    </Box>
  )
}
