import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Heading, SimpleGrid, Text, useToast } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import * as Yup from "yup"
import { getFormulaire, putFormulaire, updateEntreprise } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { AnimationContainer, CustomInput, InformationLegaleEntreprise, LoadingEmptySpace } from "../../components"
import { ArrowDropRightLine, ArrowRightLine } from "../../theme/components/icons"

const Formulaire = ({ nom, prenom, telephone, email, id_form }) => {
  const toast = useToast()
  const [auth] = useAuth()
  const navigate = useNavigate()
  const client = useQueryClient()

  const entrepriseMutation = useMutation(({ userId, formId, values }) => updateEntreprise(userId, formId, values), {
    onSuccess: () => {
      toast({
        title: "Entreprise mise à jour avec succès.",
        position: "top-right",
        status: "success",
        duration: 4000,
      })
      navigate(`/administration/entreprise/${id_form}`, {
        replace: true,
      })
      client.invalidateQueries("formulaire-edition")
    },
  })

  const cfaMutation = useMutation(({ formId, values }) => putFormulaire(formId, values), {
    onSuccess: () => {
      toast({
        title: "Entreprise mise à jour avec succès.",
        position: "top-right",
        status: "success",
        duration: 4000,
      })
      navigate(`/administration/entreprise/${id_form}`, {
        replace: true,
      })
      client.invalidateQueries("formulaire-edition")
    },
  })

  const submitForm = async (values, { setSubmitting, setFieldError }) => {
    if (auth.type === AUTHTYPE.ENTREPRISE) {
      entrepriseMutation.mutate(
        { userId: auth.id, formId: id_form, values },
        {
          onError: (error) => {
            switch (error.response.data.reason) {
              case "EMAIL_TAKEN":
                setFieldError("email", "l'adresse email est déjà utilisé")
                break

              default:
                break
            }
          },
        }
      )
    } else {
      cfaMutation.mutate({ formId: id_form, values })
    }

    setSubmitting(false)
  }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        nom,
        prenom,
        telephone,
        email,
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
        nom: Yup.string().required("champ obligatoire"),
        prenom: Yup.string().required("champ obligatoire"),
        telephone: Yup.string()
          .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
          .min(10, "le téléphone est sur 10 chiffres")
          .max(10, "le téléphone est sur 10 chiffres")
          .required("champ obligatoire"),
      })}
      onSubmit={submitForm}
    >
      {(informationForm) => {
        return (
          <Form>
            <CustomInput required={false} name="nom" label="Nom" type="text" value={informationForm.values.nom} />
            <CustomInput required={false} name="prenom" label="Prénom" type="text" value={informationForm.values.prenom} />
            <CustomInput
              required={false}
              name="telephone"
              label="Numéro de téléphone"
              type="tel"
              pattern="[0-9]{10}"
              maxLength="10"
              info="Le numéro de téléphone sera visible sur l'offre d'emploi"
              value={informationForm.values.telephone}
            />
            <CustomInput
              required={false}
              name="email"
              label="Email"
              type="email"
              value={informationForm.values.email}
              info={
                auth.type === AUTHTYPE.ENTREPRISE ? "Il s’agit de l’adresse qui vous permettra de vous connecter à votre compte. Privilégiez votre adresse professionnelle" : null
              }
            />
            <Flex justifyContent="flex-end" alignItems="center" mt={5}>
              <Button as={Link} variant="secondary" mr={5} onClick={() => navigate(-1)}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="form"
                leftIcon={<ArrowRightLine width={5} />}
                isActive={informationForm.isValid}
                isDisabled={!informationForm.isValid || informationForm.isSubmitting}
              >
                Enregister
              </Button>
            </Flex>
          </Form>
        )
      }}
    </Formik>
  )
}

export default () => {
  const navigate = useNavigate()
  const params = useParams()
  const [auth] = useAuth()

  let { data, isLoading } = useQuery("formulaire-edition", () => getFormulaire(params.id_form), { cacheTime: 0 })

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  // add type ENTREPRISE for legale information
  const entreprise = { ...data.data, type: AUTHTYPE.ENTREPRISE }

  return (
    <AnimationContainer>
      <Container maxW="container.xl" my={5}>
        <Box my={5}>
          <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => navigate(-1)} textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{data.data.raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Breadcrumb>
        </Box>
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 10]}>
          <Box>
            <Heading>Vos informations de contact</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2}>
              {auth.type === AUTHTYPE.ENTREPRISE
                ? "Vos informations de contact seront visibles sur les offres mises en ligne. Vous recevrez les candidatures sur l’email enregistré."
                : "il s’agit de l’entreprise qui vous a mandaté pour gérer ses offres d’emploi. Ces informations ne seront pas visibles sur l'offre."}
            </Text>
            <Box mt={4}>
              <Formulaire {...entreprise} />
            </Box>
          </Box>
          <Box>
            <InformationLegaleEntreprise {...entreprise} />
          </Box>
        </SimpleGrid>
      </Container>
    </AnimationContainer>
  )
}
