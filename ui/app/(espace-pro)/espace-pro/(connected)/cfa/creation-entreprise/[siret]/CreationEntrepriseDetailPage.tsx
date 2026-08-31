"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, CircularProgress, FormControl, FormControlLabel, FormHelperText, Typography } from "@mui/material"
import { Formik } from "formik"
import { useParams, useRouter } from "next/navigation"
import { useRef } from "react"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CustomInput from "@/app/_components/CustomInput"
import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useToast } from "@/app/hooks/useToast"
import { personNameValidation, phoneValidation } from "@/common/validation/field-validations"
import { apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const Formulaire = ({ siret: establishment_siret }: { siret: string }) => {
  const router = useRouter()
  const toast = useToast()
  const { user } = useConnectedSessionClient()
  const formRef = useRef<HTMLFormElement>(null)

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    apiPost("/user/:userId/formulaire", { params: { userId: user._id.toString() }, body: { ...values, establishment_siret } })
      .then((data) => {
        setSubmitting(false)
        toast({
          title: "Entreprise créée avec succès.",
        })
        router.push(PAGES.dynamic.backCfaEntrepriseCreationOffre(data.establishment_id).getPath())
      })
      .catch((err) => {
        if (err.message.includes("phone")) {
          setFieldError("phone", err.message)
        } else {
          setFieldError("email", err.message)
        }
        setSubmitting(false)
      })
  }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        last_name: undefined,
        first_name: undefined,
        phone: undefined,
        email: undefined,
        isDeclarationExact: false,
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
        last_name: personNameValidation().required("champ obligatoire"),
        first_name: personNameValidation().required("champ obligatoire"),
        phone: phoneValidation().required("champ obligatoire"),
        isDeclarationExact: Yup.boolean().oneOf([true], "Vous devez certifier l'exactitude des informations"),
      })}
      onSubmit={submitForm}
    >
      {(informationForm) => {
        // Le bouton "Continuer" n'est plus désactivé tant que le formulaire est invalide : au clic, on
        // force l'affichage de l'erreur sur tous les champs invalides (setTouched) puis on scrolle/focus
        // le premier champ en erreur, plutôt que de laisser le bouton inerte sans indication visuelle.
        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault()
          const errors = await informationForm.validateForm()
          informationForm.setTouched(Object.fromEntries(Object.keys(errors).map((k) => [k, true])), false)
          if (Object.keys(errors).length > 0 && formRef.current) {
            const selector = Object.keys(errors)
              .map((name) => `[name="${name}"]`)
              .join(", ")
            const firstErrorEl = formRef.current.querySelector<HTMLElement>(selector)
            if (firstErrorEl) {
              firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" })
              firstErrorEl.focus()
            }
            return
          }
          informationForm.submitForm()
        }

        return (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <CustomInput hideAsterisk name="last_name" label="Nom" type="text" value={informationForm.values.last_name} />
            <CustomInput hideAsterisk name="first_name" label="Prénom" type="text" value={informationForm.values.first_name} />
            <CustomInput hideAsterisk name="phone" label="Numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={informationForm.values.phone} />
            <CustomInput hideAsterisk name="email" label="Email" type="email" value={informationForm.values.email} />
            <Typography sx={{ color: "#0063CB" }}>
              <strong>Important :</strong> Ces informations restent confidentielles et ne sont pas visibles par les candidats. Elles sont uniquement utilisées par nos équipes à des
              fins de contrôles.
            </Typography>
            <FormControl error={Boolean(informationForm.touched.isDeclarationExact && informationForm.errors.isDeclarationExact)}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isDeclarationExact"
                    onChange={(event) => {
                      informationForm.setFieldValue("isDeclarationExact", event.target.checked)
                    }}
                    checked={informationForm.values.isDeclarationExact}
                  />
                }
                label={
                  <Typography>
                    Je certifie que les informations relatives à l’entreprise partenaire sont exactes et vérifiables, et j’accepte que ces données puissent faire l’objet de
                    contrôles par La bonne alternance.
                  </Typography>
                }
                sx={{ alignItems: "flex-start", mt: fr.spacing("6v") }}
              />
              {informationForm.touched.isDeclarationExact && informationForm.errors.isDeclarationExact && (
                <FormHelperText className={fr.cx("fr-message--error")} sx={{ ml: 0 }}>
                  {informationForm.errors.isDeclarationExact}
                </FormHelperText>
              )}
            </FormControl>
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: fr.spacing("5v") }}>
              <Box sx={{ mr: fr.spacing("5v") }}>
                <Button type="button" priority="secondary" onClick={() => router.push(PAGES.static.backCfaCreationEntreprise.getPath())}>
                  Annuler
                </Button>
              </Box>
              <Button type="submit" disabled={informationForm.isSubmitting}>
                {informationForm.isSubmitting && <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />}
                Continuer
              </Button>
            </Box>
          </form>
        )
      }}
    </Formik>
  )
}

function CreationEntrepriseDetail({ siret }: { siret: string }) {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.static.backCfaCreationEntreprise, PAGES.dynamic.backCfaEntrepriseCreationDetail(siret)]} />
      <Box sx={{ display: "grid", gridTemplateRows: "1fr", gridTemplateColumns: { xs: "1fr", sm: "4fr 5fr" }, gap: fr.spacing("6v") }}>
        <Box>
          <Typography component="h2" sx={{ fontSize: "24px", fontWeight: "bold" }}>
            Informations de contact
          </Typography>
          <Typography sx={{ fontSize: "20px", mt: fr.spacing("2v") }}>
            Il s’agit des informations de contact de votre entreprise partenaire. Ces informations ne seront pas visibles sur l’offre.
          </Typography>
        </Box>
        <Box sx={{ gridRowStart: { xs: "auto", sm: 2 } }}>
          <Formulaire siret={siret} />
        </Box>
        <Box sx={{ gridRowStart: { xs: "auto", sm: 2 }, pt: { xs: fr.spacing("4v"), sm: fr.spacing("8v") }, minW: "0" }}>
          <InformationLegaleEntreprise siret={siret} type={ENTREPRISE} viewerType={CFA} />
        </Box>
      </Box>
    </>
  )
}
function CreationEntrepriseDetailPage() {
  const { siret } = useParams() as { siret: string }

  return <CreationEntrepriseDetail siret={siret} />
}

export default CreationEntrepriseDetailPage
