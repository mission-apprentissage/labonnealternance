import { Box, Card, CardContent, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "../dsfr/DsfrLink"

export const CardForLink = ({ imageUrl, text, link, linkTitle, linkAriaLabel }: { imageUrl: string; text: string; link: string; linkTitle: string; linkAriaLabel?: string }) => {
  return (
    <Card
      sx={{
        p: 2,
        boxShadow: "0px 0px 12px 6px rgba(121, 121, 121, 0.4)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box mr={2} aria-hidden="true">
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
