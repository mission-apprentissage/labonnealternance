import { NIVEAUX_POUR_LBA } from "shared/constants/recruteur"
import { z } from "../helpers/zod-with-open-api.js"
import { typedKeys } from "../utils/object-utils.js"

// Paramètres de l'API publique V1 (jobs.routes, geo.routes, search.routes) :
// ne rien retirer ici sans vérifier le contrat d'API. Les paramètres propres
// à l'UI du moteur de recherche legacy vivent dans
// ui/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils.ts.

export const zRefererHeaders = z.looseObject({
  referer: z.string().optional(),
})

export const zRncpsParams = z.string().optional()

export const ZLatitudeParam = z.coerce.number<number>().optional()

export const ZLongitudeParam = z.coerce.number<number>().optional()

export const ZRadiusParam = z.coerce.number<number>().optional()

export const zInseeParams = z.string().optional()

const diplomaLevels = typedKeys(NIVEAUX_POUR_LBA)

export const zDiplomaParam = z.enum([diplomaLevels[0], ...diplomaLevels.slice(1)]).optional()

export type IDiplomaParam = z.output<typeof zDiplomaParam>

export const zOpcoParams = z.string().optional()
