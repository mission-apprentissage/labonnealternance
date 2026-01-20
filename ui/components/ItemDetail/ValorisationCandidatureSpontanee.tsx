import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

import { TagCandidatureSpontanee } from "./TagCandidatureSpontanee"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

import { classNames } from "@/utils/classNames"

export const ValorisationCandidatureSpontanee = ({ overridenQueryParams = {} }: { overridenQueryParams?: Record<string, string> }) => {
  const router = useRouter()

  const onClick = useMemo(() => {
    if (typeof window === "undefined") return undefined
    const searchParams = new URL(window.location.href).searchParams
    const recherchePageParams = parseRecherchePageParams(searchParams, IRechercheMode.DEFAULT)
    const isClickable = Boolean(recherchePageParams.romes.length)
    if (!isClickable) return undefined
    const onClick = () => {
      const path = PAGES.dynamic
        .recherche({
          ...recherchePageParams,
          activeItems: null,
          scrollToRecruteursLba: true,
        })
        .getPath()
      const fakeUrl = new URL("http://localhost" + path)
      const { searchParams } = fakeUrl
      Object.entries(overridenQueryParams).forEach(([key, value]) => {
        searchParams.delete(key)
        searchParams.append(key, value)
      })

      router.push(fakeUrl.pathname + fakeUrl.search)
    }
    return onClick
  }, [router, overridenQueryParams])

  return (
    <Box
      className={classNames({ clickable: Boolean(onClick) })}
      onClick={onClick}
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
        <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Plus de 60% des recrutements en alternance se font sans qu’aucune offre n’ait été déposée.
        </Typography>
        <Typography>
          Pour vous aider à trouver un contrat, nous identifions des entreprises susceptibles d'accueillir des alternants.
          <b>
            {" "}
            Elles sont étiquetées <TagCandidatureSpontanee /> et sont visibles en fin de résultats de recherche.
          </b>
        </Typography>

        <Typography sx={{ pt: 2 }}>
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
