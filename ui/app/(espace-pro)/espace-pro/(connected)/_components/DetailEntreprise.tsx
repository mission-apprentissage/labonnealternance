"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { Formik } from "formik"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import { BusinessErrorCodes, EntrepriseErrorCodes } from "shared/constants/error-codes"
import type { OPCOS_LABEL } from "shared/constants/recruteur"
import { AUTHTYPE, ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"
import { ContactInfoFields } from "@/app/_components/ContactInfoFields"
import { DeclarationExactCheckbox } from "@/app/_components/DeclarationExactCheckbox"
import { FormSection } from "@/app/_components/FormSection"
import { createSubmitWithFocusOnError, useServerFieldErrors } from "@/app/_components/submit-with-focus-on-error"
import { TwoColumnFormLayout } from "@/app/_components/TwoColumnFormLayout"
import { FieldWithValue } from "@/app/(espace-pro)/_components/FieldWithValue"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useToast } from "@/app/hooks/useToast"
import { emailValidation, frenchPhoneValidation, toSubmittedPhone } from "@/common/validation/field-validations"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { AnimationContainer } from "@/components/espace_pro"
import { updateEntrepriseCFA } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { EMAIL_ALREADY_USED_ERROR } from "@/utils/validation-messages"
import { AccountReview } from "./account-review/AccountReview"
import InformationLegaleEntreprise from "./InformationLegaleEntreprise"
import { OffresTabs } from "./OffresTabs"

type Variables = { values: { email: string; first_name: string; last_name: string; phone: string }; setFieldError: (field: string, message: string) => void }

export default function DetailEntreprise({
  userRecruteur,
  recruiter,
  onChange,
  isCfaManagedEntreprise = false,
  cfaUserId,
  onDeleteEntreprisePartenaire,
}: {
  userRecruteur: any
  recruiter?: any
  onChange?: (props: { opco?: OPCOS_LABEL }) => void
  isCfaManagedEntreprise?: boolean
  cfaUserId?: string
  onDeleteEntreprisePartenaire?: () => void
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const serverFieldErrors = useServerFieldErrors()

  const toast = useToast()
  const { user } = useConnectedSessionClient()
  const isCfaUser = user.type === AUTHTYPE.CFA
  const isDeclarationExactField = isCfaUser ? { isDeclarationExact: true } : {}
  const isDeclarationExactValidation = isCfaUser ? { isDeclarationExact: Yup.boolean().oneOf([true], "Vous devez certifier l'exactitude des informations") } : {}
  // Une entreprise gérée par un CFA n'a pas de compte utilisateur propre : ses informations de contact,
  // son statut et son historique proviennent en réalité du CFA gestionnaire, pas de l'entreprise elle-même.
  const showAccountLifecycle = user.type !== AUTHTYPE.CFA && !isCfaManagedEntreprise

  const userMutation = useMutation({
    mutationFn: async (props: Variables) => {
      const { values, setFieldError } = props

      try {
        const { email, first_name, last_name, phone } = values
        await updateEntrepriseCFA(userRecruteur.establishment_id, { email, first_name, last_name, phone })
        onChange?.({})
        toast({
          title: "Mise à jour enregistrée avec succès",
        })
      } catch (err: any) {
        if (err.message === EntrepriseErrorCodes.PHONE_SAME_AS_CFA) {
          serverFieldErrors.setServerFieldError(setFieldError, "phone", values.phone, err.message)
        } else if (err.message === EntrepriseErrorCodes.EMAIL_SAME_AS_CFA) {
          serverFieldErrors.setServerFieldError(setFieldError, "email", values.email, err.message)
        } else if (err instanceof ApiError && err.context.errorData?.error === BusinessErrorCodes.EMAIL_ALREADY_EXISTS) {
          serverFieldErrors.setServerFieldError(setFieldError, "email", values.email, EMAIL_ALREADY_USED_ERROR)
        } else {
          throw err
        }
      }
    },
  })

  const establishmentLabel = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret

  if (showAccountLifecycle && (user.type === AUTHTYPE.ADMIN || user.type === AUTHTYPE.OPCO)) {
    return (
      <AnimationContainer>
        <AccountReview userRecruteur={userRecruteur} recruiter={recruiter} onChange={onChange} />
      </AnimationContainer>
    )
  }

  return (
    <AnimationContainer>
      <Box
        sx={{
          borderBottom: "1px solid #E3E3FD",
          mb: fr.spacing("4v"),
          px: fr.spacing("4v"),
        }}
      >
        <Box sx={{ mb: fr.spacing("5v"), display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: fr.spacing("2v") }}>
          <Typography
            sx={{
              fontSize: { xs: "28px !important", md: "32px !important" },
              lineHeight: { xs: "36px !important", md: "40px !important" },
              fontWeight: 700,
              ml: 0,
              mr: fr.spacing("8v"),
              overflowWrap: "anywhere",
            }}
            component="h1"
          >
            {establishmentLabel}
          </Typography>

          {isCfaManagedEntreprise ? (
            <Button priority="secondary" iconId="fr-icon-delete-line" type="button" onClick={() => onDeleteEntreprisePartenaire?.()}>
              Supprimer l'entreprise partenaire
            </Button>
          ) : (
            <Button
              priority="secondary"
              iconId="fr-icon-close-line"
              type="button"
              onClick={() => router.push(PAGES.dynamic.backCfaPageEntreprise(userRecruteur.establishment_id).getPath())}
            >
              Fermer
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ px: fr.spacing("4v") }}>
        <Box sx={{ display: user.type !== "CFA" ? "flex" : "none", alignItems: "center", gap: fr.spacing("6v"), mb: fr.spacing("6v"), flexWrap: "wrap" }}>
          {user.type !== "CFA" && (
            <Box sx={{ display: "flex", gap: fr.spacing("3v"), flexWrap: "wrap" }}>
              {userRecruteur.establishment_siret && (
                <DsfrLink
                  href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${userRecruteur.establishment_siret}`}
                  className="fr-link fr-link--sm fr-link--icon-right fr-icon-external-link-line"
                >
                  Annuaire entreprises
                </DsfrLink>
              )}
              {userRecruteur.email && (
                <DsfrLink
                  href={`https://www.google.com/search?q=${encodeURIComponent(userRecruteur.email)}`}
                  className="fr-link fr-link--sm fr-link--icon-right fr-icon-external-link-line"
                >
                  Rechercher l&apos;email
                </DsfrLink>
              )}
              {(userRecruteur.establishment_raison_sociale || userRecruteur.establishment_enseigne) && userRecruteur.address && (
                <DsfrLink
                  href={`https://www.google.com/maps/search/${encodeURIComponent(`${userRecruteur.establishment_enseigne ?? userRecruteur.establishment_raison_sociale} ${userRecruteur.address}`)}`}
                  className="fr-link fr-link--sm fr-link--icon-right fr-icon-external-link-line"
                >
                  Google Maps
                </DsfrLink>
              )}
            </Box>
          )}
        </Box>
        <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("8v") }}>
          Tous les champs sont obligatoires.
        </Typography>
        <Formik
          validateOnMount={true}
          enableReinitialize={true}
          initialValues={{
            last_name: userRecruteur.last_name,
            first_name: userRecruteur.first_name,
            phone: userRecruteur.phone,
            email: userRecruteur.email,
            ...isDeclarationExactField,
          }}
          validationSchema={Yup.object().shape({
            last_name: Yup.string().required("champ obligatoire"),
            first_name: Yup.string().required("champ obligatoire"),
            phone: frenchPhoneValidation().required("champ obligatoire"),
            email: emailValidation().required("champ obligatoire"),
            ...isDeclarationExactValidation,
          })}
          validate={serverFieldErrors.validate}
          onSubmit={async (values, { setFieldError, setFieldValue, setSubmitting }) => {
            setSubmitting(true)
            const phone = toSubmittedPhone(values.phone)
            setFieldValue("phone", phone, false)
            userMutation.mutate({ values: { ...values, phone }, setFieldError })
            setSubmitting(false)
          }}
        >
          {(formik) => {
            const { isSubmitting } = formik
            // Le bouton "Enregistrer" ne dépend pas de isValid : cf. createSubmitWithFocusOnError.
            const handleSubmit = createSubmitWithFocusOnError(formRef, formik)

            return (
              <>
                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                  <TwoColumnFormLayout
                    aside={
                      <>
                        {/* Ce formulaire ne sert qu'aux entreprises gérées par un CFA : la réponse de getEntrepriseManagedByCfa (ZRecruiter) n'a pas de champ type */}
                        <InformationLegaleEntreprise siret={userRecruteur.establishment_siret} type={ENTREPRISE} />
                        {user.type !== "CFA" && (
                          <Box sx={{ my: fr.spacing("8v") }}>
                            <FieldWithValue title="Origine" value={userRecruteur.origin} />
                          </Box>
                        )}
                      </>
                    }
                    content={
                      <>
                        <FormSection title="1. Informations de contact de l'entreprise partenaire">
                          {isCfaUser && (
                            <Typography sx={{ mb: fr.spacing("6v") }}>
                              Il s’agit des informations de contact de votre entreprise partenaire. Ces informations ne seront pas visibles sur l’offre.
                            </Typography>
                          )}
                          <ContactInfoFields thirdParty variant={isCfaUser ? "partenaire" : "default"} showRequiredMention={false} />
                          {isCfaUser && <DeclarationExactCheckbox />}
                        </FormSection>
                        {userMutation.error && (
                          <Box sx={{ mt: fr.spacing("6v") }}>
                            {/* Affiche le message d'erreur métier quand il est disponible, sinon un message générique en français (RGAA 8.7). */}
                            <Alert
                              severity="error"
                              small
                              description={
                                userMutation.error instanceof ApiError && userMutation.error.context.statusCode === 400
                                  ? userMutation.error.message
                                  : "La mise à jour n'a pas pu être enregistrée. Veuillez réessayer ultérieurement."
                              }
                            />
                          </Box>
                        )}
                      </>
                    }
                    buttons={
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />}
                        Enregistrer
                      </Button>
                    }
                  />
                </form>
                {/* Ici, un admin ou un OPCO consulte toujours une entreprise gérée par un CFA : cf. le retour anticipé sur AccountReview. */}
                {(user.type === AUTHTYPE.ADMIN || user.type === AUTHTYPE.OPCO) && (
                  <Box sx={{ my: fr.spacing("12v") }}>
                    <OffresTabs
                      caption="Offres de recrutement en alternance"
                      recruiter={recruiter}
                      hideCfaShareAction
                      buildOfferEditionUrl={(offerId) =>
                        PAGES.dynamic
                          .offreUpsert({ offerId, establishment_id: userRecruteur.establishment_id, userType: user.type, userId: cfaUserId, raison_sociale: establishmentLabel })
                          .getPath()
                      }
                    />
                  </Box>
                )}
              </>
            )
          }}
        </Formik>
      </Box>
    </AnimationContainer>
  )
}
