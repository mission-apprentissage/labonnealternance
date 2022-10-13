// Mets à jours les valeurs de champs du formulaire Formik à partir de l'item sélectionné dans l'AutoCompleteField
export default async function formikUpdateValue(item, setFieldValue, name) {
  //setTimeout permets d'éviter un conflit de setState
  setTimeout(() => {
    setFieldValue(name, item);
  }, 0);
};

