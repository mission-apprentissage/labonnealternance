"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Alert, Box, CircularProgress, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import { INewSuperUser, IUserStatusValidationJson } from "shared"
import { AUTHTYPE, CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import * as Yup from "yup"

import Badge from "@/app/(espace-pro)/_components/Badge"
import { FieldWithValue } from "@/app/(espace-pro)/_components/FieldWithValue"
import { OpcoSelect } from "@/app/(espace-pro)/_components/OpcoSelect"
import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { OffresTabs } from "@/app/(espace-pro)/espace-pro/(connected)/_components/OffresTabs"
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

type Variables = { userId: string; values: INewSuperUser; siret: string }

export default function DetailEntreprise({ userRecruteur, recruiter, onChange }: { userRecruteur: any; recruiter?: any; onChange?: (props: { opco?: OPCOS_LABEL }) => void }) {
  const router = useRouter()
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationModificationOpco = useDisclosure()

  const { toast, ToastComponent } = useToast()
  const { user } = useConnectedSessionClient()

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
    mutationFn: async (variables: Variables) => {
      const { userId, values, siret } = variables
      const { type, ...value } = values

      if (user.type === AUTHTYPE.CFA) {
        const { email, first_name, last_name, phone } = values
        await updateEntrepriseCFA(userRecruteur.establishment_id, { email, first_name, last_name, phone })
      } else {
        await updateEntrepriseAdmin(userId, value, siret)
      }
      onChange?.({ opco: "opco" in values ? values.opco : undefined })
    },
    onSuccess: () => {
      toast({
        title: "Mise à jour enregistrée avec succès",
        status: "success",
      })
    },
  })

  const lastUserState: IUserStatusValidationJson = userRecruteur.status.at(-1)
  const establishmentLabel = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret

  return (
    <>
      {ToastComponent}
      <AnimationContainer>
        <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={userRecruteur} onUpdate={() => onChange?.({})} />

        <Box sx={{ borderBottom: "1px solid #E3E3FD", mb: fr.spacing("5w") }}>
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
            opco: Yup.string().when("type", { is: (v: unknown) => v === AUTHTYPE.ENTREPRISE, then: Yup.string().required("champ obligatoire") }),
          })}
          onSubmit={async (values, { setSubmitting }) => {
            setSubmitting(true)
            // For companies we update the User Collection and the Formulaire collection at the same time
            userMutation.mutate({ userId: userRecruteur._id, values, siret: userRecruteur.establishment_siret })

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
                    <Box mt={4}>
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
                        {userMutation.error && (
                          <Alert sx={{ marginTop: fr.spacing("2w") }} severity="error">
                            {userMutation.error + ""}
                          </Alert>
                        )}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", my: fr.spacing("5v") }}>
                          <Button type="submit" disabled={!isValid || isSubmitting}>
                            {isSubmitting ? (
                              <CircularProgress sx={{ color: "inherit", mr: fr.spacing("1w") }} thickness={4} size={20} />
                            ) : (
                              <ArrowRightLine sx={{ width: 16, height: 16, mr: fr.spacing("1w") }} />
                            )}
                            Enregistrer
                          </Button>
                        </Box>
                      </Form>
                    </Box>
                  </Box>
                  <Box>
                    <InformationLegaleEntreprise siret={userRecruteur.establishment_siret} type={userRecruteur.type as typeof CFA | typeof ENTREPRISE} />
                    {user.type !== "CFA" && (
                      <Box my={4}>
                        <FieldWithValue title="Origine" value={userRecruteur.origin} />
                      </Box>
                    )}
                  </Box>
                </Box>
                {(user.type === AUTHTYPE.ADMIN || user.type === AUTHTYPE.OPCO) && (
                  <>
                    <hr style={{ marginTop: 24 }} />
                    <Box my={6}>
                      <Typography sx={{ fontSize: "20px", lineHeight: "32px", fontWeight: "700", mb: fr.spacing("3w") }}>Offres de recrutement en alternance</Typography>
                      <OffresTabs
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
                    <Box mb={12}>
                      <UserValidationHistory histories={userRecruteur.status} />
                    </Box>
                  </>
                )}
              </>
            )
          }}
        </Formik>
      </AnimationContainer>
    </>
  )
}
