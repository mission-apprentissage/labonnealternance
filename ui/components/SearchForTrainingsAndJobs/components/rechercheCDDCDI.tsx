"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import React, { useEffect, useState } from "react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { fetchAddressFromCoordinates } from "@/services/baseAdresse"

type RechercheCDICDDProps = { romes: string[]; geo: { longitude?: number; latitude?: number; radius?: number } | null }

const FT_BASE_URL = "https://candidat.francetravail.fr/offres/recherche?typeContrat=CDI,CDD&offresPartenaires=true&tri=0"

const buildFtUrl = async (props: RechercheCDICDDProps) => {
  let ftUrl = FT_BASE_URL

  if (props.romes.length > 0) {
    ftUrl += `&motsCles=${props.romes.join(",")}`
  }

  if (props.geo && props.geo.longitude && props.geo.latitude && props.geo.radius) {
    const results = await fetchAddressFromCoordinates([props.geo.longitude, props.geo.latitude], "municipality")

    if (results.length > 0) {
      ftUrl += `&lieux=${results[0].insee}&rayon=${props.geo.radius}`
    }
  }

  return ftUrl
}

const RechercheCDICDD = (props: RechercheCDICDDProps) => {
  const [url, setUrl] = useState(FT_BASE_URL)

  useEffect(() => {
    buildFtUrl(props).then((u) => setUrl(u))
  }, [props.romes, props.geo])

  return (
    <Box
      sx={{
        py: fr.spacing("3w"),
        px: fr.spacing("9w"),
        backgroundColor: fr.colors.decisions.background.contrast.info.default,
        display: "grid",
        gridTemplateColumns: {
          md: "1fr max-content",
          sm: "1fr",
        },
      }}
    >
      <Box>
        <Typography color={fr.colors.decisions.text.mention.grey.default}>
          Les opportunités sur notre site se limitent à des contrats en alternance mais ne vous arrêtez pas là.{" "}
        </Typography>
        <Typography
          fontWeight={700}
          sx={{
            my: fr.spacing("3v"),
          }}
        >
          Certaines entreprises proposent d’autres types de contrats, soumettez-leur l'idée de vous recruter en alternance.
        </Typography>
        <DsfrLink href={url}>Voir les offres France Travail</DsfrLink>
      </Box>
      <Box
        sx={{
          display: {
            sm: "none",
            md: "block",
          },
        }}
      >
        <Image width={200} height={136} src="/images/recherche_cdd_cdi.svg" aria-hidden="true" alt="" />
      </Box>
    </Box>
  )
}

export default RechercheCDICDD
