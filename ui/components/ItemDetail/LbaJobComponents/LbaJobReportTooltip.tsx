import { Box, Typography } from "@mui/material"

const LbaJobReportTooltip = () => {
  return (
    <Box sx={{ p: 1 }}>
      <Typography sx={{ fontSize: "16px", lineHeight: "24px", fontWeight: "700", marginBottom: "8px", color: "#161616" }}>
        Cette offre vous semble inappropriée ? Voici les raisons pour lesquelles vous pouvez nous signaler une offre :
      </Typography>
      <ul>
        <li>Offre offensante ou discriminatoire</li>
        <li>Offre inexacte ou expirée</li>
        <li>Fausse offre provenant d'un centre de formation</li>
        <li>Tentative d'escroquerie</li>
        <li>Offre ne relevant pas du champ de l’alternance (CDI, stage, etc.)</li>
      </ul>
    </Box>
  )
}

export default LbaJobReportTooltip
