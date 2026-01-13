import { fr } from "@codegouvfr/react-dsfr"
import { Box, Card, CardContent, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const CardForLink = ({ imageUrl, text, link, linkTitle, linkAriaLabel }: { imageUrl: string; text: string; link: string; linkTitle: string; linkAriaLabel?: string }) => {
  return (
    <Card
      sx={{
        p: fr.spacing("3w"),
        boxShadow: "0px 0px " + fr.spacing("3v") + " " + fr.spacing("1-5v") + " rgba(121, 121, 121, 0.4)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box aria-hidden="true" sx={{ display: { xs: "none", sm: "block" }, mr: fr.spacing("2w") }}>
        <Image src={imageUrl} alt="" width={120} height={90} />
      </Box>
      <CardContent sx={{ p: 0 }}>
        <Typography fontWeight="bold" gutterBottom>
          {text}
        </Typography>
        <DsfrLink href={link} aria-label={linkAriaLabel}>
          {linkTitle}
        </DsfrLink>
      </CardContent>
    </Card>
  )
}
