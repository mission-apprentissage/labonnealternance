import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Image from "next/image"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { SommaireAPropos } from "@/app/(editorial)/a-propos/_components/SommaireAPropos"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import affelnet from "@/public/images/logosPartenaires/partenaire-affelnet.webp"
import apec from "@/public/images/logosPartenaires/partenaire-apec.webp"
import apecita from "@/public/images/logosPartenaires/partenaire-apecita.webp"
import auchan from "@/public/images/logosPartenaires/partenaire-auchan.webp"
import bpce from "@/public/images/logosPartenaires/partenaire-bpce.webp"
import daher from "@/public/images/logosPartenaires/partenaire-daher.webp"
import decathlon from "@/public/images/logosPartenaires/partenaire-decathlon.webp"
import diagoriente from "@/public/images/logosPartenaires/partenaire-diagoriente.webp"
import edf from "@/public/images/logosPartenaires/partenaire-edf.webp"
import enedis from "@/public/images/logosPartenaires/partenaire-enedis.webp"
import engie from "@/public/images/logosPartenaires/partenaire-engie.webp"
import franceTravail from "@/public/images/logosPartenaires/partenaire-france-travail.webp"
import hellowork from "@/public/images/logosPartenaires/partenaire-hellowork.webp"
import institutPasteur from "@/public/images/logosPartenaires/partenaire-institut-pasteur.webp"
import laposte from "@/public/images/logosPartenaires/partenaire-laposte.webp"
import leboncoin from "@/public/images/logosPartenaires/partenaire-leboncoin.webp"
import linkedin from "@/public/images/logosPartenaires/partenaire-linkedin.webp"
import loreal from "@/public/images/logosPartenaires/partenaire-loreal.webp"
import meteojob from "@/public/images/logosPartenaires/partenaire-meteojob.webp"
import onisep from "@/public/images/logosPartenaires/partenaire-onisep.webp"
import opco2i from "@/public/images/logosPartenaires/partenaire-opco-2i.webp"
import afdas from "@/public/images/logosPartenaires/partenaire-opco-afdas.webp"
import akto from "@/public/images/logosPartenaires/partenaire-opco-akto.webp"
import atlas from "@/public/images/logosPartenaires/partenaire-opco-atlas.webp"
import commerce from "@/public/images/logosPartenaires/partenaire-opco-commerce.webp"
import constructys from "@/public/images/logosPartenaires/partenaire-opco-constructys.webp"
import ep from "@/public/images/logosPartenaires/partenaire-opco-ep.webp"
import ocapiat from "@/public/images/logosPartenaires/partenaire-opco-ocapiat.webp"
import sante from "@/public/images/logosPartenaires/partenaire-opco-sante.webp"
import uniformation from "@/public/images/logosPartenaires/partenaire-opco-uniformation.webp"
import parcoursup from "@/public/images/logosPartenaires/partenaire-parcoursup.webp"
import pass from "@/public/images/logosPartenaires/partenaire-pass.webp"
import rco from "@/public/images/logosPartenaires/partenaire-rco.svg"
import rhalternance from "@/public/images/logosPartenaires/partenaire-rh-alternance.webp"
import taleez from "@/public/images/logosPartenaires/partenaire-taleez.webp"
import talentplug from "@/public/images/logosPartenaires/partenaire-talentplug.webp"
import tbd from "@/public/images/logosPartenaires/partenaire-tdb.webp"
import toulouseMetropole from "@/public/images/logosPartenaires/partenaire-toulouse-metropole.webp"
import veritone from "@/public/images/logosPartenaires/partenaire-veritone.webp"

import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
export const metadata: Metadata = {
  title: METADATA.static.aPropos().title,
  description: METADATA.static.aPropos().description,
}

const SOMMAIRE = [
  { id: "pourquoi-un-service-public", label: "Pourquoi un service public" },
  { id: "nos-engagements", label: "Nos engagements" },
  { id: "mesurer-notre-impact", label: "Mesurer notre impact" },
  { id: "nos-partenaires", label: "Nos partenaires" },
  { id: "qui-sommes-nous", label: "Qui sommes-nous" },
]

const ACTEURS = [
  {
    icon: "fr-icon-user-line",
    title: "Les candidats",
    description:
      "Un accès aux formations en apprentissage du catalogue du Réseau des Carif-Oref, les offres d'emploi de notre site et de nos partenaires, et les entreprises qui pourraient recruter sans avoir publié d'offre.",
  },
  {
    icon: "fr-icon-briefcase-line",
    title: "Les recruteurs",
    description: "Un dépôt d'offre simplifié et gratuit, pensé pour les TPE et PME qui n'ont pas de service RH.",
  },
  {
    icon: "fr-icon-building-line",
    title: "Les organismes de formation",
    description: "La visibilité de leurs formations et la diffusion des offres de leurs entreprises partenaires.",
  },
] as const

const sectionSx = { display: "flex", flexDirection: "column", gap: fr.spacing("4v") } as const

const engagementTitleSx = { mt: fr.spacing("4v"), mb: 0 } as const

export default function APropos() {
  return (
    <div>
      <Box>
        <Breadcrumb pages={[PAGES.static.aPropos]} />
        <DefaultContainer>
          <Box sx={{ p: fr.spacing("10v"), marginBottom: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
            <Grid container spacing={fr.spacing("2v")}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography component={"h1"} variant="h1" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
                  À propos
                </Typography>
                <Box
                  aria-hidden="true"
                  component="hr"
                  sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
                />
                <SommaireAPropos entries={SOMMAIRE} />
              </Grid>
              <Grid size={{ xs: 12, md: 9 }} sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("12v"), "& p": { mb: 0 } }}>
                <Box component="section" aria-labelledby="pourquoi-un-service-public" sx={sectionSx}>
                  <Typography id="pourquoi-un-service-public" component="h2" variant="h4" sx={{ mb: 0 }}>
                    Pourquoi un service public de l'alternance ?
                  </Typography>
                  <Typography>
                    La bonne alternance est un service public numérique édité par la Délégation générale à l'emploi et à la formation professionnelle (DGEFP), au sein du ministère
                    du Travail et des Solidarités.
                  </Typography>
                  <Typography>
                    L'écosystème de l'alternance est riche et les sites pour trouver un emploi sont nombreux. En tant que service public, La bonne alternance se concentre sur ce
                    que les plateformes privées ne font pas, ou peu : ouvrir le marché caché, vérifier les offres, être présente là où les candidats s'orientent, accompagner ceux
                    qui en ont le plus besoin et mesurer son impact réel.
                  </Typography>
                  <Typography>Nous facilitons les mises en relation entre les trois acteurs de l'alternance :</Typography>
                  <Box
                    component="ul"
                    sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: fr.spacing("4v") }}
                  >
                    {ACTEURS.map((acteur) => (
                      <Box
                        component="li"
                        key={acteur.title}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: fr.spacing("2v"),
                          p: fr.spacing("6v"),
                          backgroundColor: fr.colors.decisions.background.default.grey.default,
                          borderRadius: fr.spacing("2v"),
                        }}
                      >
                        <span className={fr.cx(acteur.icon)} aria-hidden="true" style={{ color: fr.colors.decisions.text.title.blueFrance.default }} />
                        <Typography component="h3" variant="h6" sx={{ mb: 0 }}>
                          {acteur.title}
                        </Typography>
                        <Typography>{acteur.description}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box component="section" aria-labelledby="nos-engagements" sx={sectionSx}>
                  <Typography id="nos-engagements" component="h2" variant="h4" sx={{ mb: 0 }}>
                    Nos engagements de service public
                  </Typography>

                  <Typography component="h3" variant="h6" sx={engagementTitleSx}>
                    Être sur le parcours des candidats
                  </Typography>
                  <Typography>
                    Un candidat qui choisit une formation en alternance doit trouver un employeur pour pouvoir aller au bout de sa formation. La bonne alternance lui montre donc
                    les opportunités d'emploi le plus tôt possible, directement sur les plateformes d'orientation publiques : Parcoursup, Affelnet, Mon Master et Onisep. Il peut
                    ainsi chercher son employeur dès qu'il formule ses vœux.
                  </Typography>
                  <Typography>
                    Entre janvier et octobre 2026, <strong>11 % de nos visiteurs</strong> sont arrivés depuis ces plateformes.
                  </Typography>

                  <Typography component="h3" variant="h6" sx={engagementTitleSx}>
                    Révéler le marché caché et le rendre accessible à tous
                  </Typography>
                  <Typography>Une grande partie des recrutements en alternance se fait sans offre publiée. Ce marché profite d'abord aux candidats qui ont un réseau.</Typography>
                  <Typography>
                    En tant que service public, La bonne alternance identifie les entreprises susceptibles de recruter en alternance, même si elles ne l'ont jamais fait, et les
                    candidats peuvent leur adresser des candidatures spontanées. Sur l'année 2026, près de <strong>600 000 entreprises</strong> ont été mises en avant et{" "}
                    <strong>plus de 1,5 million de candidatures spontanées</strong> ont été envoyées. 9 entreprises identifiées sur 10 sont des TPE ou des PME.
                  </Typography>
                  <Typography>
                    La bonne alternance s'appuie notamment sur son <DsfrLink href={PAGES.static.barometre.getPath()}>baromètre</DsfrLink>, qui montre où les candidatures se
                    concentrent et où elles manquent. Il guide le choix des entreprises et des secteurs vers lesquels nous allons en priorité, en particulier ceux qui peinent à
                    recruter.
                  </Typography>

                  <Typography component="h3" variant="h6" sx={engagementTitleSx}>
                    Centraliser les opportunités et en garantir la qualité
                  </Typography>
                  <Typography>
                    Les candidats regrettent de devoir chercher sur de nombreux sites, et d'y croiser parfois des annonces qui servent surtout à attirer des élèves dans des écoles.
                    La bonne alternance réunit en un seul endroit les offres d'emploi et les formations en alternance.
                  </Typography>
                  <Typography>
                    Chaque offre est contrôlée avant diffusion : une offre affichée sur La bonne alternance est une vraie offre d'alternance, active et vérifiée. Entre février 2025
                    et octobre 2026, <strong>1 offre partenaire sur 5</strong> n'a pas passé nos contrôles. Si une offre non conforme passe malgré tout ces contrôles, les candidats
                    peuvent la signaler. Les signalements sont vérifiés régulièrement.
                  </Typography>

                  <Typography component="h3" variant="h6" sx={engagementTitleSx}>
                    Accompagner ceux qui en ont le plus besoin
                  </Typography>
                  <Typography>
                    La bonne alternance est un service gratuit, disponible à tous les candidats et à toutes les entreprises. Une attention particulière est portée aux candidats et
                    aux entreprises les plus en difficulté, avec des actions ciblées expérimentées puis déployées régulièrement.
                  </Typography>
                  <Typography>
                    Pour mener à bien ces actions, La bonne alternance s'appuie sur les acteurs du service public de l'emploi, comme France Travail, Cap emploi et les Missions
                    locales. Par exemple, le service met en avant <strong>plusieurs milliers d'employeurs engagés handicap</strong> depuis septembre 2025. Par ailleurs, à chaque
                    rentrée, l'équipe contacte des milliers de candidats inscrits en CFA mais encore sans employeur pour leur suggérer des entreprises.
                  </Typography>
                </Box>

                <Box component="section" aria-labelledby="mesurer-notre-impact" sx={sectionSx}>
                  <Typography id="mesurer-notre-impact" component="h2" variant="h4" sx={{ mb: 0 }}>
                    Mesurer notre impact dans le réel
                  </Typography>
                  <Typography>
                    La bonne alternance pilote ses actions en s'intéressant à l'impact généré par la plateforme. L'objectif est de savoir combien de contrats d'alternance sont
                    signés grâce à La bonne alternance, et de cibler les actions pour améliorer ces chiffres clés.
                  </Typography>
                  <Box component="ol" sx={{ m: 0, pl: fr.spacing("6v"), display: "flex", flexDirection: "column", gap: fr.spacing("2v") }}>
                    <li>
                      <strong>Croisement avec les contrats déposés.</strong> Les mises en relation sont rapprochées des contrats d'apprentissage enregistrés (base DECA).
                    </li>
                    <li>
                      <strong>Enquêtes.</strong> Les candidats, les alternants et les entreprises sont interrogés régulièrement.
                    </li>
                    <li>
                      <strong>Créations nettes d'emploi.</strong> Les contrats signés dans des entreprises qui n'avaient pas publié d'offre, ou qui n'avaient jamais recruté
                      d'alternant, sont repérés.
                    </li>
                  </Box>
                  <Typography>
                    Retrouvez nos indicateurs d'usage sur la page <DsfrLink href={PAGES.static.statistiques.getPath()}>Statistiques</DsfrLink>.
                  </Typography>
                </Box>

                <Box component="section" aria-labelledby="nos-partenaires" sx={sectionSx}>
                  <Typography id="nos-partenaires" component="h2" variant="h4" sx={{ mb: 0 }}>
                    Nos partenaires
                  </Typography>

                  <Typography>La bonne alternance expose les offres d'emploi en alternance de nombreuses entreprises, dont :</Typography>

                  <Box
                    component="ul"
                    className="fr-raw-list"
                    sx={{
                      display: "grid",
                      gap: fr.spacing("4v"),
                      gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                        md: "repeat(4, 1fr)",
                      },
                    }}
                  >
                    <li>
                      <Image src={decathlon} alt="Decathlon" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={loreal} alt="L'Oréal" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={engie} alt="Engie" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={laposte} alt="Groupe La Poste" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={bpce} alt="Groupe BPCE" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={auchan} alt="Auchan" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={institutPasteur} alt="Institut Pasteur" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={daher} alt="Daher" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={edf} alt="EDF" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={enedis} alt="Enedis" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={toulouseMetropole} alt="Toulouse Métropole" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                  </Box>

                  <Typography>
                    En plus des offres collectées directement auprès des recruteurs, La bonne alternance réunit sur un seul site les emplois en alternance issus de nombreux
                    partenaires :
                  </Typography>

                  <Box
                    component="ul"
                    className="fr-raw-list"
                    sx={{
                      display: "grid",
                      gap: fr.spacing("4v"),
                      gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                        md: "repeat(4, 1fr)",
                      },
                    }}
                  >
                    <li>
                      <Image src={franceTravail} alt="France Travail" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={linkedin} alt="LinkedIn" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={pass} alt="PASS" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={ep} alt="OPCO EP" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={rhalternance} alt="RH Alternance" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={hellowork} alt="Hellowork" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={veritone} alt="Veritone" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={meteojob} alt="Météo Job" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={leboncoin} alt="Le Bon Coin" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={taleez} alt="Taleez" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={talentplug} alt="Talent Plug" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={apec} alt="Apec" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={apecita} alt="apecita, l'emploi agri, agro et environnement" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                  </Box>

                  <Typography>La bonne alternance collabore également avec les acteurs publics suivants :</Typography>

                  <Box
                    component="ul"
                    className="fr-raw-list"
                    sx={{
                      display: "grid",
                      gap: fr.spacing("4v"),
                      gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                        md: "repeat(4, 1fr)",
                      },
                    }}
                  >
                    <li>
                      <Image src={parcoursup} alt="Parcoursup - Entrez dans l'enseignement supérieur" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={onisep} alt="Onisep" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image
                        src={affelnet}
                        alt="Choisir son affectation - Demander une formation et un établissement après la 3ème"
                        style={{ display: "block", width: "100%", height: "auto" }}
                      />
                    </li>
                    <li>
                      <Image src={ocapiat} alt="OPCO Ocapiat" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={opco2i} alt="OPCO 2i" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={sante} alt="OPCO Santé" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={atlas} alt="OPCO Atlas" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={afdas} alt="OPCO Afdas - Demain sera formation" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={commerce} alt="L'opcommerce - opérateur de compétences" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={constructys} alt="OPCO Constructys - votre partenaire compétences" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={uniformation} alt="OPCO Uniformation" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={akto} alt="OPCO Akto - L'humain au coeur des services" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={diagoriente} alt="Diagoriente" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <li>
                      <Image src={tbd} alt="Tableau de bord de l'apprentissage" style={{ display: "block", width: "100%", height: "auto" }} />
                    </li>
                    <Box component="li" sx={{ width: "100%", height: "auto", backgroundColor: "#fff", border: "2px solid #dcdcdc" }}>
                      <Image src={rco} alt="Réseau des Carif-Oref" style={{ width: "100%", height: "auto" }} />
                    </Box>
                  </Box>
                </Box>

                <Box component="section" aria-labelledby="qui-sommes-nous" sx={sectionSx}>
                  <Typography id="qui-sommes-nous" component="h2" variant="h4" sx={{ mb: 0 }}>
                    Qui sommes-nous ?
                  </Typography>
                  <Typography>
                    D’abord développé par France Travail, La bonne alternance a été repris en 2020 par{" "}
                    <DsfrLink href="https://beta.gouv.fr/incubateurs/mission-apprentissage.html">la mission interministérielle pour l'apprentissage</DsfrLink>, membre de la
                    communauté <DsfrLink href="https://beta.gouv.fr">beta.gouv.fr</DsfrLink> et suit à ce titre une démarche spécifique de conception de services numériques. Depuis
                    2024, le service est édité par la Délégation générale à l’emploi et à la formation professionnelle (DGEFP).
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DefaultContainer>
      </Box>
    </div>
  )
}
