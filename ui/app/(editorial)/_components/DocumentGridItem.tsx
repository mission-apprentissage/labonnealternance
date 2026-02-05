import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import Image from "next/image"
import Card from "@codegouvfr/react-dsfr/Card"

export const DocumentGridItem = ({ title, link }: { title: string; link: string }) => {
  return (
    <Grid
      size={{ md: 4, xs: 12 }}
      sx={{
        backgroundColor: "transparent",
        "& .fr-card__content": {
          paddingTop: fr.spacing("2w"),
          paddingBottom: fr.spacing("4w"),
        },
      }}
    >
      <Card
        title={
          <Box display={"flex"} gap={fr.spacing("3w")} height={"100%"}>
            <Image src={"/images/guides/guide.svg"} width={40} height={40} alt="" />
            <Box display="flex" flexDirection={"column"} gap={1}>
              <Typography component="span" variant="body1" color={fr.colors.decisions.text.title.blueFrance.default} fontWeight={700}>
                {title}
              </Typography>
            </Box>
          </Box>
        }
        border
        style={{
          borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.plain.blueFrance.default}`,
        }}
        linkProps={{
          href: link,
        }}
        size="small"
        enlargeLink
      />
    </Grid>
  )
}
