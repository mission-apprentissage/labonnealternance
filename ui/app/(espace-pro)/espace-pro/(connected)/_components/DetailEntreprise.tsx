"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Alert, Box, Checkbox, CircularProgress, FormControlLabel, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import type { INewSuperUser, IUserStatusValidationJson } from "shared"
import type { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import { AUTHTYPE, ETAT_UTILISATEUR } from "shared/constants/recruteur"
import * as Yup from "yup"

import { EntrepriseErrorCodes } from "shared/constants/errorCodes"
import InformationLegaleEntreprise from "./InformationLegaleEntreprise"
import { OffresTabs } from "./OffresTabs"
import Badge from "@/app/(espace-pro)/_components/Badge"
import { FieldWithValue } from "@/app/(espace-pro)/_components/FieldWithValue"
import { OpcoSelect } from "@/app/(espace-pro)/_components/OpcoSelect"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import CustomInput from "@/app/_components/CustomInput"
import { useToast } from "@/app/hooks/useToast"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { AnimationContainer, ConfirmationDesactivationUtilisateur, ConfirmationModificationOpco, UserValidationHistory } from "@/components/espace_pro"
import { webkitLineClamp } from "@/styles/webkitLineClamp"
import { ArrowRightLine } from "@/theme/components/icons"
import { updateEntrepriseAdmin, updateEntrepriseCFA } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

type Variables = { userId: string; values: INewSuperUser; siret: string; setFieldError: (field: string, message: string) => void }

export default function DetailEntreprise({ userRecruteur, recruiter, onChange }: { userRecruteur: any; recruiter?: any; onChange?: (props: { opco?: OPCOS_LABEL }) => void }) {
  const router = useRouter()
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationModificationOpco = useDisclosure()

  const toast = useToast()
  const { user } = useConnectedSessionClient()
  const isDeclarationExactField = user.type === AUTHTYPE.CFA ? { isDeclarationExact: true } : {}
  const isDeclarationExactValidation = user.type === AUTHTYPE.CFA ? { isDeclarationExact: Yup.boolean().oneOf([true], "Vous devez certifier l'exactitude des informations") } : {}

  const ActivateUserButton = ({ userId }: { userId: string }) => {
    const { activate } = useUserPermissionsActions(userId)

    return (
      <Button
        onClick={async () => {
          await activate()
          onChange?.({})
        }}
      >
        Activer le compte
      </Button>
    )
  }

  const DisableUserButton = () => {
    return (
      <Button className="fr-btn--secondary" onClick={() => confirmationDesactivationUtilisateur.onOpen()}>
        Désactiver le compte
      </Button>
    )
  }

  const getActionButtons = (userHistory: IUserStatusValidationJson, userId: string) => {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (userHistory.status) {
      case ETAT_UTILISATEUR.ATTENTE:
        return (
          <>
            <ActivateUserButton userId={userId} />
            <DisableUserButton />
          </>
        )
      case ETAT_UTILISATEUR.VALIDE:
        return <DisableUserButton />
      case ETAT_UTILISATEUR.DESACTIVE:
        return <ActivateUserButton userId={userId} />

      default:
        return <></>
    }
  }

  const getUserBadge = (userHistory: IUserStatusValidationJson) => {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (userHistory.status) {
      case ETAT_UTILISATEUR.ATTENTE:
        return <Badge variant="awaiting">À VERIFIER</Badge>
      case ETAT_UTILISATEUR.VALIDE:
        return <Badge variant="active">ACTIF</Badge>
      case ETAT_UTILISATEUR.DESACTIVE:
        return <Badge variant="inactive">INACTIF</Badge>

      default:
        return <Badge>{userHistory.status}</Badge>
    }
  }

  const userMutation = useMutation({
    mutationFn: async (props: Variables) => {
      const { userId, values, siret, setFieldError } = props
      const { type, ...value } = values

      try {
        if (user.type === AUTHTYPE.CFA) {
          const { email, first_name, last_name, phone } = values
          await updateEntrepriseCFA(userRecruteur.establishment_id, { email, first_name, last_name, phone })
        } else {
          await updateEntrepriseAdmin(userId, value, siret)
        }
        onChange?.({ opco: "opco" in values ? values.opco : undefined })
        toast({
          title: "Mise à jour enregistrée avec succès",
        })
      } catch (err: any) {
        if (err.message === EntrepriseErrorCodes.PHONE_SAME_AS_CFA) {
          setFieldError("phone", err.message)
        } else if (err.message === EntrepriseErrorCodes.EMAIL_SAME_AS_CFA) {
          setFieldError("email", err.message)
        } else {
          throw err
        }
      }
    },
  })

  const lastUserState: IUserStatusValidationJson = userRecruteur.status.at(-1)
  const establishmentLabel = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret

  return (
    <AnimationContainer>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={userRecruteur} onUpdate={() => onChange?.({})} />
      <Box sx={{ px: fr.spacing("4v"), borderBottom: "1px solid #E3E3FD", mb: fr.spacing("10v") }}>
        {user.type !== "CFA" && (
          <>
            <Typography component="h2" sx={{ fontSize: "32px", ...webkitLineClamp }}>
              {establishmentLabel}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: fr.spacing("5v") }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", maxW: "50%" }}>
                <Box sx={{ ml: fr.spacing("5v") }}>{getUserBadge(lastUserState)}</Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: fr.spacing("2v") }}>{getActionButtons(lastUserState, userRecruteur._id)}</Box>
            </Box>
          </>
        )}
        {user.type === "CFA" && (
          <Box sx={{ mb: fr.spacing("5v"), display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: fr.spacing("2v") }}>
            <Typography sx={{ fontSize: "32px", mx: 0, ...webkitLineClamp }} component="h2">
              {establishmentLabel}
            </Typography>

            <Button priority="secondary" type="button" onClick={() => router.push(PAGES.dynamic.backCfaPageEntreprise(userRecruteur.establishment_id).getPath())}>
              Fermer
            </Button>
          </Box>
        )}
      </Box>
      <Box sx={{ px: fr.spacing("4v") }}>
        <Formik
          validateOnMount={true}
          enableReinitialize={true}
          initialValues={{
            last_name: userRecruteur.last_name,
            first_name: userRecruteur.first_name,
            phone: userRecruteur.phone,
            email: userRecruteur.email,
            opco: userRecruteur.opco,
            type: userRecruteur.type,
            ...isDeclarationExactField,
          }}
          validationSchema={Yup.object().shape({
            last_name: Yup.string().required("champ obligatoire"),
            first_name: Yup.string().required("champ obligatoire"),
            phone: Yup.string()
              .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
              .min(10, "le téléphone est sur 10 chiffres")
              .max(10, "le téléphone est sur 10 chiffres")
              .required("champ obligatoire"),
            email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
            type: Yup.string().default(userRecruteur.type),
            opco: Yup.string().when("type", { is: (v: unknown) => v === AUTHTYPE.ENTREPRISE, then: (schema) => schema.min(1, "champ obligatoire").required("champ obligatoire") }),
            ...isDeclarationExactValidation,
          })}
          onSubmit={async (values, { setFieldError, setSubmitting }) => {
            setSubmitting(true)
            // For companies we update the User Collection and the Formulaire collection at the same time
            userMutation.mutate({ userId: userRecruteur._id, values, siret: userRecruteur.establishment_siret, setFieldError })
            setSubmitting(false)
          }}
        >
          {({ values, isSubmitting, isValid, setFieldValue, errors, touched }) => {
            return (
              <>
                <ConfirmationModificationOpco
                  {...confirmationModificationOpco}
                  establishment_raison_sociale={establishmentLabel}
                  setFieldValue={setFieldValue}
                  previousValue={userRecruteur.opco}
                  newValue={values.opco}
                />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      lg: "repeat(2, 1fr)",
                    },
                    gap: { xs: 0, sm: 2, lg: 5 },
                  }}
                >
                  <Box>
                    <Typography component="h2" sx={{ fontSize: "20px", fontWeight: "700" }}>
                      Informations de contact
                    </Typography>
                    <Box
                      sx={{
                        mt: fr.spacing("8v"),
                      }}
                    >
                      <Form>
                        <CustomInput name="last_name" label="Nom" type="text" value={values.last_name} />
                        <CustomInput name="first_name" label="Prénom" type="test" value={values.first_name} />
                        <CustomInput name="phone" label="Téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                        <CustomInput name="email" label="Email" type="email" value={values.email} />
                        {userRecruteur.type === AUTHTYPE.ENTREPRISE && (
                          <OpcoSelect
                            value={values.opco}
                            name="opco"
                            errors={errors}
                            touched={touched}
                            onChange={(newValue) => {
                              setFieldValue("opco", newValue)
                              confirmationModificationOpco.onOpen()
                            }}
                          />
                        )}
                        {user.type === AUTHTYPE.CFA && (
                          <>
                            <Typography sx={{ color: "#0063CB" }}>
                              <strong>Important :</strong> Ces informations restent confidentielles et ne sont pas visibles par les candidats. Elles sont uniquement utilisées par
                              nos équipes à des fins de contrôles.
                            </Typography>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  onChange={(event) => {
                                    setFieldValue("isDeclarationExact", event.target.checked)
                                  }}
                                  checked={values.isDeclarationExact}
                                />
                              }
                              label={
                                <Typography>
                                  Je certifie que les informations relatives à l’entreprise partenaire sont exactes et vérifiables, et j’accepte que ces données puissent faire
                                  l’objet de contrôles par La bonne alternance.
                                </Typography>
                              }
                              sx={{ mt: fr.spacing("6v") }}
                            />
                          </>
                        )}
                        {userMutation.error && (
                          <Alert sx={{ marginTop: fr.spacing("4v") }} severity="error">
                            {userMutation.error + ""}
                          </Alert>
                        )}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", my: fr.spacing("5v") }}>
                          <Button type="submit" disabled={!isValid || isSubmitting}>
                            {isSubmitting ? (
                              <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />
                            ) : (
                              <ArrowRightLine sx={{ width: 16, height: 16, mr: fr.spacing("2v") }} />
                            )}
                            Enregistrer
                          </Button>
                        </Box>
                      </Form>
                    </Box>
                  </Box>
                  <Box>
                    <InformationLegaleEntreprise siret={userRecruteur.establishment_siret} type={userRecruteur.type as typeof CFA | typeof ENTREPRISE} viewerType={user.type} />
                    {user.type !== "CFA" && (
                      <Box
                        sx={{
                          my: fr.spacing("8v"),
                        }}
                      >
                        <FieldWithValue title="Origine" value={userRecruteur.origin} />
                      </Box>
                    )}
                  </Box>
                </Box>
                {(user.type === AUTHTYPE.ADMIN || user.type === AUTHTYPE.OPCO) && (
                  <>
                    <hr style={{ marginTop: 24 }} />
                    <Box
                      sx={{
                        my: fr.spacing("12v"),
                      }}
                    >
                      <OffresTabs
                        caption="Offres de recrutement en alternance"
                        recruiter={recruiter}
                        buildOfferEditionUrl={(offerId) => {
                          return PAGES.dynamic
                            .offreUpsert({
                              offerId,
                              establishment_id: userRecruteur.establishment_id,
                              userType: user.type,
                              userId: userRecruteur._id,
                              raison_sociale: establishmentLabel,
                            })
                            .getPath()
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        mb: fr.spacing("24v"),
                      }}
                    >
                      <UserValidationHistory histories={userRecruteur.status} />
                    </Box>
                  </>
                )}
              </>
            )
          }}
        </Formik>
      </Box>
    </AnimationContainer>
  )
}
