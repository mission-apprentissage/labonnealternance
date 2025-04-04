import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

export function RechercheResultatsPlaceholder() {
  return (
    <Box
      sx={{
        pt: fr.spacing("6w"),
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: fr.spacing("4w"),
        justifyContent: "center",
      }}
    >
      <Image src="/images/dosearch.svg" width={269} height={216} alt="" aria-hidden="true" unoptimized />

      <Box>
        <Box>
          <Typography variant="h1">
            Trouvez votre{" "}
            <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
              alternance
            </Box>
          </Typography>
          <Typography className={fr.cx("fr-text--lead")}>
            Démarrez une recherche pour trouver votre
            <br />
            formation ou votre emploi en alternance
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
