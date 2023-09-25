import { Box, Button, Flex, Image, Select, Text } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { partialRight } from "lodash"
import React, { useEffect, useState } from "react"

import { AutoCompleteField, DomainError } from ".."
import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"
import glassImage from "../../public/images/glass_white.svg"
import { autoCompleteToStringFunction, compareAutoCompleteValues } from "../../services/autoCompleteUtilities"
import { fetchAddresses } from "../../services/baseAdresse"
import { buildAvailableDiplomasOptions } from "../../services/buildAvailableDiplomas"
import { buildRayonsOptions } from "../../services/buildRayons"
import domainChanged from "../../services/domainChanged"
import formikUpdateValue from "../../services/formikUpdateValue"
import handleSelectChange from "../../services/handleSelectChange"
import updateValuesFromJobAutoComplete from "../../services/updateValuesFromJobAutoComplete"
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

const HeaderForm = ({ handleSearchSubmit, isHome }) => {
  const { widgetParameters } = React.useContext(ParameterContext)
  const { formValues } = React.useContext(DisplayContext)

  const [locationRadius, setLocationRadius] = useState(30)

  useEffect(() => {
    setLocationRadius(contextFormValues?.radius ?? 30)
    setDiploma(contextFormValues?.diploma ?? "")
    // @ts-expect-error: TODO
  }, [widgetParameters?.applyFormValues])
  // @ts-expect-error: TODO
  const contextFormValues = widgetParameters?.applyFormValues && widgetParameters?.formValues ? widgetParameters.formValues : formValues

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
      <Formik validate={(values) => validateFormik(values, widgetParameters)} initialValues={{ job: {}, location: {}, radius: 30, diploma: "" }} onSubmit={handleSearchSubmit}>
        {({ isSubmitting, setFieldValue, errors }) => (
          <Form data-testid="widget-form">
            <Flex>
              <Box>
                <AutoCompleteField
                  kind="Métier ou diplôme *"
                  id="headerFormJobField"
                  items={[]}
                  hasError={errors.job}
                  initialSelectedItem={contextFormValues?.job || null}
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
              <Box ml={3}>
                <Box>
                  <AutoCompleteField
                    id="headerFormPlaceField"
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
              <Box ml={3} border="1px solid" borderColor="grey.300" padding="0.1rem">
                <Text as="label" htmlFor="locationRadius" variant="defaultAutocomplete">
                  Rayon
                </Text>
                <Box>
                  <Select
                    {...selectProperties}
                    onChange={(evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius")}
                    // @ts-expect-error: TODO
                    type="select"
                    value={locationRadius}
                    name="locationRadius"
                    data-testid="locationRadius"
                  >
                    {buildRayonsOptions()}
                  </Select>
                </Box>
              </Box>
              <Box ml={3} border="1px solid" borderColor="grey.300" padding="0.1rem">
                <Text as="label" htmlFor="diploma" variant="defaultAutocomplete">
                  Niveau d&apos;études visé
                </Text>
                <Box>
                  <Select
                    {...selectProperties}
                    onChange={(evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma")}
                    value={diploma}
                    name="diploma"
                    data-testid="diploma"
                  >
                    {buildAvailableDiplomasOptions(diplomas)}
                  </Select>
                </Box>
              </Box>
              <Box ml={[1, 1, 1, 3]}>
                {/* @ts-expect-error: TODO */}
                <Button type="submit" variant="blackButton" borderRadius="unset" disabled={isSubmitting} alt="Lancer la recherche" height="57px" paddingTop="3px">
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
