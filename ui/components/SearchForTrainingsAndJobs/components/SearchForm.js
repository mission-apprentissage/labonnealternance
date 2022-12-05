import React, { useState, useEffect, useContext } from "react"
import { Formik, Form, ErrorMessage } from "formik"
import { AutoCompleteField } from "../../../components/AutoCompleteField/AutoCompleteField"

import { fetchAddresses } from "../../../services/baseAdresse"
import { DomainError } from "../../"
import { buildRayonsOptions, buildRayonsButtons } from "../../../services/buildRayons"
import handleSelectChange from "../../../services/handleSelectChange"
import { partialRight } from "lodash"
import domainChanged from "../../../services/domainChanged"
import { autoCompleteToStringFunction, compareAutoCompleteValues } from "../../../services/autoCompleteUtilities"
import updateValuesFromJobAutoComplete from "../../../services/updateValuesFromJobAutoComplete"
import formikUpdateValue from "../../../services/formikUpdateValue"
import { buildAvailableDiplomasOptions, buildAvailableDiplomasButtons } from "../../../services/buildAvailableDiplomas"
import validateFormik from "../../../services/validateFormik"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { ParameterContext } from "../../../context/ParameterContextProvider"
import { DisplayContext } from "../../../context/DisplayContextProvider"
import { Box, Button, Flex, Select, Text } from "@chakra-ui/react"

const selectProperties = {
  fontSize: "1rem",
  border: "none",
  height: "26px",
  fontWeight: 600,
  background: "white",
  sx: {
    padding: "0px 10px",
    marginBottom: "5px",
  },
  border: "none !important",
}

const SearchForm = (props) => {
  const { hasSearch } = useContext(SearchResultContext)
  const { widgetParameters } = React.useContext(ParameterContext)
  const { formValues, isFormVisible } = React.useContext(DisplayContext)

  const [locationRadius, setLocationRadius] = useState(30)

  useEffect(() => {
    setLocationRadius(contextFormValues?.radius ?? 30)
    setDiploma(contextFormValues?.diploma ?? "")
    setJobValue(contextFormValues?.job ?? null)
  }, [widgetParameters?.applyFormValues])

  const contextFormValues = widgetParameters?.applyFormValues && widgetParameters?.formValues ? widgetParameters.formValues : formValues

  const [jobValue, setJobValue] = useState(null)
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
      <Formik
        validate={(values) => validateFormik(values, widgetParameters)}
        initialValues={{ job: {}, location: {}, radius: 30, diploma: "" }}
        onSubmit={props.handleSearchSubmit}
      >
        {({ isSubmitting, setFieldValue, errors }) => (
          <Form>
            <Box p="0">
              <Text as="h1" fontSize={["26px", "29px"]} fontWeight={700}>
                <Text as="span" display={{ base: "block", md: "inline" }}>
                  Se former et travailler{" "}
                </Text>
                <Text as="span" color="info" display={{ base: "block", md: "inline" }}>
                  en alternance
                </Text>
              </Text>
              <Flex direction={{ base: "column", lg: "row" }}>
                <Box mb={4}>
                  <Text as="p" my={2} fontWeight={700}>
                    Votre recherche
                  </Text>
                  <AutoCompleteField
                    kind="Métier ou diplôme *"
                    items={[]}
                    hasError={errors.job}
                    initialSelectedItem={contextFormValues?.job || null}
                    itemToStringFunction={autoCompleteToStringFunction}
                    onSelectedItemChangeFunction={partialRight(updateValuesFromJobAutoComplete, setDiplomas)}
                    compareItemFunction={compareAutoCompleteValues}
                    onInputValueChangeFunction={jobChanged}
                    name="jobField"
                    placeholder="Indiquez un métier ou diplôme"
                    inputVariant="homeAutocomplete"
                    searchPlaceholder="Indiquez un métier ou diplôme ci-dessus"
                    isDisabled={widgetParameters?.parameters?.jobName && widgetParameters?.parameters?.romes && widgetParameters?.parameters?.frozenJob}
                    splitItemsByTypes={[
                      { type: "job", typeLabel: "Métiers", size: 4 },
                      { type: "diploma", typeLabel: "Diplômes", size: 4 },
                      { typeLabel: "...autres métiers et diplômes" },
                    ]}
                  />
                  <ErrorMessage name="job" className="onErrorFieldColumn" component="div" />
                </Box>
                <Box mb={4}>
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
                    placeholder="Adresse, ville ou code postal"
                    inputVariant="homeAutocomplete"
                    searchPlaceholder="Indiquez le lieu recherché ci-dessus"
                  />
                  <ErrorMessage name="location" className="onErrorFieldColumn" component="div" />
                </Box>
                <Box mb={4}>
                  <Box display={["none", "none", "block"]} border="1px solid" borderColor="grey.300" borderRadius="10px" padding="0.1rem">
                    <Text as="label" htmlFor="locationRadius" variant="defaultAutocomplete">
                      Rayon
                    </Text>
                    <Box>
                      <Select
                        onChange={(evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius")}
                        value={locationRadius}
                        name="locationRadius"
                        {...selectProperties}
                      >
                        {buildRayonsOptions()}
                      </Select>
                    </Box>
                  </Box>
                  <Box display={["block", "block", "none"]}>
                    <Text as="p" my={2} fontWeight={700}>
                      Rayon
                    </Text>
                    <Box>{buildRayonsButtons(locationRadius, (evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius"))}</Box>
                  </Box>
                </Box>
                <Box mb={10}>
                  <Box display={["none", "none", "block"]} border="1px solid" borderColor="grey.300" borderRadius="10px" padding="0.1rem">
                    <Text as="label" htmlFor="diploma" variant="defaultAutocomplete">
                      Niveau d&apos;études visé
                    </Text>
                    <Select onChange={(evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma")} value={diploma} name="diploma" {...selectProperties}>
                      {buildAvailableDiplomasOptions(diplomas)}
                    </Select>
                  </Box>
                  <Box display={["block", "block", "none"]}>
                    <Text as="p" my={2} fontWeight={700}>
                      Niveau d&apos;études visé
                    </Text>
                    <Box>{buildAvailableDiplomasButtons(diploma, diplomas, (evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma"))}</Box>
                  </Box>
                </Box>
                <Box>
                  <Button
                    type="submit"
                    py="0.35rem"
                    height="3rem"
                    fontSize="18px"
                    textDecoration="none"
                    fontWeight={700}
                    width="100%"
                    margin="auto"
                    variant="blackButton"
                    disabled={isSubmitting}
                    alt="Lancer la recherche"
                  >
                    C&apos;est parti
                  </Button>
                </Box>
              </Flex>
            </Box>
          </Form>
        )}
      </Formik>
    )
  }

  return (
    <Box display={props.isHome || isFormVisible ? "block" : "none"}>
      {hasSearch && !props.isHome && (
        <Button
          px={4}
          py={1}
          fontSize="12px"
          border="1px solid #e0e0e0"
          height="30px"
          borderRadius="4px"
          background="white"
          fontWeight={700}
          marginBottom="1rem"
          onClick={props.showResultList}
        >
          ← Retour
        </Button>
      )}

      {domainError || diplomaError ? <DomainError setDomainError={setDomainError} setDiplomaError={setDiplomaError} /> : renderFormik()}
    </Box>
  )
}

export default SearchForm
