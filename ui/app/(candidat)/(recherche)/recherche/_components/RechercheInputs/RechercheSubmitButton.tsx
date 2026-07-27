"use client"

import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import type React from "react"
import type { CSSProperties } from "react"

import type { IRechercheForm } from "@/app/_components/RechercheForm/RechercheForm"

// On ne compare que les champs fonctionnels : l'option de métier issue de l'autocomplete
// porte une propriété `group` absente des initialValues reconstruits depuis l'URL, qui ne
// doit pas être considérée comme une modification.
const metierKey = (metier: IRechercheForm["metier"]) => (metier ? JSON.stringify({ type: metier.type, label: metier.label, romes: metier.romes }) : null)
const lieuKey = (lieu: IRechercheForm["lieu"]) => (lieu ? JSON.stringify({ label: lieu.label, latitude: lieu.latitude, longitude: lieu.longitude }) : null)

export function RechercheSubmitButton({ children, style, forceMobileStyle = false }: { children?: React.ReactNode; style?: CSSProperties; forceMobileStyle?: boolean }) {
  const { isSubmitting, errors, touched, values, initialValues } = useFormikContext<IRechercheForm>()

  const hasError = (Object.keys(errors) as (keyof IRechercheForm)[]).some((key) => Boolean(errors[key]) && Boolean(touched[key]))

  // Seuls le métier et le lieu déclenchent une nouvelle recherche via le bouton.
  // Les autres champs (rayon, diplôme, types d'emploi, handicap, catégories) filtrent
  // la vue / relancent l'API directement. On garde donc le bouton désactivé tant que
  // ni le métier ni le lieu n'ont été modifiés par rapport à la recherche courante.
  const isModified = metierKey(values.metier) !== metierKey(initialValues.metier) || lieuKey(values.lieu) !== lieuKey(initialValues.lieu)

  return (
    <Box
      sx={{
        fontSize: {
          xs: "18px",
          md: forceMobileStyle ? "18px" : "16px",
        },
        lineHeight: {
          xs: "28px",
          md: forceMobileStyle ? "28px" : "24px",
        },
        "& button:before": {
          ...(!children ? { marginRight: "0 !important" } : {}),
        },
      }}
    >
      <Button
        disabled={isSubmitting || hasError || !isModified}
        iconPosition="left"
        type="submit"
        iconId="fr-icon-search-line"
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontSize: "inherit",
          lineHeight: "inherit",
          ...style,
        }}
        aria-label="Rechercher des offres d’alternance"
      >
        {children}
      </Button>
    </Box>
  )
}
