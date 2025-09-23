"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import { useState } from "react"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import * as Yup from "yup"
import { z } from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CustomDSFRInput from "@/app/_components/CustomDSFRInput"
import CustomInput from "@/app/_components/CustomInput"
import { phoneValidation } from "@/common/validation/fieldValidations"
import { SearchLine } from "@/theme/components/icons"
import { getCompanyContactInfo, putCompanyContactInfo } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const unreferencedLbaRecruteurWarning = "Seules les modifications / ajouts sont supportés dans le cas d'une société déréférencée"

function FormulaireRechercheEntreprise({ onSiretChange }: { onSiretChange: (newSiret: string) => void }) {
  const submitSearchForSiret = async ({ siret }: { siret: string }) => {
    const formattedSiret = siret.replace(/[^0-9]/g, "")
    onSiretChange(formattedSiret)
  }

  return (
    <Formik
      validateOnMount
      initialValues={{ siret: undefined }}
      validationSchema={toFormikValidationSchema(
        z.object({
          siret: extensions.siret,
        })
      )}
      onSubmit={submitSearchForSiret}
    >
      {({ values, isValid, dirty }) => {
        return (
          <Form>
            <CustomDSFRInput required={true} name="siret" label="SIRET de l'établissement" type="text" value={values.siret} />
            <Box sx={{ display: "flex", mt: fr.spacing("1w"), justifyContent: "flex-start" }}>
              <Button type="submit" data-testid="search_for_algo_company" disabled={!isValid || !dirty}>
                <SearchLine width={5} mr={2} /> Chercher
              </Button>
            </Box>
          </Form>
        )
      }}
    </Formik>
  )
}

function FormulaireModificationEntreprise({ siret }: { siret: string }) {
  const {
    isLoading,
    data,
    error: readError,
    refetch,
  } = useQuery({
    queryKey: ["getCompany", siret],

    queryFn: () => {
      setHasUpdated(false)
      return getCompanyContactInfo(siret)
    },

    enabled: Boolean(siret),
    retry: false,
  })
  const [hasUpdated, setHasUpdated] = useState(false)
  const updateEntreprise = useMutation({
    mutationKey: ["updateEntreprise"],
    mutationFn: ({ phone, email }: { phone: string; email: string }) => putCompanyContactInfo({ phone, email, siret }),

    onSuccess: () => {
      refetch()
      setHasUpdated(true)
    },

    onError: () => {
      setHasUpdated(false)
    },
  })
  const { error: updateError } = updateEntreprise

  if (isLoading) {
    return <CircularProgress size={32} sx={{ my: fr.spacing("2w") }} />
  }
  if (!siret) {
    return null
  }
  if (readError) {
    return (
      <Box sx={{ my: fr.spacing("2v") }}>
        <Alert severity="warning" title="Erreur" description={readError.message} />
      </Box>
    )
  }

  const currentCompany = data

  return (
    <>
      {hasUpdated && (
        <Box sx={{ my: fr.spacing("2w") }}>
          <Alert severity="success" title="Succès" description={`Le SIRET ${currentCompany.siret} a été mis à jour.`} />
        </Box>
      )}
      <Typography component="h2" sx={{ fontWeight: 700, my: fr.spacing("3w") }}>
        Mise à jour des coordonnées pour l’entreprise :
      </Typography>

      <Box sx={{ borderColor: "#000091", borderWidth: "1px", p: fr.spacing("2w"), mb: fr.spacing("2w") }}>
        <Formik
          validate={(values) => {
            if (!currentCompany.active && !values.email && !values.phone) return { email: unreferencedLbaRecruteurWarning, phone: unreferencedLbaRecruteurWarning }
            return {}
          }}
          enableReinitialize
          validateOnMount
          initialValues={{ phone: currentCompany.phone, email: currentCompany.email }}
          validationSchema={Yup.object().shape({
            email: Yup.string().email("Insérez un email valide").nullable(),
            phone: phoneValidation().nullable(),
          })}
          onSubmit={(values) => {
            const { phone, email } = values
            if (!phone) values.phone = null
            if (!email) values.email = null
            return updateEntreprise.mutate(values)
          }}
        >
          {({ values, isValid, dirty }) => {
            return (
              <Form>
                <Typography sx={{ fontWeight: 700, mb: fr.spacing("1w"), fontSize: "22px" }}>{currentCompany.enseigne}</Typography>
                <Typography sx={{ color: "#666666", mb: fr.spacing("1w") }}>SIRET {currentCompany.siret}</Typography>
                {!currentCompany.active && (
                  <Typography sx={{ mb: fr.spacing("1w"), color: "#CE0500", fontSize: "14px" }}>
                    Société supprimée de la collection <strong>recruteurslba</strong> mais présente dans <strong>applications</strong>.
                    <br />
                    Seules les mises à jour seront enregistrées.
                  </Typography>
                )}
                <CustomInput required={false} name="phone" label="Nouveau numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                <CustomInput required={false} name="email" label="Nouvel email de contact" type="email" value={values.email} />
                {updateError && <Alert title="Erreur" description={updateError.message} severity="error" />}
                <Box sx={{ display: "flex", justifyContent: "flex-start", mt: fr.spacing("2w") }}>
                  <Button type="submit" data-testid="update_algo_company" disabled={!isValid || !dirty}>
                    Enregistrer les modifications
                  </Button>
                </Box>
              </Form>
            )
          }}
        </Formik>
      </Box>
    </>
  )
}

export default function GestionEntreprises() {
  const [siret, setSiret] = useState<string>("")

  return (
    <AdminLayout currentAdminPage="ENTREPRISES_ALGO">
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminGestionDesEntreprises]} />
      <Box>
        <Typography component="h2" sx={{ fontWeight: 700, mb: fr.spacing("2w") }}>
          Entreprises de l'algorithme :
        </Typography>
        <FormulaireRechercheEntreprise onSiretChange={setSiret} />
        <FormulaireModificationEntreprise siret={siret} />
      </Box>
    </AdminLayout>
  )
}
