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
import * as Yup from "yup"

import { AUTHTYPE, USER_STATUS } from "../../../../common/contants"
import useAuth from "../../../../common/hooks/useAuth"
import useUserHistoryUpdate from "../../../../common/hooks/useUserHistoryUpdate"
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
import withAuth from "../../../../components/espace_pro/withAuth"
import { ArrowDropRightLine, ArrowRightLine } from "../../../../theme/components/icons"
import { getUser, updateEntreprise } from "../../../../utils/api"

function DetailEntreprise() {
  const router = useRouter()
  const { userId } = router.query
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationModificationOpco = useDisclosure()

  const client = useQueryClient()
  const toast = useToast()
  const [auth] = useAuth()

  const ActivateUserButton = ({ userId }) => {
    const updateUserHistory = useUserHistoryUpdate(userId, USER_STATUS.ACTIVE)

    return (
      <Button variant="primary" onClick={() => updateUserHistory()}>
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
      case USER_STATUS.WAITING:
        return (
          <>
            <ActivateUserButton userId={userId} />
            <DisableUserButton />
          </>
        )
      case USER_STATUS.ACTIVE:
        return <DisableUserButton />
      case USER_STATUS.DISABLED:
        return <ActivateUserButton userId={userId} />

      default:
        return <></>
    }
  }

  const getUserBadge = (userHistory) => {
    switch (userHistory.status) {
      case USER_STATUS.WAITING:
        return <Badge variant="awaiting">À VERIFIER</Badge>
      case USER_STATUS.ACTIVE:
        return <Badge variant="active">ACTIF</Badge>
      case USER_STATUS.DISABLED:
        return <Badge variant="inactive">INACTIF</Badge>

      default:
        return <Badge>{userHistory.status}</Badge>
    }
  }

  const getUserNavigationContext = () => {
    switch (auth.type) {
      case AUTHTYPE.ADMIN:
        return "/espace-pro/administration/users"
      case AUTHTYPE.OPCO:
        return "/espace-pro/administration/opco"

      default:
        break
    }
  }

  const { data, isLoading }: { data: any; isLoading: boolean } = useQuery("user", () => getUser(userId), { cacheTime: 0 })
  // @ts-expect-error: TODO
  const userMutation = useMutation(({ userId, establishment_id, values }) => updateEntreprise(userId, establishment_id, values), {
    onSuccess: () => {
      client.invalidateQueries("user")
    },
  })

  if (isLoading || !data) {
    return <LoadingEmptySpace />
  }

  const [lastUserState] = data.data.status.slice(-1)
  const establishmentLabel = data.data.establishment_raison_sociale ?? data.data.establishment_siret

  return (
    <AnimationContainer>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} {...data.data} />
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
            <Flex align="center" justify="space-between" mb={5}>
              <Flex align="center" justify="flex-start" maxW="50%">
                <Heading fontSize="32px" noOfLines={2}>
                  {establishmentLabel}
                </Heading>
                <Box ml={5}>{getUserBadge(lastUserState)}</Box>
              </Flex>
              <Stack direction={["column", "column", "column", "row"]} spacing="10px">
                {getActionButtons(lastUserState, data.data._id)}
                {data.data.type === AUTHTYPE.ENTREPRISE ? (
                  data.data.jobs.length ? (
                    lastUserState.status === USER_STATUS.WAITING || lastUserState.status === USER_STATUS.ERROR ? (
                      <Button variant="secondary" isDisabled={true}>
                        Offre en attente de validation
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => router.push(`/espace-pro/administration/opco/entreprise/${data.data.establishment_siret}/${data.data.establishment_id}`)}
                      >
                        Voir les offres
                      </Button>
                    )
                  ) : (
                    <Button variant="secondary" isDisabled={true}>
                      Pas d'offre(s) déposée(s)
                    </Button>
                  )
                ) : null}
              </Stack>
            </Flex>
          </Box>
          <Formik
            validateOnMount={true}
            enableReinitialize={true}
            initialValues={{
              last_name: data.data.last_name,
              first_name: data.data.first_name,
              phone: data.data.phone,
              email: data.data.email,
              opco: data.data.opco,
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
              type: Yup.string().default(data.data.type),
              opco: Yup.string().when("type", { is: (v) => v === AUTHTYPE.ENTREPRISE, then: Yup.string().required("champ obligatoire") }),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              setSubmitting(true)
              // For companies we update the User Collection and the Formulaire collection at the same time
              // @ts-expect-error: TODO
              userMutation.mutate({ userId: data.data._id, establishment_id: data.data.establishment_id, values })
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
                    previousValue={data.data.opco}
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
                          {data.data.type === AUTHTYPE.ENTREPRISE && (
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
                      <InformationLegaleEntreprise {...data.data} />
                    </Box>
                  </SimpleGrid>
                  {(auth.type === AUTHTYPE.OPCO || auth.type === AUTHTYPE.ADMIN) && (
                    <Box mb={12}>
                      {/* @ts-expect-error: TODO */}
                      <UserValidationHistory histories={data.data.status} />
                    </Box>
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
  return <Layout footer={false}>{userId && <DetailEntreprise />}</Layout>
}
export default withAuth(DetailEntreprisePage, "adminLbaR")
