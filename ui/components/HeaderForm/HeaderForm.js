import React, { useState } from "react";
import { useSelector } from "react-redux";
import glassImage from "public/images/glass_white.svg";
import { Formik, Form, Field } from "formik";
import { AutoCompleteField } from "..";
import buildAvailableDiplomas from "services/buildAvailableDiplomas";
import buildRayons from "services/buildRayons";
import { Input } from "reactstrap";
import { partialRight } from "lodash";
import { DomainError } from "components";

import domainChanged from "services/domainChanged";
import updateValuesFromJobAutoComplete from "services/updateValuesFromJobAutoComplete";
import formikUpdateValue from "services/formikUpdateValue";
import handleSelectChange from "services/handleSelectChange";
import { fetchAddresses } from "services/baseAdresse";
import { autoCompleteToStringFunction, compareAutoCompleteValues } from "services/autoCompleteUtilities";
import validateFormik from "services/validateFormik";

const HeaderForm = ({ handleSearchSubmit }) => {
  const { formValues, widgetParameters } = useSelector((state) => {
    return state.trainings;
  });

  const [locationRadius, setLocationRadius] = useState(formValues?.radius ?? 30);
  const [diplomas, setDiplomas] = useState([]);
  const [diploma, setDiploma] = useState(formValues?.diploma ?? "");
  const [domainError, setDomainError] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);

  const jobChanged = async function (val, setLoadingState) {
    let res = await domainChanged(val, setDomainError)
    setLoadingState('done')
    return res;
  };

  const addressChanged = async function (val, setLoadingState) {
    let res = await fetchAddresses(val)
    setLoadingState('done')
    return res
  }

  const renderFormik = () => {
    return (
      <Formik
        validate={(values) => validateFormik(values, widgetParameters)}
        initialValues={formValues ?? { job: {}, location: {}, radius: 30, diploma: "" }}
        onSubmit={handleSearchSubmit}
      >
        {({ isSubmitting, setFieldValue, errors, touched }) => (
          <Form className="c-logobar-form c-searchform">
            <div className={`formGroup formGroup--logobar ${errors.job ? "formGroup--logobar-onerror" : ""}`}>
              <AutoCompleteField
                kind="Métier *"
                items={[]}
                itemToStringFunction={autoCompleteToStringFunction}
                onSelectedItemChangeFunction={partialRight(
                  updateValuesFromJobAutoComplete,
                  setDiplomaError,
                  setDiplomas
                )}
                compareItemFunction={compareAutoCompleteValues}
                onInputValueChangeFunction={jobChanged}
                previouslySelectedItem={formValues?.job ?? null}
                name="jobField"
                placeholder="Ex : boulangerie"
                searchPlaceholder="Indiquez le métier recherché ci-dessus"
              />
            </div>
            <div className="ml-3">
              <div className={`formGroup formGroup--logobar ${errors.location ? "formGroup--logobar-onerror" : ""}`}>
                <AutoCompleteField
                  kind="Lieu *"
                  items={[]}
                  itemToStringFunction={autoCompleteToStringFunction}
                  onSelectedItemChangeFunction={partialRight(formikUpdateValue, "location")}
                  compareItemFunction={compareAutoCompleteValues}
                  onInputValueChangeFunction={addressChanged}
                  previouslySelectedItem={formValues?.location ?? null}
                  name="placeField"
                  placeholder="Adresse, ville ou code postal"
                  searchPlaceholder="Indiquez le lieu recherché ci-dessus"
                />
              </div>
            </div>
            <div className="ml-3">
              <div className="c-logobar-formgroup c-logobar-formgroup--rayon">
                <label htmlFor="jobField" className="c-logobar-label c-logobar-label--rayon">
                  Rayon
                </label>
                <div className="c-logobar-field">
                  <Input
                    onChange={(evt) => handleSelectChange(evt, setFieldValue, setLocationRadius, "radius")}
                    type="select"
                    value={locationRadius}
                    name="locationRadius"
                  >
                    {buildRayons()}
                  </Input>
                </div>
              </div>
            </div>
            <div className="c-logobar-formgroup c-logobar-formgroup--diploma ml-3">
              <label htmlFor="jobField" className="c-logobar-label c-logobar-label--diploma">
                Niveau d'études
              </label>
              <div className="c-logobar-field">
                <Input
                  onChange={(evt) => handleSelectChange(evt, setFieldValue, setDiploma, "diploma")}
                  type="select"
                  value={diploma}
                  name="diploma"
                >
                  {buildAvailableDiplomas(diplomas)}
                </Input>
              </div>
            </div>
            <div className="c-logobar-formgroup ml-md-1 ml-lg-3 border-0 c-logobar-submit-container">
              <button
                type="submit"
                className="d-block btn btn-lg btn-dark w-100 font-weight-bold c-regular-darkbtn c-logobar-submit"
                disabled={isSubmitting}
                alt="Lancer la recherche"
              >
                <img alt="" src={glassImage} />
              </button>
            </div>
          </Form>
        )}
      </Formik>
    );
  };

  return (
    <div className="c-logobar">
      {domainError || diplomaError ? (
        <DomainError position="header" setDomainError={setDomainError} setDiplomaError={setDiplomaError} />
      ) : (
        renderFormik()
      )}
    </div>
  );
};

export default HeaderForm;
