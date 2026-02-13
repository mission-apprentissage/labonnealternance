import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import Card from "@codegouvfr/react-dsfr/Card"
import { DsfrIcon } from "@/components/DsfrIcon"

export const Conseil = ({ title, href, icon }: { title: string; href: string; icon: string }) => (
  <Grid
    size={12}
    sx={{
      "& .fr-card__content": {
        paddingTop: fr.spacing("4v"),
        paddingBottom: fr.spacing("4v"),
        padding: {
          md: fr.spacing("2v"),
          xs: fr.spacing("2v"),
        },
      },
      "& .fr-card__end": {
        display: "none",
      },
    }}
  >
    <Card
      title={
        <Grid container p={fr.spacing("2v")}>
          <Grid size={{ md: 11, xs: 10 }} display={"flex"} gap={fr.spacing("3v")}>
            <Box my={"auto"}>
              <DsfrIcon name={icon} size={20} color={fr.colors.decisions.text.title.blueFrance.default}></DsfrIcon>
            </Box>
            <Typography component={"h3"} variant="h6">
              {title}
            </Typography>
          </Grid>
          <Grid size={{ md: 1, xs: 2 }} my={"auto"} display={"flex"} alignContent={"end"}>
            <DsfrIcon name="fr-icon-arrow-right-line" size={20} color={fr.colors.decisions.text.title.blueFrance.default} marginLeft={"auto"} />
          </Grid>
        </Grid>
      }
      linkProps={{
        href: href,
      }}
      desc={null}
      horizontal
      border
      background
      shadow
      size="small"
    />
  </Grid>
)
