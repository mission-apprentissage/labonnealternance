import { CheckIcon } from "@chakra-ui/icons"
import { Box, Button, Flex, Spinner, Alert, AlertIcon, Text } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useState } from "react"
import * as Yup from "yup"

import { phoneValidation, SIRETValidation } from "@/common/validation/fieldValidations"
import { Breadcrumb } from "@/components/espace_pro/common/components/Breadcrumb"
import { EAdminPages } from "@/components/espace_pro/Layout/NavigationAdmin"
import { getCompanyContactInfo, putCompanyContactInfo } from "@/utils/api"

import { CustomInput, Layout } from "../../../components/espace_pro"
import { authProvider, withAuth } from "../../../components/espace_pro/withAuth"
import { SearchLine } from "../../../theme/components/icons"

const pageTitle = "Entreprises de l'algorithme"
const noCompany: { siret?: string; phone?: string; email?: string; enseigne?: string } = {}

function FormulaireRechercheEntreprise({ setCurrentCompany, isLoading, setIsLoading }) {
  const submitSearchForSiret = async ({ siret }: { siret: string }, { setFieldError }) => {
    const formattedSiret = siret.replace(/[^0-9]/g, "")

    setCurrentCompany(null)
    setIsLoading(true)

    try {
      setCurrentCompany(await getCompanyContactInfo(formattedSiret))
    } catch (err: any) {
      setFieldError("siret", err.message)
      setCurrentCompany(noCompany)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Formik
      validateOnMount
      initialValues={{ siret: undefined }}
      validationSchema={Yup.object().shape({
        siret: SIRETValidation().required("champ obligatoire"),
      })}
      onSubmit={submitSearchForSiret}
    >
      {({ values, isValid }) => {
        return (
          <Form>
            <CustomInput required={true} name="siret" label="SIRET de l'établissement" type="text" value={values.siret} />
            <Flex justify="flex-start">
              <Button type="submit" variant="form" leftIcon={<SearchLine width={5} />} isActive={isValid} isDisabled={!isValid || isLoading} isLoading={isLoading}>
                Chercher
              </Button>
            </Flex>
          </Form>
        )
      }}
    </Formik>
  )
}

function FormulaireModificationEntreprise({ currentCompany, setCurrentCompany, isLoading, setIsLoading, isSuccess, setIsSuccess }) {
  const [error, setError] = useState("")

  const submitUpdateForSiret = async ({ phone, email }: { phone: string; email: string }) => {
    setIsSuccess(false)
    const formattedSiret = currentCompany.siret.replace(/[^0-9]/g, "")

    setIsLoading(true)

    try {
      setCurrentCompany(await putCompanyContactInfo({ siret: formattedSiret, phone, email }))
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <>
      <Text my={6}>Mise à jour des coordonnées pour l’entreprise :</Text>

      {isSuccess && (
        <Flex borderColor="#18753C" my={4} borderWidth="1px">
          <Box textAlign="center" mr={3} width="32px" height="32px" backgroundColor="#18753C">
            <CheckIcon mt={1} padding={1} width="20px" height="20px" sx={{ borderRadius: "10px" }} background="white" color="#18753C" />
          </Box>
          <Text mt={1} color="#3A3A3A">
            Le SIRET {currentCompany.siret} a été mis à jour avec succès.
          </Text>
        </Flex>
      )}
      <Box p={5} pt={6} mb={6} borderColor="bluefrance.500" borderWidth="1px">
        <Formik
          validateOnMount
          initialValues={{ phone: currentCompany.phone, email: currentCompany.email }}
          validationSchema={Yup.object().shape({
            email: Yup.string().email("Insérez un email valide"),
            phone: phoneValidation(),
          })}
          onSubmit={submitUpdateForSiret}
        >
          {({ values, isValid }) => {
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
                {error && (
                  <Alert>
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                <Flex justify="flex-start">
                  <Button type="submit" variant="form" leftIcon={<SearchLine width={5} />} isActive={isValid} isDisabled={!isValid || isLoading} isLoading={isLoading}>
                    Modifier
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
  const [currentCompany, setCurrentCompany] = useState(noCompany)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  return (
    <Layout adminPage={EAdminPages.ENTREPRISES_ALGO} footer={false}>
      <Box pt={5}>
        <Breadcrumb pages={[{ title: "Acceuil", to: "/espace-pro/administration/users" }, { title: pageTitle }]} />

        <Box mt={6} px={4}>
          <Text fontSize="2rem" mb={4} fontWeight={700} as="h1">
            Entreprises de l'algorithme
          </Text>

          <FormulaireRechercheEntreprise setCurrentCompany={setCurrentCompany} isLoading={isLoading} setIsLoading={setIsLoading} />

          {isLoading && <Spinner />}
          {!isLoading && currentCompany?.siret && (
            <FormulaireModificationEntreprise
              currentCompany={currentCompany}
              setCurrentCompany={setCurrentCompany}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              isSuccess={isSuccess}
              setIsSuccess={setIsSuccess}
            />
          )}
        </Box>
      </Box>
    </Layout>
  )
}

export default authProvider(withAuth(GestionEntreprises, "admin"))
