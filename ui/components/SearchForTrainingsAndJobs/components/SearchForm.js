import React, { useState, useEffect, useContext } from "react"
import { Row, Col, Input } from "reactstrap"
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
          <Form className={`c-searchform c-searchform--column is-home-${props.isHome}`}>
            <Row>
              <Col xs="12">
                <h1 className="card-title">
                  <span className="c-home-hero__title c-home-hero__title1 d-block d-md-inline">Se former et travailler </span>
                  <span className="c-home-hero__title c-home-hero__title2 d-block d-md-inline">en alternance</span>
                </h1>
                <div className="formGroup">
                  <h1 className="h6 font-weight-bold">Votre recherche</h1>
                  <div className={`${errors.job ? "c-searchform--onerror" : ""}`}>
                    <AutoCompleteField
                      kind="Métier ou diplôme *"
                      items={[]}
                      initialSelectedItem={contextFormValues?.job || null}
                      itemToStringFunction={autoCompleteToStringFunction}
                      onSelectedItemChangeFunction={partialRight(updateValuesFromJobAutoComplete, setDiplomas)}
                      compareItemFunction={compareAutoCompleteValues}
                      onInputValueChangeFunction={jobChanged}
                      name="jobField"
                      placeholder="Indiquez un métier ou diplôme"
                      searchPlaceholder="Indiquez un métier ou diplôme ci-dessus"
                      isDisabled={widgetParameters?.parameters?.jobName && widgetParameters?.parameters?.romes && widgetParameters?.parameters?.frozenJob}
                      splitItemsByTypes={[
                        { type: "job", typeLabel: "Métiers", size: 4 },
                        { type: "diploma", typeLabel: "Diplômes", size: 4 },
                        { typeLabel: "...autres métiers et diplômes" },
                      ]}
                    />
                    <ErrorMessage name="job" className="errorField" component="div" />
                  </div>
                </div>
              </Col>

              <Col xs="12">
                <div className={`formGroup mt-3 ${errors.location ? "c-searchform--onerror" : ""}`}>
                  <AutoCompleteField
                    kind="Lieu"
                    items={[]}
                    initialSelectedItem={contextFormValues?.location ?? null}
                    itemToStringFunction={autoCompleteToStringFunction}
                    onSelectedItemChangeFunction={partialRight(formikUpdateValue, "location")}
                    compareItemFunction={compareAutoCompleteValues}
                    onInputValueChangeFunction={addressChanged}
                    name="placeField"
                    placeholder="Adresse, ville ou code postal"
                    searchPlaceholder="Indiquez le lieu recherché ci-dessus"
                  />
                  <ErrorMessage name="location" className="errorField" component="div" />
                </div>
              </Col>
              <Col xs="12">
                <div className="c-logobar-formgroup formGroup mt-3 d-none d-md-block">
                  <label htmlFor="jobField" className="c-logobar-label">
                    Rayon
                  </label>
                  <div className="c-logobar-field">
                    <Input onChange={(evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius")} type="select" value={locationRadius} name="locationRadius">
                      {buildRayonsOptions()}
                    </Input>
                  </div>
                </div>
                <div className="mt-3 d-block d-md-none formGroup">
                  <h3 className="h6 font-weight-bold">Rayon</h3>
                  <div className="c-logobar-field">{buildRayonsButtons(locationRadius, (evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius"))}</div>
                </div>
              </Col>
              <Col xs="12">
                <div className="formGroup c-logobar-formgroup mt-3 d-none d-md-block">
                  <div className="">
                    <label htmlFor="jobField" className="c-logobar-label">
                      Niveau d&apos;études visé
                    </label>
                    <div className="c-logobar-field">
                      <Input onChange={(evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma")} value={diploma} type="select" name="diploma">
                        {buildAvailableDiplomasOptions(diplomas)}
                      </Input>
                    </div>
                  </div>
                </div>
                <div className="mt-3 d-block d-md-none formGroup">
                  <h3 className="h6 font-weight-bold">Niveau d&apos;études visé</h3>
                  <div className="c-diplomas-buttons">
                    {buildAvailableDiplomasButtons(diploma, diplomas, (evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma"))}
                  </div>
                </div>
              </Col>
            </Row>
            <div className="formGroup submitGroup">
              <button type="submit" className="d-block btn btn-lg btn-dark w-100 font-weight-bold c-regular-darkbtn mt-5" disabled={isSubmitting} alt="Lancer la recherche">
                C&apos;est parti
              </button>
            </div>
          </Form>
        )}
      </Formik>
    )
  }

  return (
    <div className={isFormVisible ? "" : "hiddenSearchForm"}>
      <div className="formGroup">
        {hasSearch && !props.isHome ? (
          <button className="c-detail-back px-3 py-1" onClick={props.showResultList}>
            ← Retour
          </button>
        ) : (
          ""
        )}
      </div>

      {domainError || diplomaError ? <DomainError setDomainError={setDomainError} setDiplomaError={setDiplomaError} /> : renderFormik()}
    </div>
  )
}

export default SearchForm
