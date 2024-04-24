import { z } from "../helpers/zodWithOpenApi"

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
    competencesCles: z.array(z.any()).optional(),
  })
  .strict()

export const ZRomeDetail = z
  .object({
    obsolete: z.boolean(),
    code: z.string(),
    libelle: z.string(),
    definition: z.string(),
    accesEmploi: z.string(),
    riasecMajeur: z.string(),
    riasecMineur: z.string(),
    codeIsco: z.string().nullish(),
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
    contextesTravail: z.array(ZRomeV4Item.extend({ categorie: z.string() })),
  })
  .strict()
  .openapi("ReferentielRome")

export type IFicheRome = z.output<typeof ZRomeDetail>

export const ZReferentielRome = z
  .object({
    rome_code: z.string(),
    fiche_metier: ZRomeDetail,
  })
  .strict()

export type IReferentielRome = z.output<typeof ZReferentielRome>
