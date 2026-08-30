import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { buildRecruteursLbaSearchUrl } from "@/app/(candidat)/(recherche)/recherche/_utils/search-legacy-utils"
import { classNames } from "@/utils/class-names"
import { TagCandidatureSpontanee } from "./TagCandidatureSpontanee"

export const ValorisationCandidatureSpontanee = ({
  overridenQueryParams = {},
  onClick,
  disabled,
}: {
  overridenQueryParams?: Record<string, string>
  onClick?: () => void
  disabled?: boolean
}) => {
  const router = useRouter()

  const localOnClick = useMemo(() => {
    if (typeof window === "undefined") return undefined
    // Rejoue la recherche d'origine (?from= du nouveau moteur, ou paramètres legacy d'un lien
    // encore en circulation) en cochant « entreprises à contacter ». Sans contexte de recherche,
    // le bloc reste non cliquable : envoyer sur une page de résultats nue n'aiderait personne.
    const searchUrl = buildRecruteursLbaSearchUrl(window.location.href)
    if (searchUrl === null || disabled) return undefined
    return () => {
      if (onClick) {
        // Déjà sur la page de recherche : scroll direct sans navigation
        onClick()
        return
      }
      const fakeUrl = new URL("http://localhost" + searchUrl)
      const { searchParams } = fakeUrl
      Object.entries(overridenQueryParams).forEach(([key, value]) => {
        searchParams.delete(key)
        searchParams.append(key, value)
      })
      router.push(fakeUrl.pathname + fakeUrl.search, { scroll: false })
    }
  }, [router, overridenQueryParams, onClick, disabled])

  return (
    <Box
      className={classNames({ clickable: Boolean(localOnClick) })}
      onClick={localOnClick}
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
        "&.clickable": {
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "#F6F6F6",
          },
        },
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Plus de 60% des recrutements en alternance se font sans qu’aucune offre n’ait été déposée.
        </Typography>
        <Typography>
          Pour vous aider à trouver un contrat, nous identifions des entreprises susceptibles d'accueillir des alternants.
          <b>
            {" "}
            Elles sont étiquetées <TagCandidatureSpontanee /> et sont visibles en fin de résultats de recherche.
          </b>
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
