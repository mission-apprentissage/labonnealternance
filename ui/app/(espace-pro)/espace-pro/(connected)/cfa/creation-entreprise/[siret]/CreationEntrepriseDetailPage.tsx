"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { Formik } from "formik"
import { useParams, useRouter } from "next/navigation"
import { useRef } from "react"
import { ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { ContactInfoFields } from "@/app/_components/ContactInfoFields"
import { DeclarationExactCheckbox } from "@/app/_components/DeclarationExactCheckbox"
import { AccountFormHeading, FormSection } from "@/app/_components/FormSection"
import { createSubmitWithFocusOnError, useServerFieldErrors } from "@/app/_components/submit-with-focus-on-error"
import { TwoColumnFormLayout } from "@/app/_components/TwoColumnFormLayout"
import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useToast } from "@/app/hooks/useToast"
import { emailValidation, frenchPhoneValidation, personNameValidation, toSubmittedPhone } from "@/common/validation/field-validations"
import { apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const Formulaire = ({ siret: establishment_siret }: { siret: string }) => {
  const router = useRouter()
  const toast = useToast()
  const { user } = useConnectedSessionClient()
  const formRef = useRef<HTMLFormElement>(null)
  const serverFieldErrors = useServerFieldErrors()

  const submitForm = (values, { setSubmitting, setFieldError, setFieldValue }) => {
    const phone = toSubmittedPhone(values.phone)
    setFieldValue("phone", phone, false)
    apiPost("/user/:userId/formulaire", { params: { userId: user._id.toString() }, body: { ...values, phone, establishment_siret } })
      .then((data) => {
        setSubmitting(false)
        toast({
          title: "Entreprise créée avec succès.",
        })
        router.push(PAGES.dynamic.backCfaEntrepriseCreationOffre(data.establishment_id).getPath())
      })
      .catch((err) => {
        if (err.message.includes("phone")) {
          serverFieldErrors.setServerFieldError(setFieldError, "phone", phone, err.message)
        } else {
          serverFieldErrors.setServerFieldError(setFieldError, "email", values.email, err.message)
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
        email: emailValidation().required("champ obligatoire"),
        last_name: personNameValidation().required("champ obligatoire"),
        first_name: personNameValidation().required("champ obligatoire"),
        phone: frenchPhoneValidation().required("champ obligatoire"),
        isDeclarationExact: Yup.boolean().oneOf([true], "Vous devez certifier l'exactitude des informations"),
      })}
      validate={serverFieldErrors.validate}
      onSubmit={submitForm}
    >
      {(informationForm) => {
        // Le bouton "Continuer" n'est pas désactivé quand le formulaire est invalide : cf. createSubmitWithFocusOnError.
        const handleSubmit = createSubmitWithFocusOnError(formRef, informationForm)

        return (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <TwoColumnFormLayout
              aside={<InformationLegaleEntreprise siret={establishment_siret} type={ENTREPRISE} />}
              content={
                <FormSection title="1. Informations de contact de l'entreprise partenaire">
                  <Typography sx={{ mb: fr.spacing("6v") }}>
                    Il s’agit des informations de contact de votre entreprise partenaire. Ces informations ne seront pas visibles sur l’offre.
                  </Typography>
                  <ContactInfoFields thirdParty variant="partenaire" showRequiredMention={false} />
                  <DeclarationExactCheckbox />
                </FormSection>
              }
              buttons={
                <>
                  <Button type="button" priority="secondary" onClick={() => router.push(PAGES.static.backCfaCreationEntreprise.getPath())}>
                    Annuler
                  </Button>
                  {/* aria-disabled plutôt que disabled : cf. le bouton « Enregistrer » de CompteRenderer */}
                  <Button
                    type="submit"
                    aria-label="Continuer la création de l'entreprise"
                    nativeButtonProps={{
                      "aria-disabled": informationForm.isSubmitting,
                      onClick: (event) => {
                        if (informationForm.isSubmitting) event.preventDefault()
                      },
                    }}
                  >
                    {informationForm.isSubmitting && <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />}
                    Continuer
                  </Button>
                </>
              }
            />
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
      <AccountFormHeading title="Informations de contact de l'entreprise partenaire" />
      <Formulaire siret={siret} />
    </>
  )
}
function CreationEntrepriseDetailPage() {
  const { siret } = useParams() as { siret: string }

  return <CreationEntrepriseDetail siret={siret} />
}

export default CreationEntrepriseDetailPage
