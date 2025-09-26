"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { Form, Formik } from "formik"
import { useParams, useRouter } from "next/navigation"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"

import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CustomInput from "@/app/_components/CustomInput"
import { useToast } from "@/app/hooks/useToast"
import { phoneValidation } from "@/common/validation/fieldValidations"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { ArrowRightLine } from "@/theme/components/icons"
import { apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const Formulaire = ({ siret: establishment_siret }: { siret: string }) => {
  const router = useRouter()
  const { toast, ToastComponent } = useToast()
  const { user } = useConnectedSessionClient()

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    apiPost("/user/:userId/formulaire", { params: { userId: user._id.toString() }, body: { ...values, establishment_siret } })
      .then((data) => {
        setSubmitting(false)
        toast({
          title: "Entreprise créée avec succès.",
          status: "success",
          duration: 4000,
        })
        router.push(PAGES.dynamic.backCfaEntrepriseCreationOffre(data.establishment_id).getPath())
      })
      .catch(({ response }) => {
        const payload: { error: string; statusCode: number; message: string } = response.data as any
        setFieldError("email", payload.message)
        setSubmitting(false)
      })
  }

  return (
    <>
      {ToastComponent}
      <Formik
        validateOnMount={true}
        initialValues={{
          last_name: undefined,
          first_name: undefined,
          phone: undefined,
          email: undefined,
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
          last_name: Yup.string().required("champ obligatoire"),
          first_name: Yup.string().required("champ obligatoire"),
          phone: phoneValidation().required("champ obligatoire"),
        })}
        onSubmit={submitForm}
      >
        {(informationForm) => {
          return (
            <Form>
              <CustomInput required={false} name="last_name" label="Nom" type="text" value={informationForm.values.last_name} />
              <CustomInput required={false} name="first_name" label="Prénom" type="text" value={informationForm.values.first_name} />
              <CustomInput required={false} name="phone" label="Numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={informationForm.values.phone} />
              <CustomInput required={false} name="email" label="Email" type="email" value={informationForm.values.email} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: fr.spacing("5v") }}>
                <Box sx={{ mr: fr.spacing("5v") }}>
                  <Button type="button" priority="secondary" onClick={() => router.push(PAGES.static.backCfaCreationEntreprise.getPath())}>
                    Annuler
                  </Button>
                </Box>
                <Button type="submit" disabled={!informationForm.isValid || informationForm.isSubmitting}>
                  {informationForm.isSubmitting ? (
                    <CircularProgress sx={{ color: "inherit", mr: fr.spacing("1w") }} thickness={4} size={20} />
                  ) : (
                    <ArrowRightLine sx={{ width: 16, height: 16, mr: fr.spacing("1w") }} />
                  )}
                  Suivant
                </Button>
              </Box>
            </Form>
          )
        }}
      </Formik>
    </>
  )
}

function CreationEntrepriseDetail({ siret }: { siret: string }) {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.static.backCfaCreationEntreprise, PAGES.dynamic.backCfaEntrepriseCreationDetail(siret)]} />
      <Box sx={{ display: "grid", gridTemplateRows: { xs: "1fr", sm: ".5fr 2fr" }, gridTemplateColumns: { xs: "1fr", sm: "4fr 5fr" }, gap: fr.spacing("3w") }}>
        <Box>
          <Typography component="h2" sx={{ fontSize: "24px", fontWeight: "bold" }}>
            Informations de contact
          </Typography>
          <Typography sx={{ fontSize: "20px", textAlign: "justify", mt: fr.spacing("1w") }}>
            Il s’agit des informations de contact de votre entreprise partenaire. Ces informations ne seront pas visibles sur l’offre.
          </Typography>
        </Box>
        <Box sx={{ gridRowStart: { xs: "auto", sm: 2 } }}>
          <Formulaire siret={siret} />
        </Box>
        <Box sx={{ gridRowStart: { xs: "auto", sm: 2 }, pt: { xs: fr.spacing("2w"), sm: fr.spacing("4w") }, minW: "0" }}>
          <InformationLegaleEntreprise siret={siret} type={ENTREPRISE} viewerType={CFA} />
        </Box>
      </Box>
    </>
  )
}
function CreationEntrepriseDetailPage() {
  const { siret } = useParams() as { siret: string }

  return (
    <DepotSimplifieStyling>
      <CreationEntrepriseDetail siret={siret} />
    </DepotSimplifieStyling>
  )
}

export default CreationEntrepriseDetailPage
