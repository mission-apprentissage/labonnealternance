import { Box, Button, Flex, Text } from "@chakra-ui/react"
import { captureException } from "@sentry/nextjs"
import { Form, Formik, FormikHelpers, FormikValues } from "formik"
import { useState } from "react"
import { validateSIRET } from "shared/validators/siretValidator"
import * as Yup from "yup"

import { searchEntreprise } from "@/services/searchEntreprises"

import { SIRETValidation } from "../../../common/validation/fieldValidations"
import AutocompleteAsync from "../AutocompleteAsync"

type Organisation = Awaited<ReturnType<typeof searchEntreprise>>[number]

export const SiretAutocomplete = ({
  onSelectOrganisation,
  onSubmit,
}: {
  onSelectOrganisation?: (organisation: Organisation) => void
  onSubmit: (props: { establishment_siret: string }, formik: FormikHelpers<FormikValues>) => void
}) => {
  const [searchInput, setSearchInput] = useState<string>()
  const [selectedEntreprise, setSelectedEntreprise] = useState<Organisation | null>(null)
  return (
    <Formik
      validateOnMount
      initialValues={{ establishment_siret: undefined }}
      validationSchema={Yup.object().shape({
        establishment_siret: SIRETValidation().required("champ obligatoire"),
      })}
      onSubmit={onSubmit}
    >
      {({ values, errors, isValid, isSubmitting, setFieldValue, setFieldTouched }) => {
        return (
          <Form>
            <AutocompleteAsync
              name="establishment_siret"
              handleSearch={(search: string) => searchEntreprise(search)}
              renderItem={({ raison_sociale, siret, adresse }, highlighted) => <EntrepriseCard {...{ raison_sociale, siret, adresse, highlighted }} />}
              itemToString={({ siret }) => siret}
              onInputFieldChange={(value, hasError) => {
                setSearchInput(value)
                if (!hasError) return
                setFieldTouched("establishment_siret", true, false)
                setFieldValue("establishment_siret", value, true)
              }}
              onSelectItem={(organisation) => {
                setSelectedEntreprise(organisation)
                setFieldTouched("establishment_siret", false, false)
                setFieldValue("establishment_siret", organisation?.siret, true)
                onSelectOrganisation?.(organisation)
              }}
              onError={(error, inputValue) => {
                captureException(error)
                setFieldTouched("establishment_siret", true, false)
                setFieldValue("establishment_siret", inputValue, true)
              }}
              allowHealFromError={false}
              renderNoResult={
                /^[0-9]{14}$/.test(searchInput) && !validateSIRET(searchInput) ? (
                  <Box>
                    <Text fontSize="12px" lineHeight="20px" color="#CE0500" padding="8px 16px">
                      Le numéro de SIRET saisi n’est pas valide
                    </Text>
                  </Box>
                ) : undefined
              }
              renderError={() =>
                values?.establishment_siret && !errors?.establishment_siret ? null : (
                  <Box>
                    <Text fontSize="12px" lineHeight="20px" color="#CE0500" padding="8px 16px">
                      La recherche par raison sociale est temporairement indisponible.
                      <br />
                      <b>Veuillez renseigner votre numéro de SIRET.</b>
                    </Text>
                  </Box>
                )
              }
            />
            {selectedEntreprise && (
              <Box marginTop="32px">
                <Text fontSize="16px" lineHeight="24px">
                  Établissement sélectionné :
                </Text>
                <Box border="solid 1px #000091" marginTop="8px">
                  <EntrepriseCard {...selectedEntreprise} />
                </Box>
              </Box>
            )}

            <Flex justify="flex-start" marginTop="32px">
              <Button type="submit" variant="form" isActive={isValid} isDisabled={!isValid || isSubmitting} isLoading={isSubmitting}>
                Continuer
              </Button>
            </Flex>
          </Form>
        )
      }}
    </Formik>
  )
}

const EntrepriseCard = ({ adresse, raison_sociale, siret, highlighted }: { highlighted?: boolean; raison_sociale: string; siret: string; adresse: string }) => {
  return (
    <Box backgroundColor={highlighted ? "#F6F6F6" : "white"} py={2} px={4}>
      <Text color="#161616" fontWeight={700}>
        {raison_sociale}
      </Text>
      <Text color="#161616">{siret}</Text>
      <Text color="#666666">{adresse}</Text>
    </Box>
  )
}
