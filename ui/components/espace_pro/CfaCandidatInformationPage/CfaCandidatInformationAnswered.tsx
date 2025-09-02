import { Box, Typography } from "@mui/material"

import { getCurrentDate, getCurrentHourMinute } from "../../../common/utils/dateUtils"

export const CfaCandidatInformationAnswered = (props: { msg: string }) => {
  return (
    <Box sx={{ mt: 4, p: 4, backgroundColor: "#F5F5FE" }}>
      <Typography variant="h2" sx={{ fontWeight: 700, color: "#000091", fontSize: "22px", lineHeight: "36px" }}>
        Votre réponse au candidat
      </Typography>
      <Typography component="p" sx={{ mt: 4, fontWeight: 700, color: "#1E1E1E", fontSize: "18px", lineHeight: "28px" }}>
        Votre réponse a été envoyée !
      </Typography>
      <Typography component="p" sx={{ fontWeight: 700, color: "#666666", fontSize: "16px", lineHeight: "24px" }}>
        Réponse envoyée le {getCurrentDate()} à {getCurrentHourMinute()}
      </Typography>
      <Typography component="p" sx={{ mt: 3, fontWeight: 400, color: "#929292", fontSize: "16px", lineHeight: "24px" }}>
        {props.msg}
      </Typography>
    </Box>
  )
}
