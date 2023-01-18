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
  Select,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useNavigate, useParams } from "react-router-dom"
import * as Yup from "yup"
import { getUser, updateEntreprise } from "../../api"
import { AUTHTYPE, USER_STATUS } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import useUserHistoryUpdate from "../../common/hooks/useUserHistoryUpdate"
import {
  AnimationContainer,
  ConfirmationDesactivationUtilisateur,
  ConfirmationModificationOpco,
  CustomInput,
  InformationLegaleEntreprise,
  Layout,
  LoadingEmptySpace,
  UserValidationHistory,
} from "../../components"
import { ArrowDropRightLine, ArrowRightLine } from "../../theme/components/icons"

export default () => {
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationModificationOpco = useDisclosure()
  const params = useParams()
  const navigate = useNavigate()
  const client = useQueryClient()
  const toast = useToast()
  const [auth] = useAuth()

  const { data, isLoading } = useQuery("user", () => getUser(params.userId), { cacheTime: 0 })

  const userMutation = useMutation(({ userId, formId, values }) => updateEntreprise(userId, formId, values), {
    onSuccess: () => {
      client.invalidateQueries("user")
    },
  })

  const ActivateUserButton = ({ userId }) => {
    const updateUserHistory = useUserHistoryUpdate(userId, USER_STATUS.ACTIVE)

    return (
      <Button variant="primary" onClick={() => updateUserHistory()}>
        Activer le compte
      </Button>
    )
  }

  const DisableUserButton = ({ userId }) => {
    return (
      <Button variant="primary-red" onClick={() => confirmationDesactivationUtilisateur.onOpen()}>
        Désactiver le compte
      </Button>
    )
  }

  const getActionButtons = (userHistory, userId) => {
    switch (userHistory.statut) {
      case USER_STATUS.WAITING:
        return (
          <>
            <ActivateUserButton userId={userId} />
            <DisableUserButton userId={userId} />
          </>
        )
      case USER_STATUS.ACTIVE:
        return <DisableUserButton userId={userId} />
      case USER_STATUS.DISABLED:
        return <ActivateUserButton userId={userId} />

      default:
        return <></>
    }
  }

  const getUserBadge = (userHistory) => {
    switch (userHistory.statut) {
      case USER_STATUS.WAITING:
        return <Badge variant="awaiting">À VERIFIER</Badge>
      case USER_STATUS.ACTIVE:
        return <Badge variant="active">ACTIF</Badge>
      case USER_STATUS.DISABLED:
        return <Badge variant="inactive">INACTIF</Badge>

      default:
        return <Badge>{userHistory.statut}</Badge>
    }
  }

  const getUserNavigationContext = () => {
    switch (auth.type) {
      case AUTHTYPE.ADMIN:
        return "/administration/users"
      case AUTHTYPE.OPCO:
        return "/administration/opco"

      default:
        break
    }
  }

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const [lastUserState] = data.data.etat_utilisateur.slice(-1)

  return (
    <AnimationContainer>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} raison_sociale={data.data.raison_sociale} _id={data.data._id} />
      <Layout displayNavigationMenu={false} header={false} footer={false}>
        <Container maxW="container.xl">
          <Box mt="16px" mb={6}>
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => navigate(getUserNavigationContext())} textStyle="xs">
                  Entreprises
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{data.data.raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
          <Box borderBottom="1px solid #E3E3FD" mb={10}>
            <Flex align="center" justify="space-between" mb={5}>
              <Flex align="center" justify="flex-start" maxW="50%">
                <Heading fontSize="32px" noOfLines={2}>
                  {data.data.raison_sociale}
                </Heading>
                <Box ml={5}>{getUserBadge(lastUserState)}</Box>
              </Flex>
              <Stack direction={["column", "column", "column", "row"]} spacing="10px">
                {getActionButtons(lastUserState, data.data._id)}
                <Button variant="secondary" onClick={() => navigate(`/administration/opco/entreprise/${data.data.siret}/${data.data.id_form}`)}>
                  Voir les offres
                </Button>
              </Stack>
            </Flex>
          </Box>
          <Formik
            validateOnMount={true}
            enableReinitialize={true}
            initialValues={{
              nom: data.data.nom,
              prenom: data.data.prenom,
              telephone: data.data.telephone,
              email: data.data.email,
              opco: data.data.opco,
            }}
            validationSchema={Yup.object().shape({
              nom: Yup.string().required("champ obligatoire"),
              prenom: Yup.string().required("champ obligatoire"),
              telephone: Yup.string()
                .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
                .min(10, "le téléphone est sur 10 chiffres")
                .max(10, "le téléphone est sur 10 chiffres")
                .required("champ obligatoire"),
              email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
              opco: Yup.string().required("champ obligatoire"),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              setSubmitting(true)
              // For companies we update the User Collection and the Formulaire collection at the same time
              userMutation.mutate({ userId: data.data._id, formId: data.data.id_form, values })
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
                    raison_sociale={data.data.raison_sociale}
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
                          <CustomInput name="nom" label="Nom" type="text" value={values.nom} />
                          <CustomInput name="prenom" label="Prénom" type="test" value={values.prenom} />
                          <CustomInput name="telephone" label="Téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.telephone} />
                          <CustomInput name="email" label="Email" type="email" value={values.email} />
                          <FormControl>
                            <FormLabel>OPCO</FormLabel>
                            <FormHelperText pb={2}>Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.</FormHelperText>
                            <Select
                              variant="outline"
                              size="md"
                              name="opco"
                              mr={3}
                              onChange={(e) => {
                                setFieldValue("opco", e.target.value)
                                confirmationModificationOpco.onOpen()
                              }}
                              value={values.opco}
                            >
                              <option hidden>Sélectionnez un OPCO</option>
                              <option value="AFDAS">AFDAS</option>
                              <option value="AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre">AKTO</option>
                              <option value="ATLAS">ATLAS</option>
                              <option value="Constructys">Constructys</option>
                              <option value="L'Opcommerce">L'Opcommerce</option>
                              <option value="OCAPIAT">OCAPIAT</option>
                              <option value="OPCO 2i">Opco 2i</option>
                              <option value="Opco entreprises de proximité">Opco EP</option>
                              <option value="Opco Mobilités">Opco Mobilités</option>
                              <option value="Opco Santé">Opco Santé</option>
                              <option value="Uniformation, l'Opco de la Cohésion sociale">Uniformation</option>
                              <option value="inconnue">Je ne sais pas</option>
                            </Select>
                            <FormErrorMessage>{errors.opco}</FormErrorMessage>
                          </FormControl>
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
                  {auth.type === AUTHTYPE.OPCO && (
                    <Box mb={12}>
                      <UserValidationHistory histories={data.data.etat_utilisateur} />
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
