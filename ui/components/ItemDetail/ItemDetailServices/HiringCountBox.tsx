import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

export const HiringCountBox = ({ hiringCount3Years }: { hiringCount3Years: number }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      border: "solid 1px #DDDDDD",
      borderRadius: "8px",
      gap: fr.spacing("1v"),
      padding: fr.spacing("4v"),
      backgroundColor: "white",
    }}
  >
    <Image src="/images/icons/hirings.png" alt="" width={24} height={24} />
    <Typography sx={{ fontWeight: 700 }}>Cette entreprise a recruté {hiringCount3Years} alternant(s) sur les 3 dernières années</Typography>
  </Box>
)

export default HiringCountBox
