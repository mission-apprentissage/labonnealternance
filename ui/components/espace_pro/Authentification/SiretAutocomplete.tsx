import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { Form, Formik, FormikHelpers } from "formik"
import { useState } from "react"
import { validateSIRET } from "shared/validators/siretValidator"
import * as Yup from "yup"

import { searchEntreprise } from "@/services/searchEntreprises"

import AutocompleteAsync from "../../../app/(espace-pro)/_components/AutocompleteAsync"
import { SIRETValidation } from "../../../common/validation/fieldValidations"

type Organisation = Awaited<ReturnType<typeof searchEntreprise>>[number]

export const SiretAutocomplete = ({
  onSelectOrganisation,
  onSubmit,
}: {
  onSelectOrganisation?: (organisation: Organisation) => void
  onSubmit: (props: { establishment_siret: string }, formik: FormikHelpers<{ establishment_siret: string }>) => void
}) => {
  const [searchInput, setSearchInput] = useState<string>()
  const [selectedEntreprise, setSelectedEntreprise] = useState<Organisation | null>(null)
  return (
    <Formik
      validateOnMount
      initialValues={{ establishment_siret: undefined }}
      validationSchema={Yup.object().shape({
        establishment_siret: SIRETValidation().required("champ obligatoire"),
      })}
      onSubmit={onSubmit}
    >
      {({ values, errors, isValid, isSubmitting, setFieldValue, setFieldTouched }) => {
        return (
          <Form>
            <AutocompleteAsync
              name="establishment_siret"
              handleSearch={(search: string) => searchEntreprise(search)}
              renderItem={({ raison_sociale, siret, adresse }, highlighted) => <EntrepriseCard {...{ raison_sociale, siret, adresse, highlighted }} />}
              itemToString={({ siret }) => siret}
              onInputFieldChange={(value, hasError) => {
                setSearchInput(value)
                if (!hasError) return
                setFieldTouched("establishment_siret", true, false)
                setFieldValue("establishment_siret", value, true)
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
              renderNoResult={
                /^[0-9]{14}$/.test(searchInput) && !validateSIRET(searchInput) ? (
                  <Box>
                    <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: "#CE0500", padding: "8px 16px" }}>Le numéro de SIRET saisi n’est pas valide</Typography>
                  </Box>
                ) : undefined
              }
              renderError={() =>
                values?.establishment_siret && !errors?.establishment_siret ? null : (
                  <Box>
                    <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: "#CE0500", padding: "8px 16px" }}>
                      La recherche par raison sociale est temporairement indisponible.
                      <br />
                      <b>Veuillez renseigner votre numéro de SIRET.</b>
                    </Typography>
                  </Box>
                )
              }
            />
            {selectedEntreprise && (
              <Box sx={{ marginTop: fr.spacing("4w") }}>
                <Typography sx={{ fontSize: "16px", lineHeight: "24px" }}>Établissement sélectionné :</Typography>
                <Box sx={{ border: "solid 1px #000091", marginTop: fr.spacing("1w") }}>
                  <EntrepriseCard {...selectedEntreprise} />
                </Box>
              </Box>
            )}
            <Box sx={{ display: "flex", justifyItems: "flex-start", mt: fr.spacing("4w") }}>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting && <CircularProgress size={24} thickness={4} sx={{ color: "inherit", mr: fr.spacing("1w") }} />}Continuer
              </Button>
            </Box>
          </Form>
        )
      }}
    </Formik>
  )
}

const EntrepriseCard = ({ adresse, raison_sociale, siret, highlighted }: { highlighted?: boolean; raison_sociale: string; siret: string; adresse: string }) => {
  return (
    <Box sx={{ backgroundColor: highlighted ? "#F6F6F6" : "white", py: fr.spacing("1w"), px: fr.spacing("2w") }}>
      <Typography sx={{ fontWeight: 700, color: "#161616" }}>{raison_sociale}</Typography>
      <Typography sx={{ color: "#161616" }}>{siret}</Typography>
      <Typography sx={{ color: "#666666" }}>{adresse}</Typography>
    </Box>
  )
}
