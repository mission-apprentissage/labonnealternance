import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Heading, SimpleGrid, Text, useToast } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../../../../common/contants"
import { AnimationContainer, CustomInput, InformationLegaleEntreprise, Layout, LoadingEmptySpace } from "../../../../../components/espace_pro"
import { authProvider, withAuth } from "../../../../../components/espace_pro/withAuth"
import { ArrowDropRightLine, ArrowRightLine } from "../../../../../theme/components/icons"
import { getFormulaire, updateEntreprise, updateFormulaire } from "../../../../../utils/api"

const Formulaire = ({
  last_name,
  first_name,
  phone,
  email,
  establishment_id,
}: {
  last_name?: string
  first_name?: string
  phone?: string
  email?: string
  establishment_id?: string
}) => {
  const toast = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const client = useQueryClient()

  /**
   * KBA 20230511 : values for recruiter collection are casted in api.js file directly. form values must remain as awaited in userRecruteur collection
   */
  // TODO
  const entrepriseMutation = useMutation<any, unknown, any, unknown>(({ userId, values }) => updateEntreprise(userId, values), {
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

  const cfaMutation = useMutation<void, unknown, { establishment_id: string; values: any }, unknown>(
    ({ establishment_id, values }) => updateFormulaire(establishment_id, values).then(() => {}),
    {
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
    }
  )

  const submitForm = async (values, { setSubmitting, setFieldError }) => {
    if (user.type === AUTHTYPE.ENTREPRISE) {
      entrepriseMutation.mutate(
        { userId: user._id, values },
        {
          onError: (error: any) => {
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
      cfaMutation.mutate({ establishment_id, values })
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
                user.type === AUTHTYPE.ENTREPRISE ? "Il s’agit de l’adresse qui vous permettra de vous connecter à votre compte. Privilégiez votre adresse professionnelle" : null
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

function EditionEntrepriseContact() {
  const router = useRouter()
  const { user } = useAuth()

  const { establishment_id } = router.query as { establishment_id: string }
  // TODO pourquoi afficher le formulaire ?
  const { data: formulaire, isLoading } = useQuery("formulaire-edition", () => getFormulaire(establishment_id), { cacheTime: 0, enabled: !!establishment_id })

  if (isLoading || !establishment_id) {
    return <LoadingEmptySpace />
  }

  // add type ENTREPRISE for legale information
  const entreprise = { ...formulaire, type: AUTHTYPE.ENTREPRISE }
  const siret = formulaire.establishment_siret

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
                <BreadcrumbLink textStyle="xs">{entreprise.establishment_raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Breadcrumb>
        </Box>
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 10]}>
          <Box>
            <Heading>Vos informations de contact</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2}>
              {user.type === AUTHTYPE.ENTREPRISE
                ? "Vos informations de contact seront visibles sur les offres mises en ligne. Vous recevrez les candidatures sur l’email enregistré."
                : "il s’agit de l’entreprise qui vous a mandaté pour gérer ses offres d’emploi. Ces informations ne seront pas visibles sur l'offre."}
            </Text>
            <Box mt={4}>
              <Formulaire {...entreprise} />
            </Box>
          </Box>
          <Box>
            <InformationLegaleEntreprise type={ENTREPRISE} siret={siret} />
          </Box>
        </SimpleGrid>
      </Container>
    </AnimationContainer>
  )
}

function EditionEntrepriseContactPage() {
  return (
    <Layout footer={false}>
      <EditionEntrepriseContact />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(EditionEntrepriseContactPage))
