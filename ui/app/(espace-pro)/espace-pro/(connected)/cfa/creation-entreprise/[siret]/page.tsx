"use client"

import { Box, Container, Flex, Grid, GridItem, Heading, Spinner, Text, useToast } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { Form, Formik } from "formik"
import { useParams, useRouter } from "next/navigation"
import { ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"

import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/compte/_components/InformationLegaleEntreprise"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { phoneValidation } from "@/common/validation/fieldValidations"
import { AnimationContainer, CustomInput } from "@/components/espace_pro"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { ArrowRightLine } from "@/theme/components/icons"
import { postFormulaire } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const Formulaire = ({ siret: establishment_siret }: { siret: string }) => {
  const router = useRouter()
  const toast = useToast()
  const { user } = useConnectedSessionClient()

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    postFormulaire(user._id.toString(), { ...values, establishment_siret })
      .then((data) => {
        setSubmitting(false)
        toast({
          title: "Entreprise créée avec succès.",
          position: "top-right",
          status: "success",
          duration: 4000,
        })
        router.push(PAGES.dynamic.backCfaEntrepriseCreationOffre(data.establishment_id).getPath())
      })
      .catch(({ response }) => {
        const payload: { error: string; statusCode: number; message: string } = response.data as any
        setFieldError("email", payload.message)
        setSubmitting(false)
      })
  }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        last_name: undefined,
        first_name: undefined,
        phone: undefined,
        email: undefined,
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
        last_name: Yup.string().required("champ obligatoire"),
        first_name: Yup.string().required("champ obligatoire"),
        phone: phoneValidation().required("champ obligatoire"),
      })}
      onSubmit={submitForm}
    >
      {(informationForm) => {
        return (
          <Form>
            <CustomInput required={false} name="last_name" label="Nom" type="text" value={informationForm.values.last_name} />
            <CustomInput required={false} name="first_name" label="Prénom" type="text" value={informationForm.values.first_name} />
            <CustomInput required={false} name="phone" label="Numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={informationForm.values.phone} />
            <CustomInput required={false} name="email" label="Email" type="email" value={informationForm.values.email} />
            <Flex justifyContent="flex-end" alignItems="center" mt={5}>
              <Box mr={5}>
                <Button type="button" priority="secondary" onClick={() => router.push(PAGES.static.backCfaCreationEntreprise.getPath())}>
                  Annuler
                </Button>
              </Box>
              <Button type="submit" disabled={!informationForm.isValid || informationForm.isSubmitting}>
                {informationForm.isSubmitting ? <Spinner mr={2} /> : <ArrowRightLine width={5} mr={2} />}Suivant
              </Button>
            </Flex>
          </Form>
        )
      }}
    </Formik>
  )
}

function CreationEntrepriseDetail({ siret }: { siret: string }) {
  return (
    <AnimationContainer>
      <Container maxW="container.xl" my={5}>
        <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.static.backCfaCreationEntreprise, PAGES.dynamic.backCfaEntrepriseCreationDetail(siret)]} />
        <Grid templateRows={["1fr", ".5fr 2fr"]} templateColumns={["1fr", "4fr 5fr"]} gap={6}>
          <GridItem>
            <Heading>Informations de contact</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2}>
              Il s’agit des informations de contact de votre entreprise partenaire. Ces informations ne seront pas visibles sur l’offre.
            </Text>
          </GridItem>
          <GridItem rowStart={["auto", 2]}>
            <Formulaire siret={siret} />
          </GridItem>
          <GridItem rowStart={["auto", 2]} pt={[4, 8]} minW="0">
            <InformationLegaleEntreprise siret={siret} type={ENTREPRISE} />
          </GridItem>
        </Grid>
      </Container>
    </AnimationContainer>
  )
}
function CreationEntrepriseDetailPage() {
  const { siret } = useParams() as { siret: string }

  return (
    <DepotSimplifieStyling>
      <CreationEntrepriseDetail siret={siret} />
    </DepotSimplifieStyling>
  )
}

export default CreationEntrepriseDetailPage
