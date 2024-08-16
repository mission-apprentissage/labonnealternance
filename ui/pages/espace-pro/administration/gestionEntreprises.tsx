import { CheckIcon } from "@chakra-ui/icons"
import { Alert, AlertIcon, Box, Button, Flex, Spinner, Text } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useState } from "react"
import { useMutation, useQuery } from "react-query"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import * as Yup from "yup"
import { z } from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import { phoneValidation } from "@/common/validation/fieldValidations"
import { Breadcrumb } from "@/components/espace_pro/common/components/Breadcrumb"
import { EAdminPages } from "@/components/espace_pro/Layout/NavigationAdmin"
import { getCompanyContactInfo, putCompanyContactInfo } from "@/utils/api"

import { CustomInput, Layout } from "../../../components/espace_pro"
import { authProvider, withAuth } from "../../../components/espace_pro/withAuth"
import { SearchLine } from "../../../theme/components/icons"

function FormulaireRechercheEntreprise({ onSiretChange }: { onSiretChange: (newSiret: string) => void }) {
  const submitSearchForSiret = async ({ siret }: { siret: string }) => {
    const formattedSiret = siret.replace(/[^0-9]/g, "")
    onSiretChange(formattedSiret)
  }

  return (
    <Formik
      validateOnMount
      initialValues={{ siret: undefined }}
      validationSchema={toFormikValidationSchema(
        z.object({
          siret: extensions.siret,
        })
      )}
      onSubmit={submitSearchForSiret}
    >
      {({ values, isValid, dirty }) => {
        return (
          <Form>
            <CustomInput required={true} name="siret" label="SIRET de l'établissement" type="text" value={values.siret} />
            <Flex justify="flex-start">
              <Button type="submit" variant="form" data-testid="search_for_algo_company" leftIcon={<SearchLine width={5} />} isActive={isValid} isDisabled={!isValid || !dirty}>
                Chercher
              </Button>
            </Flex>
          </Form>
        )
      }}
    </Formik>
  )
}

function FormulaireModificationEntreprise({ siret }: { siret: string }) {
  const { isLoading, data, error: readError, refetch } = useQuery(["getCompany", siret], () => getCompanyContactInfo(siret), { enabled: Boolean(siret), retry: false })
  const [hasUpdated, setHasUpdated] = useState(false)
  const updateEntreprise = useMutation(
    "updateEntreprise",
    ({ phone, email }: { phone: string; email: string }) => putCompanyContactInfo({ phone: phone ?? "", email: email ?? "", siret }),
    {
      onSuccess: () => {
        refetch()
        setHasUpdated(true)
      },
      onError: () => {
        setHasUpdated(false)
      },
    }
  )
  const { error: updateError } = updateEntreprise

  if (isLoading) {
    return <Spinner size="lg" my={5} />
  }
  if (!siret) {
    return null
  }
  if (readError) {
    return (
      <Alert>
        <AlertIcon />
        {readError + ""}
      </Alert>
    )
  }

  const currentCompany = data

  return (
    <>
      {hasUpdated && (
        <Flex borderColor="#18753C" my={4} borderWidth="1px">
          <Box textAlign="center" mr={3} width="32px" height="32px" backgroundColor="#18753C">
            <CheckIcon mt={1} padding={1} width="20px" height="20px" sx={{ borderRadius: "10px" }} background="white" color="#18753C" />
          </Box>
          <Text mt={1} data-testid="algo_company_updated_ok" color="#3A3A3A">
            Le SIRET {currentCompany.siret} a été mis à jour avec succès.
          </Text>
        </Flex>
      )}
      <Text my={6}>Mise à jour des coordonnées pour l’entreprise :</Text>

      <Box p={5} pt={6} mb={6} borderColor="bluefrance.500" borderWidth="1px">
        <Formik
          validateOnMount
          initialValues={{ phone: currentCompany.phone, email: currentCompany.email }}
          validationSchema={Yup.object().shape({
            email: Yup.string().email("Insérez un email valide").nullable(),
            phone: phoneValidation().nullable(),
          })}
          onSubmit={(values) => updateEntreprise.mutate(values)}
        >
          {({ values, isValid, dirty }) => {
            return (
              <Form>
                <Text fontWeight={700} mb={2} fontSize="22px">
                  {currentCompany.enseigne}
                </Text>
                <Text mb={2} color="grey.425">
                  SIRET {currentCompany.siret}
                </Text>
                <CustomInput required={false} name="phone" label="Nouveau numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                <CustomInput required={false} name="email" label="Nouvel email de contact" type="email" value={values.email} />
                {updateError && (
                  <Alert>
                    <AlertIcon />
                    {updateError + ""}
                  </Alert>
                )}
                <Flex justify="flex-start">
                  <Button type="submit" data-testid="update_algo_company" variant="form" isActive={isValid} isDisabled={!isValid || !dirty} isLoading={updateEntreprise.isLoading}>
                    Enregistrer les modifications
                  </Button>
                </Flex>
              </Form>
            )
          }}
        </Formik>
      </Box>
    </>
  )
}

function GestionEntreprises() {
  const [siret, setSiret] = useState<string>("")

  return (
    <Layout displayNavigationMenu={false} adminPage={EAdminPages.ENTREPRISES_ALGO} footer={false}>
      <Box pt={5}>
        <Breadcrumb pages={[{ title: "Acceuil", to: "/espace-pro/administration/users" }, { title: "Entreprises de l'algorithme" }]} />
        <Box mt={6} px={4}>
          <Text fontSize="2rem" mb={4} fontWeight={700} as="h1">
            Entreprises de l'algorithme
          </Text>
          <FormulaireRechercheEntreprise onSiretChange={setSiret} />
          <FormulaireModificationEntreprise siret={siret} />
        </Box>
      </Box>
    </Layout>
  )
}

export default authProvider(withAuth(GestionEntreprises, "admin"))
