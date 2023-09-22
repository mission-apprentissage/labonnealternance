import { z } from "zod"

const ZMetier = z
  .object({
    code: z.string(),
    libelle: z.string(),
  })
  .strict()
const ZMetierCible = z
  .object({
    metierCible: ZMetier,
  })
  .strict()

const ZAppellation = z
  .object({
    code: z.string(),
    libelle: z.string(),
    libelleCourt: z.string(),
    metier: z
      .object({
        code: z.string(),
        libelle: z.string(),
      })
      .strict(),
  })
  .strict()

export const ZRomeDetail = z
  .object({
    code: z.string(),
    libelle: z.string(),
    definition: z.string(),
    acces: z.string(),
    condition: z.string(),
    riasecMajeur: z.string(),
    riasecMineur: z.string(),
    codeIsco: z.string(),
    particulier: z.boolean(),
    domaineProfessionnel: z
      .object({
        code: z.string(),
        libelle: z.string(),
        grandDomaine: z
          .object({
            code: z.string(),
            libelle: z.string(),
          })
          .strict(),
      })
      .strict(),
    appellations: z.array(
      z
        .object({
          code: z.string(),
          libelle: z.string(),
          libelleCourt: z.string(),
          particulier: z.boolean(),
        })
        .strict()
    ),
    competencesDeBase: z.array(
      z
        .object({
          code: z.string(),
          libelle: z.string(),
          noeudCompetence: z
            .object({
              code: z.string(),
              libelle: z.string(),
              racineCompetence: z
                .object({
                  code: z.string(),
                  libelle: z.string(),
                })
                .strict(),
            })
            .strict(),
          typeCompetence: z.string(),
          riasecMineur: z.string(),
          riasecMajeur: z.string(),
        })
        .strict()
    ),
    themes: z.array(
      z
        .object({
          code: z.string(),
          libelle: z.string(),
        })
        .strict()
    ),
    mobilitesProchesVersMetiers: z.array(ZMetierCible),
    mobilitesEvolutionsVersMetiers: z.array(ZMetierCible),
    mobilitesEvolutionsVersAppellations: z.array(
      z
        .object({
          appellationCible: ZAppellation,
        })
        .strict()
    ),
    mobilitesEvolutionsAppellationsVersMetiers: z.array(
      z
        .object({
          metierCible: z
            .object({
              code: z.string(),
              libelle: z.string(),
            })
            .strict(),
          appellationOrigine: ZAppellation,
        })
        .strict()
    ),
    mobilitesProchesAppellationsVersAppellations: z.array(
      z
        .object({
          appellationOrigine: ZAppellation,
          appellationCible: ZAppellation,
        })
        .strict()
    ),
  })
  .strict()
