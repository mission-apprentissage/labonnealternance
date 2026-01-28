import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Image from "next/image"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import j1s from "@/public/images/logosPartenaires/partenaire-1j1s.webp"
import affelnet from "@/public/images/logosPartenaires/partenaire-affelnet.webp"
import catalogue from "@/public/images/logosPartenaires/partenaire-catalogue.webp"
import diagoriente from "@/public/images/logosPartenaires/partenaire-diagoriente.webp"
import franceTravail from "@/public/images/logosPartenaires/partenaire-france-travail.webp"
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
import portailAlternance from "@/public/images/logosPartenaires/partenaire-portail-alternance.webp"
import tbd from "@/public/images/logosPartenaires/partenaire-tdb.webp"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.aPropos.getMetadata().title,
  description: PAGES.static.aPropos.getMetadata().description,
}

export default function APropos() {
  return (
    <div>
      <Box>
        <Breadcrumb pages={[PAGES.static.aPropos]} />
        <DefaultContainer>
          <Box sx={{ p: fr.spacing("5w"), marginBottom: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
            <Grid container spacing={fr.spacing("1w")}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography id="editorial-content-container" component={"h1"} variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
                  A propos
                </Typography>
                <Box
                  component="hr"
                  sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <Typography
                  variant="h4"
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  Constat
                </Typography>
                <Typography
                  component={"p"}
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  L’alternance est une formule pleine de promesses pour les entreprises et les étudiants, car elle assure une formation proche des métiers et de la réalité du
                  marché du travail. Pourtant le triptyque formation-entreprise-candidat est souvent complexe à mettre en oeuvre pour que l’alternance soit un succès.
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  La solution
                </Typography>

                <Typography
                  component={"p"}
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  La bonne alternance a pour objectif de simplifier les mises en relation entre ces trois types d’acteurs afin de faciliter les entrées en alternance.
                </Typography>

                <Typography
                  component={"p"}
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Pour les recruteurs
                  </Typography>
                  , nous proposons un dépôt d’offre simplifié, permettant d’exprimer un besoin de recrutement en alternance en moins d'une minute. Recruter en alternance est
                  souvent un sujet compliqué pour les PME et TPE. Le manque de ressources et de connaissances en font un tâche peu prioritaire. D’ailleurs, 7 employeurs sur 10
                  recrutent sans déposer d’offre d’emploi.
                </Typography>

                <Typography
                  component={"p"}
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Nous aidons les candidats
                  </Typography>{" "}
                  intéressés par l'alternance à trouver une formation d’une part, et un contrat avec une entreprise d’autre part, en exposant et permettant aux candidat d'entrer en
                  contact avec :
                  <Box component="ul" sx={{ my: 4, pl: 2, listStyle: "disc", "& > li": { mb: 3 } }}>
                    <li>
                      Les formations en apprentissage issues du{" "}
                      <DsfrLink href="https://catalogue-apprentissage.intercariforef.org/" aria-label="Accéder au catalogue des formations intercarif oref - nouvelle fenêtre">
                        catalogue des formations en apprentissage du Réseau des Carif-Oref
                      </DsfrLink>
                      .
                    </li>
                    <li>
                      De nombreuses offres d’emploi en alternance : celles postées par les recruteurs directement sur notre plateforme, ainsi que sur les sites de nos partenaires
                      (via API ou Widget, cf.{" "}
                      <DsfrLink href="/espace-developpeurs" aria-label="Accès à l'espace développeurs">
                        Espace développeurs
                      </DsfrLink>
                      ).
                    </li>
                    <li>
                      Nous agrégeons également les offres en alternance de France travail et de ses{" "}
                      <DsfrLink
                        href="https://www.francetravail.fr/candidat/vos-services-en-ligne/des-partenaires-pour-vous-propos.html"
                        aria-label="Accéder à la liste des sites partenaires de France Travail - nouvelle fenêtre"
                      >
                        sites partenaires
                      </DsfrLink>
                      . Des entreprises identifiées comme à fort potentiel d'embauche en alternance sur la base de données publiques. Notre objectif est de faciliter les démarches
                      de candidatures spontanées des candidats, en pré ciblant les entreprises pertinentes.
                    </li>
                  </Box>
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Les organismes de formation
                  </Typography>{" "}
                  en alternance peuvent ainsi faire connaître leurs formations aux candidats, mais également diffuser les offres d’emploi de leurs entreprises partenaires. Par
                  ailleurs, nous proposons aux entreprises qui utilisent notre plateforme de partager leurs offres aux organismes de formation, afin que ces derniers puissent les
                  diffuser auprès de leurs étudiants.
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  Impact observé
                </Typography>

                <Typography
                  component={"p"}
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  Vous pouvez consulter nos{" "}
                  <DsfrLink href="/statistiques" aria-label="Accès aux statistiques">
                    statistiques
                  </DsfrLink>
                </Typography>

                <Typography
                  component={"p"}
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  La bonne alternance, en collaboration avec ses partenaires, est au carrefour des mondes de la formation et de l’emploi, et ambitionne ainsi d’aider les candidats
                  à l'alternance à réaliser leur vocation.
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  Nos partenaires
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    mb: 4,
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(3, 1fr)",
                      md: "repeat(4, 1fr)",
                    },
                  }}
                >
                  <Image src={franceTravail} alt="France Travail" style={{ width: "100%", height: "auto" }} />
                  <Image src={parcoursup} alt="Parcoursup - Entrez dans l'enseignement supérieur" style={{ width: "100%", height: "auto" }} />
                  <Image src={onisep} alt="Onisep" style={{ width: "100%", height: "auto" }} />
                  <Image src={portailAlternance} alt="Portail de l'Alternance - Apprentissage et contrat de professionnalisation" style={{ width: "100%", height: "auto" }} />
                  <Image src={j1s} alt="#1jeune1solution" style={{ width: "100%", height: "auto" }} />
                  <Image src={affelnet} alt="Choisir son affectation - Demander une formation et un établissement après la 3ème" style={{ width: "100%", height: "auto" }} />
                  <Image src={ocapiat} alt="OPCO Ocapiat" style={{ width: "100%", height: "auto" }} />
                  <Image src={opco2i} alt="OPCO 2i" style={{ width: "100%", height: "auto" }} />
                  <Image src={sante} alt="OPCO Santé" style={{ width: "100%", height: "auto" }} />
                  <Image src={atlas} alt="OPCO Atlas" style={{ width: "100%", height: "auto" }} />
                  <Image src={afdas} alt="OPCO Afdas - Demain sera formation" style={{ width: "100%", height: "auto" }} />
                  <Image src={ep} alt="OPCO EP" style={{ width: "100%", height: "auto" }} />
                  <Image src={commerce} alt="L'opcommerce - opérateur de compétences" style={{ width: "100%", height: "auto" }} />
                  <Image src={constructys} alt="OPCO Constructys - votre partenaire compétences" style={{ width: "100%", height: "auto" }} />
                  <Image src={uniformation} alt="OPCO Uniformation" style={{ width: "100%", height: "auto" }} />
                  <Image src={akto} alt="OPCO Akto - L'humain au coeur des services" style={{ width: "100%", height: "auto" }} />
                  <Image src={diagoriente} alt="Diagoriente" style={{ width: "100%", height: "auto" }} />
                  <Image src={tbd} alt="Tableau de bord de l'apprentissage" style={{ width: "100%", height: "auto" }} />
                  <Image src={catalogue} alt="Le catalogue des Carif Oref" style={{ width: "100%", height: "auto" }} />
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  Qui sommes nous
                </Typography>

                <Typography
                  component={"p"}
                  sx={{
                    mb: fr.spacing("2w"),
                  }}
                >
                  D’abord développé par France travail, La bonne alternance a été repris en 2020 par{" "}
                  <DsfrLink
                    href="https://beta.gouv.fr/incubateurs/mission-apprentissage.html"
                    aria-label="Accéder au site de la mission interministérielle pour l'apprentissage - nouvelle fenêtre"
                  >
                    la mission interministérielle pour l'apprentissage
                  </DsfrLink>
                  , membre de la communauté{" "}
                  <DsfrLink href="https://beta.gouv.fr" aria-label="Accéder au site de beta gouv point fr - nouvelle fenêtre">
                    beta.gouv.fr
                  </DsfrLink>{" "}
                  et suit à ce titre une démarche spécifique de conception de services numériques. Depuis 2025, le service est édité par la Délégation générale à l’emploi et à la
                  formation professionnelle (DGEFP).
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DefaultContainer>
      </Box>
    </div>
  )
}
