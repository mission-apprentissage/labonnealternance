import { Box, Button, Flex, Select, Text } from "@chakra-ui/react"
import { ErrorMessage, Form, Formik } from "formik"
import React, { useContext, useEffect, useState } from "react"

import { focusWithin } from "@/theme/theme-lba-tools"

import { DomainError } from "../.."
import { DisplayContext } from "../../../context/DisplayContextProvider"
import { ParameterContext } from "../../../context/ParameterContextProvider"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { autoCompleteToStringFunction, compareAutoCompleteValues } from "../../../services/autoCompleteUtilities"
import { fetchAddresses } from "../../../services/baseAdresse"
import { buildAvailableDiplomasOptions } from "../../../services/buildAvailableDiplomas"
import { buildRayonsButtons, buildRayonsOptions } from "../../../services/buildRayons"
import domainChanged from "../../../services/domainChanged"
import handleSelectChange from "../../../services/handleSelectChange"
import updateValuesFromJobAutoComplete, { updateValuesFromPlaceAutoComplete } from "../../../services/updateValuesFromJobAutoComplete"
import validateFormik from "../../../services/validateFormik"
import { AutoCompleteField } from "../../AutoCompleteField/AutoCompleteField"

const selectProperties = {
  fontSize: "1rem",
  height: "26px",
  fontWeight: 600,
  background: "white",
  sx: {
    padding: "0px 10px",
    marginBottom: "5px",
  },
  border: "none !important",
}

const SearchFormResponsive = (props) => {
  const { hasSearch } = useContext(SearchResultContext)
  const { widgetParameters } = React.useContext(ParameterContext)
  const { formValues, isFormVisible } = React.useContext(DisplayContext)

  const [locationRadius, setLocationRadius] = useState(30)

  useEffect(() => {
    setLocationRadius(formValues?.radius ?? 30)
    setDiploma(formValues?.diploma ?? "")
  }, [formValues?.radius, formValues?.diploma])

  const [diplomas] = useState([])
  const [diploma, setDiploma] = useState("")
  const [domainError, setDomainError] = useState(false)
  const [diplomaError, setDiplomaError] = useState(false)

  const jobChanged = async function (val, setLoadingState) {
    const res = await domainChanged(val, setDomainError)
    setLoadingState("done")
    return res
  }

  const addressChanged = async function (val, setLoadingState) {
    const res = await fetchAddresses(val)
    setLoadingState("done")
    return res
  }

  const renderFormik = () => {
    return (
      <Formik
        validate={(values) => validateFormik(values, widgetParameters)}
        enableReinitialize
        initialValues={{ job: formValues?.job ?? {}, location: formValues?.location ?? {}, radius: formValues?.radius ?? 30, diploma: formValues?.diploma ?? "" }}
        onSubmit={props.handleSearchSubmit}
      >
        {({ isSubmitting, setFieldValue, errors }) => (
          <Form>
            <Text as="h1" fontSize={["26px", "29px"]} fontWeight={700}>
              <Text as="span">Trouvez emploi et formation </Text>
              <Text as="span" color="info">
                en alternance
              </Text>
            </Text>
            <Flex direction={{ base: "column", lg: "row" }}>
              <Box mb={4}>
                <Box {...focusWithin}>
                  <AutoCompleteField
                    id="searchFormJobField"
                    kind="Métier ou diplôme *"
                    items={[]}
                    hasError={errors.job}
                    initialSelectedItem={formValues?.job ?? null}
                    itemToStringFunction={autoCompleteToStringFunction}
                    onSelectedItemChangeFunction={updateValuesFromJobAutoComplete}
                    compareItemFunction={compareAutoCompleteValues}
                    onInputValueChangeFunction={jobChanged}
                    name="jobField"
                    placeholder="Indiquez un métier ou diplôme"
                    inputVariant="homeAutocomplete"
                    searchPlaceholder="Indiquez un métier ou diplôme ci-dessus"
                    // @ts-expect-error: TODO
                    isDisabled={widgetParameters?.parameters?.jobName && widgetParameters?.parameters?.romes && widgetParameters?.parameters?.frozenJob}
                    splitItemsByTypes={[
                      { type: "job", typeLabel: "Métiers", size: 4 },
                      { type: "diploma", typeLabel: "Diplômes", size: 4 },
                      { typeLabel: "...autres métiers et diplômes" },
                    ]}
                  />
                  <ErrorMessage name="job" className="onErrorFieldColumn" component="div" />
                </Box>
              </Box>
              <Box mb={4} {...focusWithin}>
                <AutoCompleteField
                  id="searchFormPlaceField"
                  kind="Lieu"
                  items={[]}
                  hasError={errors.location}
                  initialSelectedItem={formValues?.location ?? null}
                  itemToStringFunction={autoCompleteToStringFunction}
                  onSelectedItemChangeFunction={updateValuesFromPlaceAutoComplete /*partialRight(formikUpdateValue, "location")*/}
                  compareItemFunction={compareAutoCompleteValues}
                  onInputValueChangeFunction={addressChanged}
                  name="placeField"
                  placeholder="Adresse, ville ou code postal"
                  inputVariant="homeAutocomplete"
                  searchPlaceholder="Indiquez le lieu recherché ci-dessus"
                />
                <ErrorMessage name="location" className="onErrorFieldColumn" component="div" />
              </Box>
              <Box mb={4} {...focusWithin}>
                <Box {...focusWithin} display={["none", "none", "block"]} border="1px solid" borderColor="grey.300" padding="0.1rem">
                  <Text as="label" htmlFor="locationRadius-search" variant="defaultAutocomplete">
                    Rayon
                  </Text>
                  <Box>
                    <Select
                      aria-label="Rayon de recherche"
                      onChange={(evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius")}
                      value={locationRadius}
                      id="locationRadius-search"
                      data-testid="locationRadius"
                      {...selectProperties}
                    >
                      {buildRayonsOptions()}
                    </Select>
                  </Box>
                </Box>
                <Box display={["block", "block", "none"]}>
                  <Text as="p" mb={2} fontWeight={700}>
                    Rayon
                  </Text>
                  <Box>{buildRayonsButtons(locationRadius, (evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius"))}</Box>
                </Box>
              </Box>
              <Box {...focusWithin} mb={10} border="1px solid" borderColor="grey.300" padding="0.1rem">
                <Text as="label" htmlFor="diploma-search" variant="defaultAutocomplete">
                  Niveau d&apos;études visé
                </Text>
                <Select
                  aria-label="Liste des diplômes"
                  onChange={(evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma")}
                  value={diploma}
                  id="diploma-search"
                  {...selectProperties}
                >
                  {buildAvailableDiplomasOptions(diplomas)}
                </Select>
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
                  borderRadius="unset"
                  disabled={isSubmitting}
                >
                  C&apos;est parti
                </Button>
              </Box>
            </Flex>
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

export default SearchFormResponsive
