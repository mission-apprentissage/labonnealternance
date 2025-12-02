import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import React from "react"

interface Props {
  type?: "column" | undefined
  message: string
}

const ErrorMessage = ({ type = undefined, message }: Props) => {
  return (
    <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
      {type === "column" && <Image width={256} height={256} src="/images/icons/searchingPeople.svg" alt="" />}
      <Box
        sx={{
          color: "grey.650",
          display: "flex",
          alignItems: "center",
          background: "#fff1e5",
          borderRadius: "10px",
          fontWeight: 700,
          margin: "10px",
          padding: "5px",
        }}
      >
        <Image width={32} height={32} src="/images/icons/errorAlert.svg" alt="" />
        {message}
      </Box>
      {type === "column" && (
        <Box sx={{ margin: "auto", maxWidth: "75%", textAlign: "center" }}>
          <Typography variant="h3" sx={{ my: fr.spacing("3w") }}>
            Pas de panique !
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>Il y a forcément un résultat qui vous attend, veuillez revenir ultérieurement</Typography>
        </Box>
      )}
    </Box>
  )
}

export default ErrorMessage
