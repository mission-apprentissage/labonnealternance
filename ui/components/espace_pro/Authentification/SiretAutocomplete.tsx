import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import type { FormikHelpers } from "formik"
import { Formik } from "formik"
import { useRef, useState } from "react"
import { validateSIRET } from "shared/validators/siret-validator"
import * as Yup from "yup"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
import AutocompleteAsync from "@/app/(espace-pro)/_components/AutocompleteAsync"
import { SIRETValidation } from "@/common/validation/field-validations"
import { searchEntreprise } from "@/services/search-entreprises"

type Organisation = Awaited<ReturnType<typeof searchEntreprise>>[number]

const isInvalidSiret = (value: string | undefined) => /^[0-9]{14}$/.test(value ?? "") && !validateSIRET(value)

export const SiretAutocomplete = ({
  label = "Nom ou SIRET de votre établissement",
  onSelectOrganisation,
  onSubmit,
}: {
  label?: string
  onSelectOrganisation?: (organisation: Organisation) => void
  onSubmit: (props: { establishment_siret: string }, formik: FormikHelpers<{ establishment_siret: string }>) => void
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedEntreprise, setSelectedEntreprise] = useState<Organisation | null>(null)
  return (
    <Formik
      validateOnMount
      initialValues={{ establishment_siret: undefined }}
      validationSchema={Yup.object().shape({
        // la saisie seule ne renseigne pas la valeur : seule la sélection d'un résultat le fait (cf. onSelectItem)
        establishment_siret: SIRETValidation().required("Sélectionnez votre établissement dans la liste des résultats, par son nom ou son SIRET (14 chiffres, sans espace)"),
      })}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, isSubmitting, setFieldValue, setFieldTouched, validateForm, setTouched, submitForm }) => {
        // Le bouton "Continuer" ne dépend pas de isValid : cf. createSubmitWithFocusOnError.
        const handleSubmit = createSubmitWithFocusOnError(formRef, { validateForm, setTouched, submitForm })
        return (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <AutocompleteAsync
              name="establishment_siret"
              label={label}
              hideAsterisk
              requiredMention
              info="Pour le SIRET : 14 chiffres, sans espace"
              handleSearch={(search: string) => searchEntreprise(search)}
              renderItem={({ raison_sociale, siret, adresse }, highlighted) => <EntrepriseCard {...{ raison_sociale, siret, adresse, highlighted }} />}
              itemToString={({ siret }) => siret}
              onInputFieldChange={(value, hasError) => {
                if (hasError) {
                  setFieldTouched("establishment_siret", true, false)
                  setFieldValue("establishment_siret", value, true)
                  return
                }
                // Un SIRET à 14 chiffres dont la clé est fausse ne renvoie aucun résultat : l'erreur passe par Formik
                // pour être liée au champ (RGAA 11.10). Toute autre saisie masque l'erreur affichée, le temps de choisir un résultat.
                if (isInvalidSiret(value)) {
                  setFieldTouched("establishment_siret", true, false)
                  setFieldValue("establishment_siret", value, true)
                  return
                }
                if (touched.establishment_siret) setFieldTouched("establishment_siret", false, false)
                if (isInvalidSiret(values.establishment_siret)) setFieldValue("establishment_siret", undefined, true)
              }}
              onSelectItem={(organisation) => {
                setSelectedEntreprise(organisation)
                setFieldTouched("establishment_siret", false, false)
                setFieldValue("establishment_siret", organisation?.siret, true)
                onSelectOrganisation?.(organisation)
              }}
              onError={(error, inputValue) => {
                captureException(error)
                setFieldTouched("establishment_siret", true, false)
                setFieldValue("establishment_siret", inputValue, true)
              }}
              allowHealFromError={false}
              renderError={() =>
                values?.establishment_siret && !errors?.establishment_siret ? null : (
                  <>
                    La recherche par raison sociale est temporairement indisponible. <strong>Veuillez renseigner votre numéro de SIRET.</strong>
                  </>
                )
              }
            />
            {selectedEntreprise && (
              <Box sx={{ marginTop: fr.spacing("8v") }}>
                <Typography sx={{ fontSize: "16px", lineHeight: "24px" }}>Établissement sélectionné :</Typography>
                <Box sx={{ border: "solid 1px #000091", marginTop: fr.spacing("2v") }}>
                  <EntrepriseCard {...selectedEntreprise} />
                </Box>
              </Box>
            )}
            <Box sx={{ display: "flex", justifyItems: "flex-start", mt: fr.spacing("8v") }}>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <CircularProgress size={24} thickness={4} sx={{ color: "inherit", mr: fr.spacing("2v") }} />}Continuer
              </Button>
            </Box>
          </form>
        )
      }}
    </Formik>
  )
}

const EntrepriseCard = ({ adresse, raison_sociale, siret, highlighted }: { highlighted?: boolean; raison_sociale: string; siret: string; adresse: string }) => {
  return (
    <Box sx={{ backgroundColor: highlighted ? "#F6F6F6" : "white", py: fr.spacing("2v"), px: fr.spacing("4v") }}>
      <Typography sx={{ fontWeight: 700, color: "#161616" }}>{raison_sociale}</Typography>
      <Typography sx={{ color: "#161616" }}>{siret}</Typography>
      <Typography sx={{ color: "#666666" }}>{adresse}</Typography>
    </Box>
  )
}
