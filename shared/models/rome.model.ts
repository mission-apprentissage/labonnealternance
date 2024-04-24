import { z } from "../helpers/zodWithOpenApi"

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
    codeIsco: z.string().nullish(),
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
          riasecMineur: z.string().nullish(),
          riasecMajeur: z.string().nullish(),
          competenceCle: z.boolean().nullish(),
          frequence: z.number().nullish(),
        })
        .strict()
    ),
    groupesCompetencesSpecifiques: z.array(z.any()),
    environnementsTravail: z.array(z.any()),
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
    mobilitesProchesVersAppellations: z.array(z.any()),
    mobilitesEvolutionsVersAppellations: z.array(
      z
        .object({
          appellationCible: ZAppellation,
        })
        .strict()
    ),
    mobilitesProchesAppellationsVersMetiers: z.array(z.any()),
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
    mobilitesEvolutionsAppellationsVersAppellations: z.array(z.any()),
  })
  .strict()
  .openapi("RomeDetail")
//.deepPartial()

const ZCompetenceV4 = z
  .object({
    type: z.string(),
    code: z.string(),
    libelle: z.string(),
    codeOgr: z.string(),
    riasecMajeur: z.string().optional(),
    riasecMineur: z.string().optional(),
  })
  .strict()

const ZRomeV4Item = z
  .object({
    code: z.string(),
    libelle: z.string(),
  })
  .strict()

const ZRomeV4Appellation = z
  .object({
    code: z.string(),
    libelle: z.string(),
    libelleCourt: z.string(),
    classification: z.string().optional(),
    competenceCles: z.array(z.any()).optional(),
  })
  .strict()

export const ZFicheRomeV4 = z
  .object({
    obsolete: z.boolean(),
    code: z.string(),
    libelle: z.string(),
    definition: z.string(),
    accesEmploi: z.string(),
    riasecMajeur: z.string(),
    riasecMineur: z.string(),
    codeIsco: z.string().nullish(),
    particulier: z.boolean(),
    domaineProfessionnel: z
      .object({
        code: z.string(),
        libelle: z.string(),
        grandDomaine: ZRomeV4Item.strict(),
      })
      .strict(),
    appellations: z.array(ZRomeV4Appellation),
    themes: z.array(ZRomeV4Item),
    centresInterets: z.array(z.any()),
    secteursActivites: z.array(z.object({ code: z.string(), libelle: z.string(), secteurActivite: z.any() }).strict()),
    competencesMobilisees: z.array(ZCompetenceV4),
    competencesMobiliseesPrincipales: z.array(ZCompetenceV4),
    competencesMobiliseesEmergentes: z.array(ZCompetenceV4),
    divisionsNaf: z.array(ZRomeV4Item),
    formacodes: z.array(ZRomeV4Item),
    contextesTravail: z.array(ZRomeV4Item),
  })
  .strict()
  .openapi("ReferentielRome")

export type IFicheRome = z.output<typeof ZFicheRomeV4>

export const ZReferentielRome = z
  .object({
    rome_code: z.string(),
    fiche_metier: ZFicheRomeV4,
  })
  .strict()

export type IReferentielRome = z.output<typeof ZReferentielRome>
