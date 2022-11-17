import Yup from "yup"
import config from "../config.js"
import { isEmailBurner } from "burner-email-providers"
import { Application } from "../common/model/index.js"

const validateSendApplication = async (validable) => {
  let schema = Yup.object().shape({
    fileName: Yup.string().nullable().required("⚠ La pièce jointe est requise"),
    fileContent: Yup.string().nullable().required("⚠ La pièce jointe est requise"),
    firstName: Yup.string().max(50, "⚠ Doit avoir 50 caractères ou moins").required("⚠ Le prénom est requis."),
    lastName: Yup.string().max(50, "⚠ Doit avoir 50 caractères ou moins").required("⚠ Le nom est requis."),
    email: Yup.string().email("⚠ Adresse e-mail invalide.").required("⚠ L'adresse e-mail est requise."),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "⚠ Le numéro de téléphone doit avoir exactement 10 chiffres")
      .required("⚠ Le téléphone est requis"),
  })
  let validation = await schema.validate(validable).catch(function () {
    return "erreur"
  })

  if (validation === "erreur") {
    return "données de candidature invalides"
  } else {
    return "ok"
  }
}

const validateFileContent = async (validable, scan) => {
  let schema = Yup.object().shape({
    fileName: Yup.string().matches(/([a-zA-Z0-9\s_\\.\-():])+(.docx|.pdf)$/i, "⚠ Seuls les fichiers docx et pdf sont autorisés"),
    fileContent: Yup.string().max(4215276, "⚠ La taille maximale de la pièce jointe est 3 Mo"),
  })

  let validation = await schema.validate(validable).catch(function () {
    return "erreur"
  })

  if (validation === "erreur") {
    return "pièce jointe invalide"
  }

  const isInfected = await scan(validable.fileContent)

  if (isInfected) {
    validation = "erreur"
  }

  if (validation === "erreur") {
    return "pièce jointe invalide"
  } else {
    return "ok"
  }
}

const validateCompanyEmail = async (validable) => {
  let schema = Yup.object().shape({
    companyEmail: Yup.string().email("⚠ Adresse e-mail société invalide.").required("⚠ L'adresse e-mail société est requise."),
    cryptedEmail: Yup.string().email("⚠ Adresse e-mail chiffrée invalide."),
  })
  let validation = await schema.validate(validable).catch(function () {
    return "erreur"
  })
  if (validation === "erreur") {
    return "email société invalide"
  } else {
    return "ok"
  }
}

const validatePermanentEmail = async (validable) => {
  if (isEmailBurner(validable.email)) {
    return "email temporaire non autorisé"
  }
  return "ok"
}

const checkUserApplicationCount = async (applicantEmail) => {
  let start = new Date()
  start.setHours(0, 0, 0, 0)

  let end = new Date()
  end.setHours(23, 59, 59, 999)

  let appCount = await Application.countDocuments({
    applicant_email: applicantEmail.toLowerCase(),
    created_at: { $gte: start, $lt: end },
  })

  if (appCount > config.maxApplicationPerDay) {
    return "max candidatures atteint"
  } else {
    return "ok"
  }
}

const validateFeedbackApplication = async (validable) => {
  let schema = Yup.object().shape({
    id: Yup.string().required("⚠ ID manquant."),
    iv: Yup.string().required("⚠ IV manquant."),
    avis: Yup.string()
      .required("⚠ Avis manquant.")
      .matches(/(neutre|utile|pasUtile)/, "⚠ Valeur non conforme"),
  })
  await schema.validate(validable).catch(function () {
    throw "error - validation of data failed"
  })
  return "ok"
}

const validateFeedbackApplicationComment = async (validable) => {
  let schema = Yup.object().shape({
    id: Yup.string().required("⚠ ID manquant."),
    iv: Yup.string().required("⚠ IV manquant."),
    comment: Yup.string().required("⚠ Commentaire manquant."),
  })
  await schema.validate(validable).catch(function () {
    throw "error - validation of data failed"
  })
  return "ok"
}

const validateIntentionApplication = async (validable) => {
  let schema = Yup.object().shape({
    id: Yup.string().required("⚠ ID manquant."),
    iv: Yup.string().required("⚠ IV manquant."),
    intention: Yup.string()
      .required("⚠ Avis manquant.")
      .matches(/(refus|ne_sais_pas|entretien)/, "⚠ Valeur non conforme"),
  })
  await schema.validate(validable).catch(function () {
    throw "error - validation of data failed"
  })
  return "ok"
}

export {
  validateSendApplication,
  validateCompanyEmail,
  validateFeedbackApplication,
  validateFeedbackApplicationComment,
  validateIntentionApplication,
  validatePermanentEmail,
  checkUserApplicationCount,
  validateFileContent,
}
