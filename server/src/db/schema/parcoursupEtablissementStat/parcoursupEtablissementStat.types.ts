interface IParcoursupEtablissementStat {
  formateur_siret: string
  raison_sociale: string
  premium_activation_date: Date
  total_appointments: number
  applicants_details_checked: number
  applicants_details_not_checked: number
  percentage_of_appointment_opened: number
  average_time_to_check_applicant_details_in_minutes: number
  average_time_to_check_applicant_details_in_hours: number
  average_time_to_check_applicant_details_in_days: number
}

export { IParcoursupEtablissementStat }
