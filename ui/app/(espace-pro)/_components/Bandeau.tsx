import { fr } from "@codegouvfr/react-dsfr"
import { Alert, type AlertProps } from "@codegouvfr/react-dsfr/Alert"
import { Box, Link } from "@mui/material"

export type BandeauProps = {
  header: React.ReactNode
  description: React.ReactNode
  lien?: string
  type: "success" | "error"
  titleAs?: AlertProps["as"] | "p"
}

// Taille DSFR du titre d'alerte, que DepotSimplifieStyling écraserait sur un h2
export const alertTitleSx = { fontSize: "1.125rem", lineHeight: "1.5rem" }

export const Bandeau = ({ header, description, lien = null, type, titleAs = "h2" }: BandeauProps) => {
  const descriptionContent = (
    <>
      {description}
      {lien && (
        <Link
          underline="always"
          href={lien}
          color="inherit"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            ml: fr.spacing("2v"),
          }}
        >
          {lien}
          <span className="fr-sr-only"> - nouvelle fenêtre</span>
        </Link>
      )}
    </>
  )

  return (
    <Box
      sx={{
        mb: fr.spacing("2v"),
        // Couleur des titres DSFR, qu'un titre rendu en <p> n'hérite pas
        "& .fr-alert__title": { ...alertTitleSx, color: fr.colors.decisions.text.title.grey.default },
      }}
    >
      {/* Le typage d'Alert n'accepte que des hx, mais le composant rend la balise passée telle quelle. */}
      <Alert
        as={titleAs as AlertProps["as"]}
        severity={type === "success" ? "success" : "error"}
        role={type === "success" ? "status" : "alert"}
        title={header}
        description={descriptionContent}
      />
    </Box>
  )
}
