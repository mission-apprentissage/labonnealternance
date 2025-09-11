import { Box, Typography } from "@mui/material"
import Image from "next/image"
import React from "react"

const CandidatureLbaMandataireMessage = ({ item }) => {
  return (
    item?.company?.mandataire && (
      <Box sx={{ display: "flex", flexDirection: "row", width: "95%", alignItems: "center" }}>
        <Image src="/images/info.svg" alt="" width={20} height={20} />
        <Typography sx={{ ml: 3 }}>Votre candidature sera envoyée au centre de formation en charge du recrutement pour le compte de l&apos;entreprise.</Typography>
      </Box>
    )
  )
}

export default CandidatureLbaMandataireMessage
