export const parcoursupEtablissementStatSchema = {
  siret_formateur: {
    type: String,
    default: null,
    description: "Siret formateur",
  },
  raison_sociale: {
    type: String,
    default: null,
    description: "Raison sociale",
  },
  premium_activation_date: {
    type: Date,
    default: null,
    description: "Date d'activation du premium",
  },
  total_appointments: {
    type: Number,
    default: null,
    description: "Nombre total de rendez-vous",
  },
  applicants_details_checked: {
    type: Number,
    default: null,
    description: "Nombre de rendez-vous consultés par l'établissement",
  },
  applicants_details_not_checked: {
    type: Number,
    default: null,
    description: "Nombre de rendez-vous non consultés par l'établissement",
  },
  percentage_of_appointment_opened: {
    type: Number,
    default: null,
    description: "Pourcentage de rendez-vous consultés",
  },
  average_time_to_check_applicant_details_in_minutes: {
    type: Number,
    default: null,
    description: "Nombre de minutes avant la consultation du rendez-vous",
  },
  average_time_to_check_applicant_details_in_hours: {
    type: Number,
    default: null,
    description: "Nombre d'heures avant la consultation du rendez-vous",
  },
  average_time_to_check_applicant_details_in_days: {
    type: Number,
    default: null,
    description: "Nombre de jours avant la consultation du rendez-vous",
  },
}
