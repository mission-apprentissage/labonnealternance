"use client"
import { Badge, Box, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, SimpleGrid, Spinner, Stack, Text, useDisclosure, useToast } from "@chakra-ui/react"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { useMutation } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import { INewSuperUser, IUserStatusValidationJson } from "shared"
import { AUTHTYPE, CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import * as Yup from "yup"

import CustomInput from "@/app/(espace-pro)/_components/CustomInput"
import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { OffresTabs } from "@/app/(espace-pro)/espace-pro/(connected)/_components/OffresTabs"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { AnimationContainer, ConfirmationDesactivationUtilisateur, ConfirmationModificationOpco, UserValidationHistory } from "@/components/espace_pro"
import { OpcoSelect } from "@/components/espace_pro/CreationRecruteur/OpcoSelect"
import { FieldWithValue } from "@/components/espace_pro/FieldWithValue"
import { ArrowRightLine } from "@/theme/components/icons"
import { updateEntrepriseAdmin } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

type Variables = { userId: string; values: INewSuperUser; siret: string }

export default function DetailEntreprise({ userRecruteur, recruiter, onChange }: { userRecruteur: any; recruiter: any; onChange?: (props: { opco?: OPCOS_LABEL }) => void }) {
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationModificationOpco = useDisclosure()

  const toast = useToast()
  const { user } = useConnectedSessionClient()

  const ActivateUserButton = ({ userId }) => {
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

  const getActionButtons = (userHistory, userId) => {
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

  const getUserBadge = (userHistory) => {
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
      await updateEntrepriseAdmin(userId, value, siret)
      onChange?.({ opco: "opco" in values ? values.opco : undefined })
    },
    onSuccess: () => {
      toast({
        title: "Mise à jour enregistrée avec succès",
        position: "top-right",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
    },
  })

  const lastUserState: IUserStatusValidationJson = userRecruteur.status.at(-1)
  const establishmentLabel = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret

  return (
    <AnimationContainer>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={userRecruteur} onUpdate={() => onChange?.({})} />

      <Box borderBottom="1px solid #E3E3FD" mb={10}>
        <Heading fontSize="32px" noOfLines={2}>
          {establishmentLabel}
        </Heading>
        <Flex align="center" justify="space-between" mb={5}>
          <Flex align="center" justify="flex-start" maxW="50%">
            <Box ml={5}>{getUserBadge(lastUserState)}</Box>
          </Flex>
          <Stack direction={["column", "column", "column", "row"]} spacing="10px">
            {getActionButtons(lastUserState, userRecruteur._id)}
          </Stack>
        </Flex>
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
          opco: Yup.string().when("type", { is: (v) => v === AUTHTYPE.ENTREPRISE, then: Yup.string().required("champ obligatoire") }),
        })}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true)
          // For companies we update the User Collection and the Formulaire collection at the same time
          userMutation.mutate({ userId: userRecruteur._id, values, siret: userRecruteur.establishment_siret })

          setSubmitting(false)
        }}
      >
        {({ values, isSubmitting, isValid, setFieldValue, errors }) => {
          return (
            <>
              <ConfirmationModificationOpco
                {...confirmationModificationOpco}
                establishment_raison_sociale={establishmentLabel}
                setFieldValue={setFieldValue}
                previousValue={userRecruteur.opco}
                newValue={values.opco}
              />
              <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 10]}>
                <Box>
                  <Text fontSize="20px" fontWeight="700">
                    Informations de contact
                  </Text>
                  <Box mt={4}>
                    <Form>
                      <CustomInput name="last_name" label="Nom" type="text" value={values.last_name} />
                      <CustomInput name="first_name" label="Prénom" type="test" value={values.first_name} />
                      <CustomInput name="phone" label="Téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                      <CustomInput name="email" label="Email" type="email" value={values.email} />
                      {userRecruteur.type === AUTHTYPE.ENTREPRISE && (
                        <FormControl>
                          <FormLabel>OPCO</FormLabel>
                          <FormHelperText pb={2}>Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.</FormHelperText>
                          <OpcoSelect
                            value={values.opco}
                            name="opco"
                            onChange={(newValue) => {
                              setFieldValue("opco", newValue)
                              confirmationModificationOpco.onOpen()
                            }}
                          />
                          <FormErrorMessage>{errors.opco as string}</FormErrorMessage>
                        </FormControl>
                      )}
                      <Flex justify="flex-end" mt={10}>
                        <Button type="submit" disabled={!isValid || isSubmitting}>
                          {isSubmitting ? <Spinner mr={2} /> : <ArrowRightLine mr={2} />}Enregistrer
                        </Button>
                      </Flex>
                    </Form>
                  </Box>
                </Box>
                <Box>
                  <InformationLegaleEntreprise siret={userRecruteur.establishment_siret} type={userRecruteur.type as typeof CFA | typeof ENTREPRISE} />
                  <Box my={4}>
                    <FieldWithValue title="Origine" value={userRecruteur.origin} />
                  </Box>
                </Box>
              </SimpleGrid>
              {(user.type === AUTHTYPE.ADMIN || user.type === AUTHTYPE.OPCO) && (
                <>
                  <hr style={{ marginTop: 24 }} />
                  <Box my={6}>
                    <Text fontSize="20px" lineHeight="32px" fontWeight="700" mb={6}>
                      Offres de recrutement en alternance
                    </Text>
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
  )
}
