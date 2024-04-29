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

export const ZFicheRomeV4 = z
  .object({
    rome_code: z.string(),
    fiche_metier: ZRomeDetail,
  })
  .strict()

export type IFicheRomeV4 = z.output<typeof ZFicheRomeV4>

const ZRome = z
  .object({
    code_rome: z.string(),
    intitule: z.string(),
    code_ogr: z.string(),
  })
  .strict()

const ZRomeAppellation = z
  .object({
    libelle: z.string(),
    libelle_court: z.string(),
    code_ogr: z.string(),
  })
  .strict()

const ZRomeItem = z
  .object({
    libelle: z.string(),
    code_ogr: z.string(),
  })
  .strict()

const ZRomeSavoir = z
  .object({
    libelle: z.string(),
    items: z.array(ZRomeItem),
  })
  .strict()

const ZRomeCompetence = z
  .object({
    savoir_faire: z.array(ZRomeSavoir),
    savoir_etre_professionnel: z.array(ZRomeSavoir),
    savoirs: z.array(ZRomeSavoir),
  })
  .strict()

const ZRomeContextesTravail = z
  .object({
    libelle: z.string(),
    items: z.array(ZRomeItem),
  })
  .strict()

const ZRomeMobiliteItem = z
  .object({
    appellation_source: z.string(),
    code_ogr_appellation_source: z.string(),
    rome_cible: z.string(),
    code_org_rome_cible: z.string(),
    appellation_cible: z.string(),
    code_ogr_appellation_cible: z.string(),
  })
  .strict()

const ZRomeMobilite = z
  .object({
    proche: z.array(ZRomeMobiliteItem),
    si_evolution: z.array(ZRomeMobiliteItem),
  })
  .strict()

export const ZReferentielRome = z
  .object({
    numero: z.string(),
    rome: ZRome,
    appellations: z.array(ZRomeAppellation),
    definition: z.string(),
    acces_metier: z.string(),
    competences: z.array(ZRomeCompetence),
    contextes_travail: z.array(ZRomeContextesTravail),
    mobilites: z.array(ZRomeMobilite),
  })
  .strict()

export type IReferentielRome = z.output<typeof ZReferentielRome>
