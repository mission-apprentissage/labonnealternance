import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import React from "react"

const CandidatureLbaMandataireMessage = ({ item }) => {
  return (
    item?.company?.mandataire && (
      <Box sx={{ display: "flex", flexDirection: "row", width: "95%", alignItems: "center" }}>
        <Image src="/images/info.svg" alt="" aria-hidden="true" width={20} height={20} />
        <Typography sx={{ ml: fr.spacing("2v") }}>Votre candidature sera envoyée au centre de formation en charge du recrutement pour le compte de l&apos;entreprise.</Typography>
      </Box>
    )
  )
}

export default CandidatureLbaMandataireMessage
