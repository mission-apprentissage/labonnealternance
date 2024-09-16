import {
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { IUserStatusValidation } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR } from "shared/constants/recruteur"
import * as Yup from "yup"

import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { FieldWithValue } from "@/components/espace_pro/FieldWithValue"
import { OffresTabs } from "@/components/espace_pro/OffresTabs"
import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../../../common/contants"
import {
  AnimationContainer,
  ConfirmationDesactivationUtilisateur,
  ConfirmationModificationOpco,
  CustomInput,
  InformationLegaleEntreprise,
  Layout,
  LoadingEmptySpace,
  UserValidationHistory,
} from "../../../../components/espace_pro"
import { OpcoSelect } from "../../../../components/espace_pro/CreationRecruteur/OpcoSelect"
import { authProvider, withAuth } from "../../../../components/espace_pro/withAuth"
import { ArrowDropRightLine, ArrowRightLine } from "../../../../theme/components/icons"
import { getFormulaire, getUser, updateEntrepriseAdmin } from "../../../../utils/api"

function DetailEntreprise() {
  const router = useRouter()
  const { userId } = router.query as { userId: string }
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationModificationOpco = useDisclosure()

  const client = useQueryClient()
  const toast = useToast()
  const { user } = useAuth()

  const ActivateUserButton = ({ userId }) => {
    const { activate } = useUserPermissionsActions(userId)

    return (
      <Button variant="primary" onClick={() => activate()}>
        Activer le compte
      </Button>
    )
  }

  const DisableUserButton = () => {
    return (
      <Button variant="primary-red" onClick={() => confirmationDesactivationUtilisateur.onOpen()}>
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

  const getUserNavigationContext = () => {
    switch (user.type) {
      case AUTHTYPE.ADMIN:
        return "/espace-pro/administration/users"
      case AUTHTYPE.OPCO:
        return "/espace-pro/administration/opco"

      default:
        break
    }
  }

  const { data: userRecruteur, isLoading } = useQuery("user", () => getUser(userId), { cacheTime: 0, enabled: !!userId })
  const { data: recruiter, isLoading: recruiterLoading } = useQuery(["recruiter", userRecruteur?.establishment_id], {
    enabled: Boolean(userRecruteur?.establishment_id),
    queryFn: () => getFormulaire(userRecruteur.establishment_id),
  })
  // @ts-expect-error: TODO
  const userMutation = useMutation(({ userId, values }) => updateEntrepriseAdmin(userId, values, userRecruteur.establishment_siret), {
    onSuccess: () => {
      client.invalidateQueries("user")
    },
  })

  if (isLoading || !userRecruteur || !userId || recruiterLoading) {
    return <LoadingEmptySpace />
  }

  const lastUserState: IUserStatusValidation = userRecruteur.status.at(-1)
  const establishmentLabel = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret

  console.log("ADMIN USERS : ", router.query)

  return (
    <AnimationContainer>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={userRecruteur} />
      <Layout displayNavigationMenu={false} header={false} footer={false}>
        <Container maxW="container.xl">
          <Box mt="16px" mb={6}>
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => router.push(getUserNavigationContext())} textStyle="xs">
                  Entreprises
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{establishmentLabel}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
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
              // @ts-expect-error: TODO
              userMutation.mutate({ userId: userRecruteur._id, values })
              toast({
                title: "Mise à jour enregistrée avec succès",
                position: "top-right",
                status: "success",
                duration: 2000,
                isClosable: true,
              })
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
                            <Button type="submit" variant="form" leftIcon={<ArrowRightLine />} isActive={isValid} isDisabled={!isValid || isSubmitting} isLoading={isSubmitting}>
                              Enregistrer
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
                        <OffresTabs establishmentId={userRecruteur.establishment_id} userContext="ADMIN" recruiter={recruiter} />
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
        </Container>
      </Layout>
    </AnimationContainer>
  )
}

function DetailEntreprisePage() {
  const router = useRouter()
  const { userId } = router.query
  return (
    <Layout displayNavigationMenu={false} footer={false}>
      {userId && <DetailEntreprise />}
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(DetailEntreprisePage, "admin"))
