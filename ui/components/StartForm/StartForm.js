import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, ErrorMessage } from "formik";
import {
  AutoCompleteField,
  compareAutoCompleteValues,
  autoCompleteToStringFunction,
} from "components/AutoCompleteField/AutoCompleteField";
import { fetchAddresses } from "services/baseAdresse";
import domainChanged from "services/domainChanged";
import { DomainError } from "../";
import { push } from "connected-next-router";
import { setFormValues, setShouldExecuteSearch } from "store/actions";
import glassImage from "public/images/glass.svg";
import localisationImage from "public/images/localisation.svg";

const StartForm = (props) => {
  const dispatch = useDispatch();
  const { formValues } = useSelector((state) => state.trainings);
  const [domainError, setDomainError] = useState(false);

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

  const handleSearchSubmit = (values) => {
    dispatch(setFormValues({ job: values.job, location: values.location }));
    dispatch(setShouldExecuteSearch(true));
    dispatch(push({ pathname: "/recherche-apprentissage" }));
  };

  // Mets à jours les valeurs de champs du formulaire Formik à partir de l'item sélectionné dans l'AutoCompleteField
  const updateValuesFromJobAutoComplete = (item, setFieldValue) => {
    //setTimeout perme d'éviter un conflit de setState
    setTimeout(() => {
      setFieldValue("job", item);
    }, 0);

    //updateDiplomaSelectionFromJobChange(item);
  };

  // Mets à jours les valeurs de champs du formulaire Formik à partir de l'item sélectionné dans l'AutoCompleteField
  const updateValuesFromPlaceAutoComplete = (item, setFieldValue) => {
    //setTimeout perme d'éviter un conflit de setState
    setTimeout(() => {
      setFieldValue("location", item);
    }, 0);
  };

  const renderFormik = () => {
    return (
      <div className="card-body c-home-hero__card-body">
        <h1 className="card-title">
          <span className="d-block c-home-hero__title c-home-hero__title1">Se former et travailler</span>
          <span className="d-block c-home-hero__title c-home-hero__title2">en alternance</span>
        </h1>
        <p className="card-text mb-sm-5">
          <span className="d-block c-home-hero__subtitle">Trouvez la formation et l’entreprise pour</span>
          <span className="d-block c-home-hero__subtitle">réaliser votre projet d'alternance</span>
        </p>

        <Formik
          validate={(values) => {
            const errors = {};
            if (!values.job || !values.job.label || !values.job.romes || !values.job.romes.length > 0) {
              errors.job = "Veuillez sélectionner un métier proposé";
            }
            if (!values.location || !values.location.label) {
              errors.location = "Veuillez sélectionner un lieu proposé";
            }
            return errors;
          }}
          initialValues={formValues ?? { job: {}, location: {} }}
          onSubmit={handleSearchSubmit}
        >
          {({ isSubmitting, errors, setFieldValue }) => (
            <Form>
              <div className={`form-group c-home-hero__input mb-2 ${errors.job ? "form-group--onerror" : ""}`}>
                <AutoCompleteField
                  items={[]}
                  itemToStringFunction={autoCompleteToStringFunction}
                  onSelectedItemChangeFunction={updateValuesFromJobAutoComplete}
                  compareItemFunction={compareAutoCompleteValues}
                  onInputValueChangeFunction={jobChanged}
                  previouslySelectedItem={formValues?.job ?? null}
                  name="jobField"
                  placeholder="Ex : boulangerie"
                  illustration={glassImage}
                  isHome={true}
                  searchPlaceholder="Indiquez le métier recherché ci-dessus"
                />
                <ErrorMessage name="job" className="u-error-text-color" component="div" />
              </div>
              <div
                className={`form-group c-home-hero__input mb-3 mb-sm-4 ${errors.location ? "form-group--onerror" : ""}`}
              >
                <AutoCompleteField
                  items={[]}
                  itemToStringFunction={autoCompleteToStringFunction}
                  onSelectedItemChangeFunction={updateValuesFromPlaceAutoComplete}
                  compareItemFunction={compareAutoCompleteValues}
                  onInputValueChangeFunction={addressChanged}
                  previouslySelectedItem={formValues?.location ?? null}
                  scrollParentId="choiceColumn"
                  name="placeField"
                  placeholder="Adresse, ville ou code postal"
                  illustration={localisationImage}
                  isHome={true}
                  searchPlaceholder="Indiquez le lieu recherché ci-dessus"
                />
                <ErrorMessage name="location" className="u-error-text-color" component="div" />
              </div>
              <div className="form-group c-home-hero__input">
                <input
                  type="submit"
                  value="C'est parti !"
                  className="d-block btn btn-lg btn-dark w-100 font-weight-bold c-regular-darkbtn gtmSearch gtmHome"
                  data-disable-with="C'est parti !"
                  disabled={isSubmitting}
                />
              </div>
            </Form>
          )}
        </Formik>
        <p>&nbsp;</p>
      </div>
    );
  };

  return <>{domainError ? <DomainError></DomainError> : renderFormik()}</>;
};

export default StartForm;
