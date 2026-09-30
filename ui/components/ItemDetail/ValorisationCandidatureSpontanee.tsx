import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import NextLink from "next/link"
import { useEffect, useState } from "react"
import { buildRecruteursLbaSearchUrl } from "@/app/(candidat)/(recherche)/recherche/_utils/search-legacy-utils"
import { classNames } from "@/utils/class-names"
import { TagCandidatureSpontanee } from "./TagCandidatureSpontanee"

const TITLE = "Plus de 60% des recrutements en alternance se font sans qu’aucune offre n’ait été déposée."
const ACTION_LABEL = " - Voir les entreprises à contacter pour une candidature spontanée"

export const ValorisationCandidatureSpontanee = ({
  overridenQueryParams = {},
  onClick,
  disabled,
}: {
  overridenQueryParams?: Record<string, string>
  onClick?: () => void
  disabled?: boolean
}) => {
  // Calculée après le montage : elle dépend de window.location, absent au rendu serveur, et un
  // écart serveur/client sur un attribut n'est pas corrigé à l'hydratation.
  const [searchHref, setSearchHref] = useState<string | null>(null)

  useEffect(() => {
    // Rejoue la recherche d'origine (?from= du nouveau moteur, ou paramètres legacy d'un lien
    // encore en circulation) en cochant « entreprises à contacter ». Sans contexte de recherche,
    // le bloc reste non cliquable : envoyer sur une page de résultats nue n'aiderait personne.
    const searchUrl = buildRecruteursLbaSearchUrl(window.location.href)
    if (searchUrl === null || disabled) {
      setSearchHref(null)
      return
    }
    const url = new URL(searchUrl, window.location.origin)
    Object.entries(overridenQueryParams).forEach(([key, value]) => url.searchParams.set(key, value))
    setSearchHref(url.pathname + url.search)
  }, [overridenQueryParams, disabled])

  const isInteractive = searchHref !== null
  // Le lien (ou le bouton) porte le titre et son ::before couvre tout le bloc, qui reste
  // cliquable en entier avec un focus visible (motif fr-enlarge-link du DSFR).
  const titleContent = !isInteractive ? (
    TITLE
  ) : onClick ? (
    // Déjà sur la page de recherche : scroll direct sans navigation
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{ p: 0, border: "none", background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}
    >
      {TITLE}
      <span className="fr-sr-only">{ACTION_LABEL}</span>
    </Box>
  ) : (
    <NextLink href={searchHref}>
      {TITLE}
      <span className="fr-sr-only">{ACTION_LABEL}</span>
    </NextLink>
  )

  return (
    <Box
      className={classNames({ "fr-enlarge-link": isInteractive && !onClick, "fr-enlarge-button": isInteractive && Boolean(onClick) })}
      sx={{
        display: "flex",
        gap: "24px",
        flexDirection: {
          xs: "column",
          md: "row",
        },
        alignItems: "flex-end",
        backgroundColor: "#F5F5FE",
        padding: "16px 24px",

        boxShadow: "0 2px 6px 0 #00001229",
        "&.fr-enlarge-link:hover, &.fr-enlarge-link:active, &.fr-enlarge-button:hover, &.fr-enlarge-button:active": {
          backgroundColor: "#F6F6F6",
        },
        // Bloc collé au bord de sa colonne : l'outline du DSFR (décalé vers l'extérieur) y serait rogné
        "&.fr-enlarge-link a::before, &.fr-enlarge-button button::before": {
          outlineOffset: "-2px",
        },
      }}
    >
      <Box>
        <Typography component="p" variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          {titleContent}
        </Typography>
        <Typography>
          Pour vous aider à trouver un contrat, nous identifions des entreprises susceptibles d'accueillir des alternants.
          <Box component="span" sx={{ fontWeight: 700 }}>
            {" "}
            Elles sont étiquetées <TagCandidatureSpontanee /> et sont visibles en fin de résultats de recherche.
          </Box>
        </Typography>

        <Typography sx={{ pt: fr.spacing("4v") }}>
          <span aria-hidden="true">👉</span> Vous étendez votre champ d'opportunités,
          <br />
          <span aria-hidden="true">👉</span> Vous choisissez les entreprises qui vous intéressent,
          <br />
          <span aria-hidden="true">👉</span> Vous augmentez vos chances car il y a moins de concurrence.
          <br />
        </Typography>
      </Box>
      <Image src="/images/dame_papier_coche_verte.svg" aria-hidden={true} alt="" width={170} height={156} />
    </Box>
  )
}
