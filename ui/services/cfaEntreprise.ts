const listeCfaEntreprise = [
  "40863294100030",
  "44301104400049",
  "45200962400035",
  "80982162200028",
  "82427045800014",
  "83415492400015",
  "83467788200013",
  "85273947300019",
  "87838051800026",
  "88023479400019",
  "88847499600012",
  "88985357800017",
  "89127069600018",
  "85163550800019",
  "40130835800019",
  "88514020200015",
  "32368273200033",
  "51825892600048",
]

export const isCfaEntreprise = (siret: string, siretGestionnaire: string) => {
  return listeCfaEntreprise.indexOf(siret) >= 0 || listeCfaEntreprise.indexOf(siretGestionnaire) >= 0
}
