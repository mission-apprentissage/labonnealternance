import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Heading, SimpleGrid, Text, useToast } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useMutation, useQuery, useQueryClient } from "react-query"
import * as Yup from "yup"

import { AUTHTYPE } from "../../../../../common/contants"
import useAuth from "../../../../../common/hooks/useAuth"
import { AnimationContainer, CustomInput, InformationLegaleEntreprise, LoadingEmptySpace } from "../../../../../components/espace_pro"
import { ArrowDropRightLine, ArrowRightLine } from "../../../../../theme/components/icons"
import { getFormulaire, putFormulaire, updateEntreprise } from "../../../../../utils/api"

const Formulaire = ({ last_name, first_name, phone, email, establishment_id }) => {
  const toast = useToast()
  const [auth] = useAuth()
  const router = useRouter()
  const client = useQueryClient()

  /**
   * KBA 20230511 : values for recruiter collection are casted in api.js file directly. form values must remain as awaited in userRecruteur collection
   */
  const entrepriseMutation = useMutation(({ userId, establishment_id, values }) => updateEntreprise(userId, establishment_id, values), {
    onSuccess: () => {
      toast({
        title: "Entreprise mise à jour avec succès.",
        position: "top-right",
        status: "success",
        duration: 4000,
      })
      router.push(`/espace-pro/administration/entreprise/${establishment_id}`)
      client.invalidateQueries("formulaire-edition")
    },
  })

  const cfaMutation = useMutation(({ establishment_id, values }) => putFormulaire(establishment_id, values), {
    onSuccess: () => {
      toast({
        title: "Entreprise mise à jour avec succès.",
        position: "top-right",
        status: "success",
        duration: 4000,
      })
      router.push(`/espace-pro/administration/entreprise/${establishment_id}`)
      client.invalidateQueries("formulaire-edition")
    },
  })

  const submitForm = async (values, { setSubmitting, setFieldError }) => {
    if (auth.type === AUTHTYPE.ENTREPRISE) {
      entrepriseMutation.mutate(
        { userId: auth.id, establishment_id: establishment_id, values },
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
      cfaMutation.mutate({ establishment_id: establishment_id, values })
    }

    setSubmitting(false)
  }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        last_name,
        first_name,
        phone,
        email,
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
        last_name: Yup.string().required("champ obligatoire"),
        first_name: Yup.string().required("champ obligatoire"),
        phone: Yup.string()
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
            <CustomInput required={false} name="last_name" label="Nom" type="text" value={informationForm.values.last_name} />
            <CustomInput required={false} name="first_name" label="Prénom" type="text" value={informationForm.values.first_name} />
            <CustomInput
              required={false}
              name="phone"
              label="Numéro de téléphone"
              type="tel"
              pattern="[0-9]{10}"
              maxLength="10"
              info="Le numéro de téléphone sera visible sur l'offre d'emploi"
              value={informationForm.values.phone}
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
              <Button variant="secondary" mr={5} onClick={() => router.back()}>
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

export default function EditionEntrepriseContact() {
  const router = useRouter()
  const [auth] = useAuth()

  let { data, isLoading } = useQuery("formulaire-edition", () => getFormulaire(router.query.establishment_id), { cacheTime: 0 })

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
                <BreadcrumbLink textDecoration="underline" onClick={() => router.back()} textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{data.data.establishment_raison_sociale}</BreadcrumbLink>
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
