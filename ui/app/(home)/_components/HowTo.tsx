import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

export const HowTo = () => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(2, 1fr)",
        lg: "repeat(3, 1fr)",
      },
      gap: { xs: fr.spacing("2w"), md: fr.spacing("6w"), lg: fr.spacing("15w") },
      borderRadius: "5px",
      px: { xs: fr.spacing("2w"), md: fr.spacing("6w"), lg: 0 },
      alignItems: "flex-start",
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image fetchPriority="high" src="/images/howto1.svg" alt="" unoptimized width={286} height={141} style={{ width: "100%" }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("1w") }}>
        <Typography className={fr.cx("fr-text--bold", "fr-text--lg")}>Le job de vos rêves</Typography>
        <Typography>
          Renseignez
          <Box
            component="span"
            sx={{
              color: fr.colors.decisions.border.default.blueFrance.default,
            }}
            className={fr.cx("fr-text--bold")}
          >
            {" le métier "}
          </Box>
          que vous souhaitez faire et
          <Box
            component="span"
            sx={{
              color: fr.colors.decisions.border.default.blueFrance.default,
            }}
            className={fr.cx("fr-text--bold")}
          >
            {" la localisation "}
          </Box>
          (Ville ou Code postal)
        </Typography>
      </Box>
    </Box>

    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        position: "relative",
      }}
    >
      <Image fetchPriority="high" src="/images/howto2.svg" alt="" unoptimized width={299} height={145} style={{ width: "100%" }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("1w") }}>
        <Typography className={fr.cx("fr-text--bold", "fr-text--lg")}>En un clin d’oeil</Typography>
        <Typography>
          Obtenez en un clin d’oeil la
          <Box
            component="span"
            sx={{
              color: fr.colors.decisions.border.default.blueFrance.default,
            }}
            className={fr.cx("fr-text--bold")}
          >
            {" liste des formations et entreprises proche de chez vous "}
          </Box>
          dans le domaine recherché.
        </Typography>
      </Box>
    </Box>

    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        position: "relative",
      }}
    >
      <Image fetchPriority="high" src="/images/howto3.svg" alt="" unoptimized width={285} height={140} style={{ width: "100%" }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("1w") }}>
        <Typography className={fr.cx("fr-text--bold", "fr-text--lg")}>Un contact facile</Typography>
        <Typography>
          <Box
            component="span"
            sx={{
              color: fr.colors.decisions.border.default.blueFrance.default,
            }}
            className={fr.cx("fr-text--bold")}
          >
            {"Contactez facilement "}
          </Box>
          les centres de formations ou les entreprises pour postuler.
        </Typography>
      </Box>
    </Box>
  </Box>
)
