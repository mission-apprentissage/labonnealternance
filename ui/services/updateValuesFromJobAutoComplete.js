import formikUpdateValue from "../services/formikUpdateValue"

// Mets à jours les valeurs de champs du formulaire Formik à partir de l'item sélectionné dans l'AutoCompleteField
export default function updateValuesFromJobAutoComplete(item, setFieldValue) {
  formikUpdateValue(item, setFieldValue, "job")
}
