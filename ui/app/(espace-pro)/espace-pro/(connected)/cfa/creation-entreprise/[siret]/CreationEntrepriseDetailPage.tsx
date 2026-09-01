"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { Formik } from "formik"
import { useParams, useRouter } from "next/navigation"
import { useRef } from "react"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { ContactInfoFields } from "@/app/_components/ContactInfoFields"
import { DeclarationExactCheckbox } from "@/app/_components/DeclarationExactCheckbox"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
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
        // Le bouton "Continuer" n'est plus désactivé tant que le formulaire est invalide : cf.
        // createSubmitWithFocusOnError, qui force l'affichage de l'erreur sur tous les champs invalides
        // et scrolle/focus le premier plutôt que de laisser le bouton inerte sans indication visuelle.
        const handleSubmit = createSubmitWithFocusOnError(formRef, informationForm)

        return (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <ContactInfoFields />
            <Typography sx={{ color: "#0063CB" }}>
              <strong>Important :</strong> Ces informations restent confidentielles et ne sont pas visibles par les candidats. Elles sont uniquement utilisées par nos équipes à des
              fins de contrôles.
            </Typography>
            <DeclarationExactCheckbox />
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: fr.spacing("5v") }}>
              <Box sx={{ mr: fr.spacing("5v") }}>
                <Button type="button" priority="secondary" onClick={() => router.push(PAGES.static.backCfaCreationEntreprise.getPath())}>
                  Annuler
                </Button>
              </Box>
              <Button type="submit" aria-label="Continuer la création de l'entreprise" disabled={informationForm.isSubmitting}>
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
      <Box sx={{ display: "grid", gridTemplateRows: "1fr", gridTemplateColumns: { xs: "1fr", md: "4fr 5fr" }, gap: fr.spacing("6v") }}>
        <Box sx={{ gridRowStart: { xs: "auto", md: 2 } }}>
          <Box>
            <Typography component="h2" sx={{ fontSize: "24px", fontWeight: "bold" }}>
              Informations de contact
            </Typography>
            <Typography sx={{ fontSize: "20px", mt: fr.spacing("2v") }}>
              Il s’agit des informations de contact de votre entreprise partenaire. Ces informations ne seront pas visibles sur l’offre.
            </Typography>
          </Box>
          <Formulaire siret={siret} />
        </Box>
        <Box sx={{ gridRowStart: { xs: "auto", md: 2 }, pt: { xs: fr.spacing("4v"), md: 0 }, minW: "0" }}>
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
