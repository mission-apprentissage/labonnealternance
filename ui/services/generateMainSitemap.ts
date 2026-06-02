import path from "path"

import type { SitemapUrlEntry } from "shared/utils/sitemapUtils"
import { generateSitemapFromUrlEntries } from "shared/utils/sitemapUtils"

import { diplomeData } from "@/app/(editorial)/alternance/_components/diplome_data"
import { metierData } from "@/app/(editorial)/alternance/_components/metier_data"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { getStaticMetiers } from "@/utils/getStaticData"
import { getHostFromHeader } from "@/utils/requestUtils"

// Attention ! Il faut mettre à jour cette date lorsque le sitemap généré par ce fichier change
export const mainSitemapLastModificationDate = new Date("2026-05-21T00:00:00.000Z")

// Une page référencée à la fois dans le sitemap et dans le llms.txt.
// `label` et `description` ne servent qu'au llms.txt (le sitemap n'utilise que le path).
export type SitemapPage = {
  path: string
  label: string
  description: string
}

// Un groupe de pages partageant la même priorité dans le sitemap et une même section dans le llms.txt.
// `optional: true` => la section est regroupée sous "## Optional" dans le llms.txt (cf. spec llmstxt.org).
export type SitemapPageGroup = {
  title: string
  priority: number
  optional?: boolean
  pages: SitemapPage[]
}

/**
 * Source de vérité unique des pages "fixes" du site (hors offres d'emploi, qui sont dynamiques
 * et servies par /sitemap-offers.xml). Cette liste alimente à la fois le sitemap principal et le
 * llms.txt : ajouter une page ici (ou une entrée dans villeData / metierData / diplomeData /
 * metiers.txt) la référence automatiquement dans les deux fichiers.
 *
 * Attention : l'ordre des groupes définit l'ordre des URLs du sitemap. Ne pas réordonner sans
 * mettre à jour mainSitemapLastModificationDate.
 */
export function getMainSitemapPageGroups(): SitemapPageGroup[] {
  const txtDirectory = path.join(process.cwd(), "config")
  const dataJobs = getStaticMetiers(txtDirectory)

  return [
    {
      title: "Le service La bonne alternance",
      priority: 0.9,
      pages: [
        { path: "/a-propos", label: "À propos", description: "Présentation de La bonne alternance, service public gratuit d'aide à l'alternance." },
        { path: "/contact", label: "Contact", description: "Contacter l'équipe de La bonne alternance." },
        { path: "/developpeurs", label: "Espace développeurs", description: "API publique et documentation technique pour réutiliser les données de La bonne alternance." },
        { path: "/faq", label: "Foire aux questions", description: "Réponses aux questions fréquentes des candidats, recruteurs et CFA." },
      ],
    },
    {
      title: "Guide de l'alternant",
      priority: 0.9,
      pages: [
        { path: "/guide-alternant", label: "Guide de l'alternant", description: "Tout savoir sur l'alternance quand on est candidat ou alternant." },
        {
          path: "/guide-alternant/preparer-son-projet-en-alternance",
          label: "Préparer son projet en alternance",
          description: "Définir son projet professionnel et sa formation en alternance.",
        },
        {
          path: "/guide-alternant/se-faire-accompagner",
          label: "Se faire accompagner",
          description: "Les acteurs et dispositifs pour être accompagné dans sa recherche d'alternance.",
        },
        { path: "/guide-alternant/la-rupture-de-contrat", label: "La rupture de contrat", description: "Comprendre les règles de rupture d'un contrat d'alternance." },
        {
          path: "/guide-alternant/comprendre-la-remuneration",
          label: "Comprendre la rémunération",
          description: "Comment est calculé le salaire d'un alternant selon l'âge et l'année de formation.",
        },
        {
          path: "/guide-alternant/comment-signer-un-contrat-en-alternance",
          label: "Signer un contrat en alternance",
          description: "Les étapes pour signer un contrat d'apprentissage ou de professionnalisation.",
        },
        {
          path: "/guide-alternant/role-et-missions-du-maitre-d-apprentissage-ou-tuteur",
          label: "Rôle du maître d'apprentissage ou tuteur",
          description: "Les missions du maître d'apprentissage et du tuteur auprès de l'alternant.",
        },
        { path: "/guide-alternant/a-propos-des-formations", label: "À propos des formations", description: "Comprendre les formations accessibles en alternance." },
        {
          path: "/guide-alternant/conseils-et-astuces-pour-trouver-un-employeur",
          label: "Conseils pour trouver un employeur",
          description: "Conseils et astuces pour décrocher un contrat en alternance.",
        },
        {
          path: "/guide-alternant/les-aides-financieres-et-materielles",
          label: "Les aides financières et matérielles",
          description: "Les aides financières et matérielles dont peut bénéficier un alternant.",
        },
      ],
    },
    {
      title: "Guide du recruteur",
      priority: 0.9,
      pages: [
        { path: "/guide-recruteur", label: "Guide du recruteur", description: "Tout savoir sur le recrutement d'un alternant pour une entreprise." },
        { path: "/guide-recruteur/je-suis-employeur-public", label: "Je suis employeur public", description: "Recruter un alternant dans la fonction publique." },
        {
          path: "/guide-recruteur/cerfa-apprentissage-et-professionnalisation",
          label: "Cerfa apprentissage et professionnalisation",
          description: "Les formulaires Cerfa pour les contrats d'apprentissage et de professionnalisation.",
        },
      ],
    },
    {
      title: "Guide du CFA",
      priority: 0.9,
      pages: [
        { path: "/guide-cfa", label: "Guide du CFA", description: "Informations destinées aux centres de formation d'apprentis (CFA)." },
        {
          path: "/guide-cfa/la-carte-etudiant-des-metiers",
          label: "La carte étudiant des métiers",
          description: "Tout savoir sur la carte d'étudiant des métiers pour les apprentis.",
        },
      ],
    },
    {
      title: "Comprendre l'alternance",
      priority: 0.9,
      pages: [
        { path: "/guide/decouvrir-l-alternance", label: "Découvrir l'alternance", description: "Comprendre ce qu'est l'alternance (apprentissage et professionnalisation)." },
        { path: "/guide/apprentissage-et-handicap", label: "Apprentissage et handicap", description: "L'alternance pour les personnes en situation de handicap." },
        {
          path: "/guide/prevention-des-risques-professionnels-pour-les-apprentis",
          label: "Prévention des risques professionnels",
          description: "La prévention des risques professionnels pour les apprentis.",
        },
      ],
    },
    {
      title: "Explorer les métiers",
      priority: 0.9,
      pages: [{ path: "/metiers", label: "Tous les métiers en alternance", description: "Liste des fiches métiers accessibles en alternance." }],
    },
    {
      // Pages légales : conservées ici pour que l'ordre du sitemap reste identique. Le llms.txt les
      // regroupe sous "## Optional" grâce au flag `optional`.
      title: "Optional",
      priority: 0.9,
      optional: true,
      pages: [
        { path: "/mentions-legales", label: "Mentions légales", description: "Mentions légales du site La bonne alternance." },
        { path: "/cgu", label: "Conditions générales d'utilisation", description: "Conditions générales d'utilisation du service." },
        { path: "/politique-de-confidentialite", label: "Politique de confidentialité", description: "Politique de confidentialité et traitement des données personnelles." },
      ],
    },
    {
      title: "L'alternance par ville",
      priority: 0.95,
      pages: villeData.map((ville) => ({
        path: `/alternance/ville/${ville.slug}`,
        label: `Alternance à ${ville.ville}`,
        description: `Offres d'emploi et formations en alternance à ${ville.ville}.`,
      })),
    },
    {
      title: "L'alternance par métier",
      priority: 0.95,
      pages: metierData.map((metier) => ({
        path: `/alternance/metier/${metier.slug}`,
        label: `${metier.metier} en alternance`,
        description: `${metier.metier} : offres d'emploi et formations en alternance pour ce métier.`,
      })),
    },
    {
      title: "L'alternance par diplôme",
      priority: 0.95,
      pages: diplomeData.map((diplome) => ({
        path: `/alternance/diplome/${diplome.slug}`,
        label: `${diplome.titre} en alternance`,
        description: `${diplome.titre} : formations et offres d'alternance pour préparer ce diplôme.`,
      })),
    },
    {
      title: "Fiches métiers",
      priority: 0.8,
      pages: dataJobs.map((job) => ({
        path: `/metiers/${job.slug}`,
        label: job.name,
        description: `Fiche métier ${job.name} : missions, formations et offres en alternance.`,
      })),
    },
  ]
}

export function generateMainSitemap(request: Request) {
  const host = getHostFromHeader(request)
  const groups = getMainSitemapPageGroups()

  const sitemapEntries: SitemapUrlEntry[] = [
    { loc: host, priority: 1 },
    ...groups.flatMap((group) => group.pages.map((page) => ({ loc: host + page.path, priority: group.priority }))),
  ]

  return generateSitemapFromUrlEntries(sitemapEntries)
}
