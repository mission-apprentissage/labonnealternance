import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Link from "next/link"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { AllerPlusLoinItem } from "@/app/(editorial)/_components/AllerPlusLoinItem"
import { diplomeData } from "@/app/(editorial)/alternance/_components/diplome_data"
import { accentSx, cardArrowSx, cardLinkStyle, cardSubtitleSx, cardTitleSx, formatLong, listicleCardSx } from "@/app/(editorial)/alternance/_components/hubStyles"
import { metierData } from "@/app/(editorial)/alternance/_components/metier_data"
import { SectionTitle } from "@/app/(editorial)/alternance/_components/SectionTitle"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { SchemaOrg } from "@/components/SchemaOrg"
import { ArrowRightLine } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.alternanceDiplomes.getMetadata().title,
  description: PAGES.static.alternanceDiplomes.getMetadata().description,
}

const faqItems = [
  {
    question: "Quels diplômes peut-on préparer en alternance ?",
    answer:
      "Quasiment tous les diplômes professionnels du CAP au Master sont accessibles en alternance : CAP, Bac Pro, Mention Complémentaire, BTS, BUT (ex-DUT), Licence Pro, Master, Diplôme d'Ingénieur et Titres RNCP. La bonne alternance recense des fiches détaillées par diplôme pour comparer programme, durée, salaire et débouchés.",
  },
  {
    question: "Quelle est la différence entre BTS, BUT et Licence Pro en alternance ?",
    answer:
      "Le BTS (Bac+2) est le diplôme le plus court et le plus professionnalisant, parfait pour entrer rapidement sur le marché. Le BUT (Bachelor Universitaire de Technologie, Bac+3, ex-DUT) offre une formation plus large et théorique tout en restant professionnalisante. La Licence Pro (Bac+3) se prépare en 1 an après un Bac+2 et se spécialise sur un métier précis. Les trois sont accessibles en alternance dans la grande majorité des établissements.",
  },
  {
    question: "Quel diplôme choisir pour quelle alternance ?",
    answer:
      "Tout dépend de votre projet professionnel. Pour les fonctions support et gestion : les BTS tertiaires puis Licences Pro spécialisées. Pour le commerce et le marketing : les BTS commerciaux et BUT TC. Pour le numérique : BTS SIO, BUT informatique, Licences Pro et Masters spécialisés. Pour la petite enfance ou le médico-social : CAP, Bac Pro et Titres Pro dédiés. Consultez chaque fiche diplôme pour comparer programme, durée, salaire et débouchés.",
  },
  {
    question: "Est-ce qu'un diplôme préparé en alternance vaut autant qu'un diplôme préparé en temps plein ?",
    answer:
      "Oui, sans aucune différence sur le diplôme lui-même. Un BTS, une Licence Pro ou un Master obtenu en alternance est strictement identique à celui obtenu en formation initiale classique : même intitulé, même valeur sur le marché du travail. Beaucoup de recruteurs valorisent même davantage les profils issus de l'alternance car ils combinent diplôme et expérience professionnelle réelle.",
  },
  {
    question: "Combien de temps dure un diplôme en alternance ?",
    answer:
      "Cela dépend du niveau : CAP en 2 ans, Bac Pro en 3 ans (ou 2 ans après un CAP), BTS en 2 ans, BUT en 3 ans, Licence Pro en 1 an, Master en 2 ans. Le rythme d'alternance varie selon les formations : 2 jours en CFA / 3 jours en entreprise, 1 semaine sur 2, 1 mois sur 2… Les pages diplôme détaillent le rythme spécifique à chaque formation.",
  },
  {
    question: "Quel est le salaire d'un alternant selon le diplôme préparé ?",
    answer:
      "Le salaire ne dépend pas du diplôme préparé mais de l'âge et de l'année du contrat. En apprentissage, il varie de 27 % du SMIC (moins de 18 ans, 1re année) à 100 % du SMIC (26 ans et plus). Sur certains diplômes Bac+3 et Bac+5, les entreprises pratiquent souvent au-dessus du minimum légal, en particulier dans l'informatique, la finance ou le marketing. Salaire moyen constaté : 1 050 € brut/mois tous diplômes confondus.",
  },
]

export default function AlternanceDiplomes() {
  const url = PAGES.static.alternanceDiplomes.getPath()
  const meta = PAGES.static.alternanceDiplomes.getMetadata?.() ?? { title: PAGES.static.alternanceDiplomes.title, description: "" }
  const metaTitle = typeof meta.title === "string" ? meta.title : PAGES.static.alternanceDiplomes.title
  const metaDescription = typeof meta.description === "string" ? meta.description : ""
  const breadcrumbs = [
    { name: "Accueil", url: "/" },
    { name: "Diplômes en alternance", url },
  ]
  const itemList = diplomeData.map((d) => ({
    name: `${d.titre} en alternance`,
    url: PAGES.dynamic.seoDiplome(d.slug).getPath(),
  }))

  const diplomeExamples = diplomeData.slice(0, 3)
  const metiersHighlight = metierData.slice(0, 6)
  const villesHighlight = villeData.slice(0, 6)

  const findDiplome = (slug: string) => diplomeData.find((d) => d.slug === slug)
  const btsCg = findDiplome("bts-cg")
  const btsGpme = findDiplome("bts-gpme")
  const btsMco = findDiplome("bts-mco")
  const btsNdrc = findDiplome("bts-ndrc")
  const btsSio = findDiplome("bts-sio")
  const capAepe = findDiplome("cap-aepe")
  const secretaireMedicale = findDiplome("titre-pro-secretaire-medicale")
  const licenceProRh = findDiplome("licence-pro-rh")

  const kpiCards = [
    { value: `${diplomeData.length}`, label: "fiches diplôme détaillées" },
    { value: "CAP à Bac+5", label: "niveaux couverts" },
    { value: "1 à 3 ans", label: "durée de formation" },
    { value: "62 %", label: "en emploi 6 mois après le diplôme" },
  ]

  return (
    <Box>
      <SchemaOrg type="CollectionPage" title={metaTitle} description={metaDescription} url={url} breadcrumbs={breadcrumbs} />
      <SchemaOrg
        type="ItemList"
        title="Liste des diplômes accessibles en alternance"
        description="Annuaire des principaux diplômes en alternance : BTS, BUT, Licence Pro, CAP, Titres RNCP."
        url={url}
        breadcrumbs={breadcrumbs}
        itemList={itemList}
        omitBreadcrumb
      />
      <SchemaOrg
        type="FAQPage"
        title="Questions fréquentes sur les diplômes en alternance"
        description="Toutes les réponses sur les diplômes, programmes, durées et débouchés en alternance."
        url={url}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        omitBreadcrumb
      />

      <Breadcrumb pages={[PAGES.static.alternanceDiplomes]} />

      <DefaultContainer>
        {/* HERO */}
        <Box
          sx={{
            p: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
            mb: fr.spacing("4v"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Typography id="editorial-content-container" component="h1" variant="h1" sx={{ mb: fr.spacing("4v") }}>
            Tous les diplômes accessibles en alternance
          </Typography>
          <Box
            component="hr"
            sx={{
              maxWidth: "93px",
              border: "none",
              borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`,
              opacity: 1,
              my: fr.spacing("4v"),
            }}
          />
          <Typography component="p" sx={{ mb: fr.spacing("3v"), fontSize: "1.125rem", fontWeight: 500 }}>
            L'alternance permet de préparer un diplôme reconnu par l'État du CAP au Master, avec une expérience professionnelle réelle en entreprise. La bonne alternance détaille{" "}
            {diplomeData.length} diplômes phares avec leur programme, leur durée et leurs débouchés. Voici comment choisir le vôtre.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v"), fontSize: "1.125rem" }}>
            La bonne alternance recense <strong>{diplomeData.length} fiches diplôme</strong> à préparer en alternance, du CAP aux titres de niveau Bac+5, en passant par les BTS,
            BUT, Licences Professionnelles et Masters les plus demandés. Pour chaque diplôme — par exemple{" "}
            {diplomeExamples.map((d, i) => (
              <span key={d.slug}>
                <Link href={PAGES.dynamic.seoDiplome(d.slug).getPath()}>{d.titre}</Link>
                {i < diplomeExamples.length - 2 ? ", " : i === diplomeExamples.length - 2 ? " ou " : ""}
              </span>
            ))}{" "}
            — retrouvez le programme détaillé, la durée et le rythme, le salaire moyen, les écoles et CFA partenaires, ainsi que les débouchés professionnels concrets.
          </Typography>
          <Typography component="p" sx={{ fontSize: "1.125rem" }}>
            En France, un diplôme préparé en alternance — apprentissage ou contrat de professionnalisation — a exactement la même valeur que celui obtenu en formation initiale,
            avec en prime une expérience professionnelle solide qui fait toute la différence à l'embauche. La bonne alternance vous aide à choisir le diplôme qui correspond à votre
            projet et à le préparer dans les meilleures conditions.
          </Typography>

          {/* KPI cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: fr.spacing("3v"),
              mt: fr.spacing("8v"),
            }}
          >
            {kpiCards.map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  textAlign: "center",
                  p: { xs: fr.spacing("3v"), md: fr.spacing("4v") },
                  backgroundColor: fr.colors.decisions.background.default.grey.default,
                  borderRadius: "5px",
                  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: fr.spacing("1v"),
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "24px", md: "32px" },
                    lineHeight: { xs: "30px", md: "40px" },
                    color: fr.colors.decisions.text.default.info.default,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "14px", md: "16px" }, lineHeight: { xs: "20px", md: "24px" } }}>{stat.label}</Typography>
              </Box>
            ))}
          </Box>
          <Typography sx={{ mt: fr.spacing("2v"), fontSize: "0.75rem", fontStyle: "italic", color: fr.colors.decisions.text.mention.grey.default, textAlign: "right" }}>
            *Source : DARES/DEPP, insertion des apprentis 6 mois après leur sortie d'études (génération 2024)
          </Typography>
        </Box>

        <Typography sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("4v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          Dernière mise à jour : mai 2026 · Source : La bonne alternance, service public de l'alternance (DGEFP)
        </Typography>

        {/* EDITO QUESTION */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle title="Quel diplôme préparer en alternance selon son projet ?" />
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            <Typography component="span" sx={accentSx}>
              Les filières tertiaires et de gestion
            </Typography>{" "}
            concentrent une grande partie des diplômes phares de l'alternance. Du CAP au Master, les formations en comptabilité, gestion d'entreprise, ressources humaines et
            assistanat managérial mènent à des fonctions support très recherchées dans les PME, les ETI et les grands groupes. Les BTS et BUT (Bac+2 / Bac+3) — comme le{" "}
            {btsCg ? <Link href={PAGES.dynamic.seoDiplome(btsCg.slug).getPath()}>{btsCg.titre}</Link> : "BTS CG"} ou le{" "}
            {btsGpme ? <Link href={PAGES.dynamic.seoDiplome(btsGpme.slug).getPath()}>{btsGpme.titre}</Link> : "BTS GPME"} — offrent une entrée rapide sur le marché, tandis que les
            Licences Professionnelles et Masters spécialisés permettent une montée en compétences sur des expertises pointues.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            <Typography component="span" sx={accentSx}>
              Côté commerce, vente et marketing
            </Typography>
            , l'alternance reste l'une des voies royales pour acquérir des réflexes terrain. Les BTS commerciaux — par exemple le{" "}
            {btsMco ? <Link href={PAGES.dynamic.seoDiplome(btsMco.slug).getPath()}>{btsMco.titre}</Link> : "BTS MCO"} ou le{" "}
            {btsNdrc ? <Link href={PAGES.dynamic.seoDiplome(btsNdrc.slug).getPath()}>{btsNdrc.titre}</Link> : "BTS NDRC"} — et le BUT Techniques de Commercialisation forment aux
            métiers de la vente, du retail et du e-commerce. Les Licences Pro et Masters en marketing digital, communication ou data prolongent cette logique sur des fonctions plus
            stratégiques (chef de produit, traffic manager, responsable marketing).
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            <Typography component="span" sx={accentSx}>
              Pour le numérique et l'informatique
            </Typography>
            , l'éventail va du {btsSio ? <Link href={PAGES.dynamic.seoDiplome(btsSio.slug).getPath()}>{btsSio.titre}</Link> : "BTS SIO"} (services informatiques aux organisations)
            aux Masters spécialisés (cybersécurité, data science, IA, cloud), en passant par le BUT Informatique et les Licences Pro. Les débouchés sont massifs : développeur,
            administrateur réseaux, technicien support, data analyst, ingénieur DevOps — autant de métiers en tension où l'alternance est particulièrement valorisée par les
            recruteurs.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            <Typography component="span" sx={accentSx}>
              Pour la petite enfance, le médico-social et la santé administrative
            </Typography>
            , des diplômes courts (CAP, Bac Pro, Titres Pro de niveau 4 à 5) — comme le{" "}
            {capAepe ? <Link href={PAGES.dynamic.seoDiplome(capAepe.slug).getPath()}>{capAepe.titre}</Link> : "CAP AEPE"} ou le{" "}
            {secretaireMedicale ? <Link href={PAGES.dynamic.seoDiplome(secretaireMedicale.slug).getPath()}>{secretaireMedicale.titre}</Link> : "Titre Pro Secrétaire médicale"} —
            permettent d'accéder rapidement à des métiers essentiels : assistant maternel, ATSEM, auxiliaire en crèche, secrétaire médicale, assistant dentaire. Ces formations en
            alternance répondent à une demande structurellement forte du secteur.
          </Typography>
          <Typography component="p">
            Si vous avez déjà un Bac+2 ou un Bac+3, les{" "}
            <Typography component="span" sx={accentSx}>
              Licences Pro et Masters en alternance
            </Typography>{" "}
            — par exemple la {licenceProRh ? <Link href={PAGES.dynamic.seoDiplome(licenceProRh.slug).getPath()}>{licenceProRh.titre}</Link> : "Licence Pro RH"} — constituent un
            excellent levier de spécialisation en 1 ou 2 ans (ressources humaines, finance, gestion de projet, ingénierie) pour accéder à des fonctions plus qualifiées avec une
            expérience professionnelle déjà solide.
          </Typography>
        </Box>

        {/* LISTICLE - scale 10 → 100 */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle
            title={`Quels diplômes préparer en alternance ? Les ${diplomeData.length} fiches à explorer`}
            description="Cliquez sur un diplôme pour accéder au programme, à la durée, au rythme et aux débouchés professionnels."
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
              gap: fr.spacing("3v"),
            }}
          >
            {diplomeData.map((d) => (
              <Link key={d.slug} href={PAGES.dynamic.seoDiplome(d.slug).getPath()} aria-label={`Tout savoir sur le ${d.titre} en alternance`} style={cardLinkStyle}>
                <Box sx={listicleCardSx}>
                  <Box>
                    <Typography sx={cardTitleSx}>{d.titre}</Typography>
                    <Typography sx={cardSubtitleSx}>{formatLong(d.intituleLongFormation)}</Typography>
                  </Box>
                  <ArrowRightLine sx={cardArrowSx} />
                </Box>
              </Link>
            ))}
          </Box>
        </Box>

        {/* CROSS LINK enrichi */}
        <Box
          sx={{
            mb: fr.spacing("10v"),
            mx: { xs: fr.spacing("2v"), md: 0 },
            p: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
          }}
        >
          <SectionTitle
            title="Explorer l'alternance autrement"
            description="Le diplôme est un excellent angle quand on sait précisément vers quoi on veut aller. Si vous hésitez encore, partez plutôt du métier visé ou de la ville où vous voulez travailler."
          />

          {/* Par métier */}
          <Box sx={{ mb: fr.spacing("8v") }}>
            <Typography
              component="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "20px", md: "24px" },
                lineHeight: { xs: "28px", md: "32px" },
                mb: fr.spacing("4v"),
                color: fr.colors.decisions.text.title.grey.default,
              }}
            >
              Par métier
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: fr.spacing("3v"),
                mb: fr.spacing("4v"),
              }}
            >
              {metiersHighlight.map((m) => (
                <Link key={m.slug} href={PAGES.dynamic.seoMetier(m.slug).getPath()} aria-label={`Alternance ${m.metier}`} style={cardLinkStyle}>
                  <Box sx={listicleCardSx}>
                    <Typography sx={cardTitleSx}>{m.metier}</Typography>
                    <ArrowRightLine sx={cardArrowSx} />
                  </Box>
                </Link>
              ))}
            </Box>
            <Link href={PAGES.static.alternanceMetiers.getPath()} className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right")}>
              Voir tous les métiers en alternance
            </Link>
          </Box>

          {/* Par ville */}
          <Box>
            <Typography
              component="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "20px", md: "24px" },
                lineHeight: { xs: "28px", md: "32px" },
                mb: fr.spacing("4v"),
                color: fr.colors.decisions.text.title.grey.default,
              }}
            >
              Par ville
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: fr.spacing("3v"),
                mb: fr.spacing("4v"),
              }}
            >
              {villesHighlight.map((v) => (
                <Link key={v.slug} href={PAGES.dynamic.seoVille(v.slug).getPath()} aria-label={`Alternance à ${v.ville}`} style={cardLinkStyle}>
                  <Box sx={listicleCardSx}>
                    <Typography sx={cardTitleSx}>{v.ville}</Typography>
                    <ArrowRightLine sx={cardArrowSx} />
                  </Box>
                </Link>
              ))}
            </Box>
            <Link href={PAGES.static.alternanceVilles.getPath()} className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right")}>
              Voir l'alternance dans toutes les grandes villes
            </Link>
          </Box>
        </Box>

        {/* FAQ */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle title="Questions fréquentes sur les diplômes en alternance" />
          <Box sx={{ mt: fr.spacing("4v") }}>
            {faqItems.map((item, index) => (
              <Accordion key={item.question} label={item.question} defaultExpanded={index === 0}>
                <Typography component="p">{item.answer}</Typography>
              </Accordion>
            ))}
          </Box>
        </Box>

        {/* RESSOURCES */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle
            title="Ressources pour réussir votre formation en alternance"
            description="Guides pratiques, outils et points d'entrée complémentaires pour bien démarrer votre parcours."
          />
          <Grid container spacing={fr.spacing("4v")} sx={{ mt: fr.spacing("2v"), "& .fr-card__end": { display: "none" } }}>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Guide complet de l'alternant"
                description="Toutes les clés pour choisir son diplôme, intégrer une formation en alternance et obtenir sa certification dans les meilleures conditions."
                imageUrl="/images/guides/guide-alternant/preparer-son-projet-en-alternance.svg"
                path={PAGES.static.guideAlternant.getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Calculer son salaire"
                description="Estimez votre rémunération nette mensuelle selon votre âge et votre année de formation, quel que soit le diplôme préparé."
                imageUrl="/images/guides/guide-alternant/simulateur.svg"
                path={PAGES.static.salaireAlternant.getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Rechercher une offre"
                description="Trouvez les offres et les formations en alternance pour le diplôme que vous souhaitez préparer."
                imageUrl="/images/guides/guide-alternant/conseils-et-astuces-pour-trouver-un-employeur.svg"
                path={PAGES.dynamic.recherche({}).getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Foire aux questions"
                description="Toutes les réponses sur les diplômes, les programmes, les durées de formation et les débouchés professionnels."
                imageUrl="/images/guides/faq.svg"
                path={PAGES.static.faq.getPath()}
              />
            </Grid>
          </Grid>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
