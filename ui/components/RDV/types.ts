import { EReasonsKey } from "shared"

type IAppointmentRequestRecapResponse = {
  appointment: {
    _id: string
    cfa_intention_to_applicant: any
    cfa_message_to_applicant_date: any
    cfa_message_to_applicant: any
    applicant_message_to_cfa: string
    applicant_reasons: string[]
    cle_ministere_educatif: string
    applicant_id: string
  }
  user: {
    _id: string
    firstname: string
    lastname: string
    phone: string
    email: string
    type: string
  }
  etablissement: {
    _id: string
    training_intitule_long: string
    etablissement_formateur_raison_sociale: string
    lieu_formation_street: string
    lieu_formation_email: string
    lieu_formation_city: string
    lieu_formation_zip_code: string
  }
}

type IAppointmentRequestRecapResponseShort = {
  user: {
    firstname: string
    lastname: string
    phone: string
    email: string
  }
  etablissement: {
    etablissement_formateur_raison_sociale: string
    lieu_formation_email: string
  }
}

const reasons = [
  {
    key: EReasonsKey.MODALITE,
    title: "Modalités d'inscription",
    checked: false,
  },
  {
    key: EReasonsKey.PLACE,
    title: "Places disponibles",
    checked: false,
  },
  {
    key: EReasonsKey.ACCOMPAGNEMENT,
    title: "Accompagnement dans la recherche d'entreprise",
    checked: false,
  },
  {
    key: EReasonsKey.FRAIS,
    title: "Frais d'inscription",
    checked: false,
  },
  {
    key: EReasonsKey.CONTENU,
    title: "Contenu de la formation",
    checked: false,
  },
  {
    key: EReasonsKey.HORAIRE,
    title: "Horaires / rythme de la formation",
    checked: false,
  },
  {
    key: EReasonsKey.DEBOUCHE,
    title: "Situation des élèves en sortie de formation",
    checked: false,
  },
  {
    key: EReasonsKey.PLUS,
    title: "En savoir plus sur l'alternance",
    checked: false,
  },
  {
    key: EReasonsKey.SUIVI,
    title: "Suivi de ma candidature",
    checked: false,
  },
  {
    key: EReasonsKey.LIEU,
    title: "Lieu de la formation",
    checked: false,
  },
  {
    key: EReasonsKey.PORTE,
    title: "Portes ouvertes",
    checked: false,
  },
  {
    key: EReasonsKey.AUTRE,
    title: "Autre :",
    checked: false,
  },
]

export type { IAppointmentRequestRecapResponse, IAppointmentRequestRecapResponseShort }

export { reasons }
