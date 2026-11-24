import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

/**
 * Carte d'une édition, qui mène à sa lecture sur LinkedIn. Le visuel est décoratif (aria-hidden) :
 * le titre et la date, présents en texte dans la carte, en portent l'information (RGAA 1.2).
 */
export function NewsletterCard({ title, date, href }: { title: string; date: string; href: string }) {
  return (
    <div className={fr.cx("fr-card", "fr-enlarge-link")} style={{ width: "100%" }}>
      <div className={fr.cx("fr-card__body")}>
        <div className={fr.cx("fr-card__content")}>
          <h3 className={fr.cx("fr-card__title")}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {title}
              <span className="fr-sr-only"> - nouvelle fenêtre</span>
            </a>
          </h3>
          <p className={fr.cx("fr-card__desc")}>Lire sur LinkedIn</p>
          <div className={fr.cx("fr-card__start")}>
            <p className={fr.cx("fr-card__detail")}>Édition du {date}</p>
          </div>
        </div>
      </div>
      <div className={fr.cx("fr-card__header")}>
        <Box
          aria-hidden="true"
          sx={{
            aspectRatio: "16 / 9",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: fr.spacing("6v"),
            backgroundColor: fr.colors.decisions.background.actionHigh.blueFrance.default,
            color: fr.colors.decisions.text.inverted.grey.default,
          }}
        >
          <Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            La lettre de l'alternance
          </Typography>
          <Typography component="span" sx={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.25 }}>
            {date}
          </Typography>
        </Box>
      </div>
    </div>
  )
}
