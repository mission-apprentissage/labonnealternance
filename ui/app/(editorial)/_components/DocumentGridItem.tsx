import { fr } from "@codegouvfr/react-dsfr"
import Card from "@codegouvfr/react-dsfr/Card"
import { Box, Grid, Typography } from "@mui/material"
import Image from "next/image"

export const DocumentGridItem = ({
  title,
  link,
  download,
  format,
}: {
  title: string
  link: string
  download?: string
  /** Format et poids du document, quand le lien pointe un fichier et non une page (RGAA 13.3/13.4). */
  format?: string
}) => {
  return (
    <Grid
      size={{ md: 4, xs: 12 }}
      sx={{
        backgroundColor: "transparent",
        "& .fr-card__content": {
          paddingTop: fr.spacing("4v"),
          paddingBottom: fr.spacing("8v"),
        },
      }}
    >
      <Card
        title={
          <Box display={"flex"} gap={fr.spacing("6v")} height={"100%"}>
            <Image src={"/images/guides/guide.svg"} width={40} height={40} alt="" />
            <Box display="flex" flexDirection={"column"} gap={fr.spacing("2v")}>
              <Typography component="span" variant="body1" color={fr.colors.decisions.text.title.blueFrance.default} fontWeight={"bold"}>
                {title}
                {/* RGAA 6.1 : avec enlargeLink, ce titre est le nom accessible du lien de la carte.
                    Les documents consultés en ligne ouvrent un onglet, il faut l'annoncer. */}
                {!download && <span className="fr-sr-only"> - nouvelle fenêtre</span>}
              </Typography>
              {format && (
                <Typography component="span" variant="caption" color={fr.colors.decisions.text.mention.grey.default}>
                  {format}
                </Typography>
              )}
            </Box>
          </Box>
        }
        border
        style={{
          borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.plain.blueFrance.default}`,
        }}
        linkProps={{
          href: link,
          ...(download ? { download } : { target: "_blank", rel: "noopener noreferrer" }),
        }}
        size="small"
        enlargeLink
      />
    </Grid>
  )
}
