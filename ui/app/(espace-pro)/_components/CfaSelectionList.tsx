"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Checkbox, Divider, Link, Typography } from "@mui/material"
import type { SxProps, Theme } from "@mui/material/styles"
import Image from "next/image"
import { type Ref, useId } from "react"
import type { IEtablissementCatalogueProcheWithDistanceJSON } from "shared/interface/etablissement.types"
import { CfaSolicitationIntro } from "./CfaDelegationContent"

const joinIds = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(" ") || undefined

/**
 * Liste des CFA à solliciter, partagée par l'étape 3 du dépôt d'offre et la page de mise en relation.
 * Le nom de chaque case est la raison sociale ; l'adresse, la distance et « CFA déjà contacté » la décrivent.
 * Le message d'erreur est ajouté au nom du groupe, comme le fait le DSFR pour ses groupes de cases.
 */
export const CfaSelectionList = ({
  etablissements,
  isChecked,
  isDisabled,
  onToggle,
  onDetailsClick,
  hint,
  error,
  introSx,
  ref,
}: {
  etablissements: IEtablissementCatalogueProcheWithDistanceJSON[]
  isChecked: (id: string) => boolean
  /** CFA déjà sollicités pour cette offre : affichés cochés, non modifiables */
  isDisabled: (id: string) => boolean
  onToggle: (etablissement: IEtablissementCatalogueProcheWithDistanceJSON) => void
  onDetailsClick?: (siret: string) => void
  hint?: string
  error?: string
  introSx?: SxProps<Theme>
  ref?: Ref<HTMLFieldSetElement>
}) => {
  const baseId = useId()
  const introId = `${baseId}-intro`
  const legendId = `${baseId}-legend`
  const hintId = `${baseId}-hint`
  const errorId = `${baseId}-error`

  return (
    <>
      <CfaSolicitationIntro id={introId} sx={introSx} />
      <Box
        component="fieldset"
        ref={ref}
        aria-labelledby={joinIds(legendId, error && errorId)}
        aria-describedby={joinIds(introId, hint && hintId)}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0, mt: fr.spacing("5v") }}
      >
        <Typography component="legend" id={legendId} sx={{ fontWeight: 700, p: 0, mb: hint ? fr.spacing("1v") : fr.spacing("4v") }}>
          Centres de formation à solliciter
        </Typography>
        {hint && (
          <Typography id={hintId} className={fr.cx("fr-hint-text")} sx={{ mb: fr.spacing("4v") }}>
            {hint}
          </Typography>
        )}
        <Box aria-live="polite">
          {error && (
            <Typography id={errorId} className={fr.cx("fr-message", "fr-message--error")} sx={{ mb: fr.spacing("4v") }}>
              {error}
            </Typography>
          )}
        </Box>
        {etablissements.map((etablissement, index) => {
          const disabled = isDisabled(etablissement._id)
          const checked = isChecked(etablissement._id)
          const checkboxId = `${baseId}-cfa-${index}`
          const contactedId = `${checkboxId}-contacted`
          const addressId = `${checkboxId}-address`
          const distanceId = `${checkboxId}-distance`
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: fr.spacing("4v"),
                borderStyle: "solid",
                borderWidth: "1px",
                borderColor: disabled ? "#E5E5E5" : checked ? "#000091" : "#DDDDDD",
                mb: fr.spacing("4v"),
              }}
              key={etablissement._id}
              data-testid={`cfa-${index}`}
            >
              <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row", pl: fr.spacing("1v") }}>
                <Checkbox
                  id={checkboxId}
                  name="etablissementCatalogueIds"
                  value={etablissement._id}
                  sx={{ "&.Mui-disabled .MuiSvgIcon-root": { display: "none" } }}
                  disabled={disabled}
                  checked={checked}
                  onChange={() => onToggle(etablissement)}
                  slotProps={{ input: { "aria-describedby": joinIds(disabled && contactedId, addressId, distanceId) } }}
                />
              </Box>
              <Box sx={{ py: fr.spacing("4v"), flex: 1 }}>
                {disabled && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", backgroundColor: "#F6F6F6", width: "fit-content", px: fr.spacing("2v"), py: fr.spacing("1v") }}>
                    <Image fetchPriority="high" src="/images/icons/chrono.svg" alt="" style={{ margin: "4px" }} unoptimized width={16} height={16} />
                    <Typography id={contactedId} sx={{ fontSize: "12px", color: "#666666", mb: fr.spacing("2v") }}>
                      CFA déjà contacté
                    </Typography>
                  </Box>
                )}
                <Typography
                  component="label"
                  htmlFor={checkboxId}
                  sx={{
                    display: "block",
                    cursor: disabled ? "default" : "pointer",
                    fontSize: "16px",
                    lineHeight: "25px",
                    fontWeight: "400",
                    color: "#161616",
                    textTransform: "capitalize",
                    pr: fr.spacing("3v"),
                  }}
                >
                  {etablissement.entreprise_raison_sociale}
                </Typography>
                <Typography id={addressId} sx={{ fontSize: "12px", lineHeight: "25px", color: "#666666", textTransform: "capitalize", pr: fr.spacing("3v") }}>
                  {etablissement?.numero_voie} {etablissement?.type_voie} {etablissement?.nom_voie}, {etablissement?.code_postal} {etablissement?.localite}
                </Typography>
                <Link
                  underline="hover"
                  href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${etablissement.siret}`}
                  sx={{ color: "#000091" }}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onDetailsClick?.(etablissement.siret)}
                >
                  En savoir plus
                  <span className="fr-sr-only">{` - ${etablissement.entreprise_raison_sociale} sur le site du catalogue des formations en apprentissage - nouvelle fenêtre`}</span>
                </Link>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Divider aria-hidden="true" orientation="vertical" />
                <Typography id={distanceId} sx={{ fontSize: "12px", fontWeight: "700", color: "#666666", px: fr.spacing("4v") }}>
                  à {etablissement.distance_en_km} km
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>
    </>
  )
}
