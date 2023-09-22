const getTrainingAddress = (school, lowerCase) => {
  let schoolAddress = school.etablissement_formateur_adresse
    ? `${school.etablissement_formateur_adresse}${school.etablissement_formateur_complement_adresse ? `, ${school.etablissement_formateur_complement_adresse}` : ""} ${
        school.etablissement_formateur_localite ? school.etablissement_formateur_localite : ""
      } ${school.etablissement_formateur_code_postal ? school.etablissement_formateur_code_postal : ""}${
        school.etablissement_formateur_cedex ? ` CEDEX ${school.etablissement_formateur_cedex}` : ""
      }
      `
    : `${school.etablissement_responsable_adresse}${school.etablissement_responsable_complement_adresse ? `, ${school.etablissement_responsable_complement_adresse}` : ""} ${
        school.etablissement_responsable_localite ? school.etablissement_responsable_localite : ""
      } ${school.etablissement_responsable_code_postal ? school.etablissement_responsable_code_postal : ""}${
        school.etablissement_responsable_cedex ? ` CEDEX ${school.etablissement_responsable_cedex}` : ""
      }
      `

  if (lowerCase) schoolAddress = schoolAddress.toLowerCase()

  return schoolAddress
}

export { getTrainingAddress }
