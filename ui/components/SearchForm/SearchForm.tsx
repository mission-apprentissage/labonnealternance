import { Box, Button, Flex, Image, Select, Text } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import React, { useEffect, useState } from "react"

import { focusWithin } from "@/theme/theme-lba-tools"

import { AutoCompleteField, DomainError } from ".."
import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"
import { autoCompleteToStringFunction, compareAutoCompleteValues } from "../../services/autoCompleteUtilities"
import { fetchAddresses } from "../../services/baseAdresse"
import { buildAvailableDiplomasOptions } from "../../services/buildAvailableDiplomas"
import { buildRayonsOptions } from "../../services/buildRayons"
import domainChanged from "../../services/domainChanged"
import handleSelectChange from "../../services/handleSelectChange"
import updateValuesFromJobAutoComplete, { updateValuesFromPlaceAutoComplete } from "../../services/updateValuesFromJobAutoComplete"
import validateFormik from "../../services/validateFormik"

const selectProperties = {
  fontSize: "14px",
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

const SearchForm = ({ handleSearchSubmit, isHome }) => {
  const { widgetParameters } = React.useContext(ParameterContext)
  const { formValues } = React.useContext(DisplayContext)

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
        enableReinitialize
        validate={(values) => validateFormik(values, widgetParameters)}
        initialValues={{ job: formValues?.job ?? {}, location: formValues?.location ?? {}, radius: formValues?.radius ?? 30, diploma: formValues?.diploma ?? "" }}
        onSubmit={(values) => handleSearchSubmit(values)}
      >
        {({ isSubmitting, setFieldValue, errors }) => (
          <Form data-testid="widget-form">
            <Flex>
              <Box {...focusWithin}>
                <AutoCompleteField
                  kind="Métier ou diplôme"
                  id="headerFormJobField"
                  items={[]}
                  hasError={errors.job}
                  initialSelectedItem={formValues?.job ?? null}
                  itemToStringFunction={autoCompleteToStringFunction}
                  onSelectedItemChangeFunction={updateValuesFromJobAutoComplete}
                  compareItemFunction={compareAutoCompleteValues}
                  onInputValueChangeFunction={jobChanged}
                  // @ts-expect-error: TODO
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
              <Box {...focusWithin} ml={3}>
                <AutoCompleteField
                  id="headerFormPlaceField"
                  kind="Lieu"
                  items={[]}
                  hasError={errors.location}
                  initialSelectedItem={formValues?.location ?? null}
                  itemToStringFunction={autoCompleteToStringFunction}
                  onSelectedItemChangeFunction={updateValuesFromPlaceAutoComplete /*partialRight(formikUpdateValue, "location")*/}
                  compareItemFunction={compareAutoCompleteValues}
                  onInputValueChangeFunction={addressChanged}
                  name="placeField"
                  placeholder={isHome ? "A quel endroit ?" : "Adresse, ville ou code postal"}
                  searchPlaceholder="Indiquez le lieu recherché ci-dessus"
                />
              </Box>
              <Box {...focusWithin} ml={3} border="1px solid" borderColor="grey.300" padding="0.1rem">
                <Text as="label" htmlFor="locationRadius-header" variant="defaultAutocomplete">
                  Rayon
                </Text>
                <Box>
                  <Select
                    {...selectProperties}
                    onChange={(evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius")}
                    value={locationRadius}
                    id="locationRadius-header"
                    data-testid="locationRadius"
                  >
                    {buildRayonsOptions()}
                  </Select>
                </Box>
              </Box>
              <Box {...focusWithin} ml={3} border="1px solid" borderColor="grey.300" padding="0.1rem">
                <Text as="label" htmlFor="diploma-header" variant="defaultAutocomplete">
                  Niveau d&apos;études visé
                </Text>
                <Box>
                  <Select
                    {...selectProperties}
                    onChange={(evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma")}
                    value={diploma}
                    id="diploma-header"
                    data-testid="diploma"
                  >
                    {buildAvailableDiplomasOptions(diplomas)}
                  </Select>
                </Box>
              </Box>
              <Box ml={[1, 1, 1, 3]}>
                <Button type="submit" variant="blackButton" borderRadius="unset" disabled={isSubmitting} height="57px" paddingTop="3px">
                  <Image maxWidth="unset" alt="Lancer la recherche" src="/images/glass_white.svg" />
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

export default SearchForm
