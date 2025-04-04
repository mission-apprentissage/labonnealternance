"use client"

import { Box, Flex, Image, Spinner, Text } from "@chakra-ui/react"
import { Link } from "@mui/material"
import { useEffect, useState } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { cancelOffre, cancelPartnerJob, fillOffre, providedPartnerJob } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const jobActions = {
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: {
    cancel: cancelOffre,
    provided: fillOffre,
  },
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: {
    cancel: cancelPartnerJob,
    provided: providedPartnerJob,
  },
}

export function OffreActionPage({
  jobId,
  action: actionName,
  token,
  jobType,
}: {
  jobId: string
  action: "cancel" | "provided"
  token: string
  jobType: Exclude<LBA_ITEM_TYPE, LBA_ITEM_TYPE.FORMATION>
}) {
  const [result, setResult] = useState("")

  useEffect(() => {
    if (!jobId || !actionName || !jobType) return

    const action = jobActions[jobType]?.[actionName]
    if (action && typeof action === "function") {
      action(jobId, token)
        .then(() => setResult("ok"))
        .catch((error) => {
          console.error(error)
          setResult("Une erreur s'est produite. Merci de contacter le support de La bonne alternance")
          return
        })
    } else {
      setResult("Unsupported action.")
    }
  }, [jobId, actionName, jobType, token])

  const cssParameters = {
    background: "#fff1e5",
    borderRadius: "10px",
    fontWeight: 700,
    margin: "10px",
    marginTop: "32px",
    padding: "5px",
  }

  return (
    <Box margin="auto">
      {actionName === "cancel" && (
        <Text as="h1" variant="homeEditorialH1">
          Annulation de l'offre déposée sur La bonne alternance
        </Text>
      )}
      {actionName === "provided" && (
        <Text as="h1" variant="homeEditorialH1">
          Modification de l'offre déposée sur La bonne alternance
        </Text>
      )}

      {!result && (
        <Box my={8}>
          <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
          <Text>Chargement en cours...</Text>
        </Box>
      )}
      {result && result !== "ok" && (
        <Flex alignItems="center" {...cssParameters} color="grey.650">
          <Image width="32px" mr={2} src="/images/icons/errorAlert.svg" alt="" />
          {result}
        </Flex>
      )}
      {result && result === "ok" && <Text variant="homeEditorialH2">Votre offre a été modifiée</Text>}

      <Box mt={8}>
        Aller sur le site{" "}
        <Link href={PAGES.static.home.getPath()} aria-label="Accès au site La bonne alternace" fontWeight={700}>
          La bonne alternance
        </Link>
        <br />
        <br />
        Se connecter à votre{" "}
        <Link href={PAGES.static.authentification.getPath()} aria-label="Accès à la page de connexion" fontWeight={700}>
          espace recruteur
        </Link>
        <br />
        <br />
        {jobId && (
          <>
            Voir{" "}
            <Link href={PAGES.dynamic.jobDetail({ type: jobType, jobId }).getPath()} aria-label="Visualiser l'offre en ligne" fontWeight={700}>
              l'offre
            </Link>{" "}
            sur le site La bonne alternance
          </>
        )}
      </Box>
    </Box>
  )
}
