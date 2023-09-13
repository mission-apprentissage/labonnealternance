import * as Yup from "yup"

export function getInitialSchemaValues() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    fileName: "",
    fileContent: null,
    message: "",
    //interetOffresMandataire: false,
  }
}

const commonControls = {
  fileName: Yup.string().nullable().required("⚠ La pièce jointe est obligatoire"),
  firstName: Yup.string().max(50, "⚠ Doit avoir 50 caractères ou moins").required("⚠ Le prénom est obligatoire"),
  lastName: Yup.string().max(50, "⚠ Doit avoir 50 caractères ou moins").required("⚠ Le nom est obligatoire"),
  email: Yup.string().email("⚠ Adresse e-mail invalide").required("⚠ L'adresse e-mail est obligatoire"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "⚠ Le numéro de téléphone doit avoir exactement 10 chiffres")
    .required("⚠ Le téléphone est obligatoire"),
}

export function getValidationSchema(actualKind) {
  return Yup.object({
    ...commonControls,
  })
}
