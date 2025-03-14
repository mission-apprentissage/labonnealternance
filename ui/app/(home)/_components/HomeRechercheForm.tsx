"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { RechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"
import { IRecherchePageParams, PAGES } from "@/utils/routes.utils"

export function HomeRechercheForm() {
  const router = useRouter()

  const onSubmit = useCallback((params: IRecherchePageParams) => {
    router.push(PAGES.dynamic.recherche(params).getPath())
  }, [])

  return (
    <Box
      sx={{
        padding: fr.spacing("4w"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        borderRadius: fr.spacing("1w"),
        boxShadow: "0px 2px 6px 0px #00001229",
      }}
    >
      <RechercheFormTitle />
      <RechercheForm type="home" onSubmit={onSubmit} />
    </Box>
  )
}
