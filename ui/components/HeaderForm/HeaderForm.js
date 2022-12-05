import React, { useState, useEffect } from "react"
import glassImage from "../../public/images/glass_white.svg"
import { Formik, Form } from "formik"
import { AutoCompleteField } from ".."
import { buildAvailableDiplomasOptions } from "../../services/buildAvailableDiplomas"
import { buildRayonsOptions } from "../../services/buildRayons"
import { partialRight } from "lodash"
import { DomainError } from "../../components"

import domainChanged from "../../services/domainChanged"
import updateValuesFromJobAutoComplete from "../../services/updateValuesFromJobAutoComplete"
import formikUpdateValue from "../../services/formikUpdateValue"
import handleSelectChange from "../../services/handleSelectChange"

import { fetchAddresses } from "../../services/baseAdresse"
import { autoCompleteToStringFunction, compareAutoCompleteValues } from "../../services/autoCompleteUtilities"
import validateFormik from "../../services/validateFormik"
import { ParameterContext } from "../../context/ParameterContextProvider"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { Box, Button, Flex, Image, Select, Text } from "@chakra-ui/react"

const selectProperties = {
  fontSize: "14px",
  border: "none",
  height: "23px",
  fontWeight: 600,
  background: "white",
  minWidth: "100px",
  sx: {
    padding: "0px 10px",
    marginBottom: "5px",
  },
  border: "none !important",
}

const HeaderForm = ({ handleSearchSubmit, isHome }) => {
  const { widgetParameters } = React.useContext(ParameterContext)
  const { formValues } = React.useContext(DisplayContext)

  const [locationRadius, setLocationRadius] = useState(30)

  useEffect(() => {
    setLocationRadius(contextFormValues?.radius ?? 30)
    setDiploma(contextFormValues?.diploma ?? "")
  }, [widgetParameters?.applyFormValues])

  const contextFormValues = widgetParameters?.applyFormValues && widgetParameters?.formValues ? widgetParameters.formValues : formValues

  const [diplomas, setDiplomas] = useState([])
  const [diploma, setDiploma] = useState("")
  const [domainError, setDomainError] = useState(false)
  const [diplomaError, setDiplomaError] = useState(false)

  const jobChanged = async function (val, setLoadingState) {
    let res = await domainChanged(val, setDomainError)
    setLoadingState("done")
    return res
  }

  const addressChanged = async function (val, setLoadingState) {
    let res = await fetchAddresses(val)
    setLoadingState("done")
    return res
  }

  const renderFormik = () => {
    return (
      <Formik validate={(values) => validateFormik(values, widgetParameters)} initialValues={{ job: {}, location: {}, radius: 30, diploma: "" }} onSubmit={handleSearchSubmit}>
        {({ isSubmitting, setFieldValue, errors, touched }) => (
          <Form>
            <Flex>
              <Box>
                <AutoCompleteField
                  kind="Métier ou diplôme *"
                  items={[]}
                  hasError={errors.job}
                  initialSelectedItem={contextFormValues?.job || null}
                  itemToStringFunction={autoCompleteToStringFunction}
                  onSelectedItemChangeFunction={partialRight(updateValuesFromJobAutoComplete, setDiplomas)}
                  compareItemFunction={compareAutoCompleteValues}
                  onInputValueChangeFunction={jobChanged}
                  isDisabled={widgetParameters?.parameters?.jobName && widgetParameters?.parameters?.romes && widgetParameters?.parameters?.frozenJob}
                  name="jobField"
                  placeholder="Indiquez un métier ou diplôme"
                  searchPlaceholder="Indiquez un métier ou diplôme ci-dessus"
                  splitItemsByTypes={[
                    { type: "job", typeLabel: "Métiers", size: 4 },
                    { type: "diploma", typeLabel: "Diplômes", size: 4 },
                    { typeLabel: "...autres métiers et diplômes" },
                  ]}
                />
              </Box>
              <Box ml={3}>
                <Box>
                  <AutoCompleteField
                    kind="Lieu"
                    items={[]}
                    hasError={errors.location}
                    initialSelectedItem={contextFormValues?.location ?? null}
                    itemToStringFunction={autoCompleteToStringFunction}
                    onSelectedItemChangeFunction={partialRight(formikUpdateValue, "location")}
                    compareItemFunction={compareAutoCompleteValues}
                    onInputValueChangeFunction={addressChanged}
                    name="placeField"
                    placeholder={isHome ? "A quel endroit ?" : "Adresse, ville ou code postal"}
                    searchPlaceholder="Indiquez le lieu recherché ci-dessus"
                  />
                </Box>
              </Box>
              <Box ml={3} border="1px solid" borderColor="grey.300" borderRadius="10px" padding="0.1rem">
                <Text as="label" htmlFor="locationRadius" variant="defaultAutocomplete">
                  Rayon
                </Text>
                <Box>
                  <Select
                    {...selectProperties}
                    onChange={(evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius")}
                    type="select"
                    value={locationRadius}
                    name="locationRadius"
                  >
                    {buildRayonsOptions()}
                  </Select>
                </Box>
              </Box>
              <Box ml={3} border="1px solid" borderColor="grey.300" borderRadius="10px" padding="0.1rem">
                <Text as="label" htmlFor="diploma" variant="defaultAutocomplete">
                  Niveau d&apos;études visé
                </Text>
                <Box>
                  <Select {...selectProperties} onChange={(evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma")} value={diploma} name="diploma">
                    {buildAvailableDiplomasOptions(diplomas)}
                  </Select>
                </Box>
              </Box>
              <Box ml={[1, 1, 1, 3]}>
                <Button type="submit" variant="blackButton" disabled={isSubmitting} alt="Lancer la recherche" height="57px" paddingTop="3px">
                  <Image maxWidth="unset" alt="Lancer la recherche" src={glassImage} />
                  {isHome && (
                    <Box fontSize="18px" mx={3} display={{ base: "none", xl: "inline-block" }}>
                      C&apos;est parti
                    </Box>
                  )}
                </Button>
              </Box>
            </Flex>
          </Form>
        )}
      </Formik>
    )
  }

  return <Box>{domainError || diplomaError ? <DomainError position="header" setDomainError={setDomainError} setDiplomaError={setDiplomaError} /> : renderFormik()}</Box>
}

export default HeaderForm
