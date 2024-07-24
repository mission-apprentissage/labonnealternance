import { getFranceTravailTokenFromAPI } from "../../common/apis/FranceTravail"

export const generateFranceTravailAccess = async () => await getFranceTravailTokenFromAPI("OFFRE")
