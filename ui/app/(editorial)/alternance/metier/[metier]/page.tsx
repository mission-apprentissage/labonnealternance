import { fr } from "@codegouvfr/react-dsfr"
// import Button from "@codegouvfr/react-dsfr/Button"
import { Box, /*Link,*/ Typography } from "@mui/material"
import Image from "next/image"
import { redirect } from "next/navigation"

// import { appartements, loisirs, transports } from "@/app/(editorial)/alternance/_components/ville_data"
import Button from "@codegouvfr/react-dsfr/Button"
import { HomeCircleImageDecoration } from "@/app/(home)/_components/HomeCircleImageDecoration"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ArrowRightLine } from "@/theme/components/icons"
// import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
// import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
// import { apiGet } from "@/utils/api.utils"

export async function generateMetadata({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params
  console.log("METIER", metier)
  //const data = await apiGet("/_private/seo/metier/:metier", { params: { metier } })

  const data = {
    metier: "Chargé de recrutement",
    slug: "charge-de-recrutement",
    romes: ["M1502"],

    description:
      "Le chargé de recrutement identifie et sélectionne les meilleurs candidats pour répondre aux besoins en personnel des entreprises. Il gère l'ensemble du processus de recrutement, de la rédaction d'annonces aux entretiens d'embauche. En alternance, il développe des compétences en ressources humaines tout en participant activement aux recrutements de l'entreprise.",

    job_count: 30,
    company_count: 25,
    applicant_count: 200,
    salaire: {
      salaire_brut_moyen: 1200,
      salaire_1ere_annee: 1000,
      salaire_2eme_annee: 1300,
      salaire_median: 24000,
    },
    entreprises: [
      { nom: "Entreprise A", job_count: 5 },
      { nom: "Entreprise B", job_count: 3 },
      { nom: "Entreprise C", job_count: 2 },
      { nom: "Entreprise D", job_count: 4 },
      { nom: "Entreprise E", job_count: 1 },
      { nom: "Entreprise F", job_count: 6 },
    ],
    formations: [
      {
        title: "Formation A",
        description: "Description de la formation A pour le métier de chargé de recrutement en alternance.",
        count: 50,
        competences: ["Compétence 1", "Compétence 2", "Compétence 3"],
      },
      {
        title: "Formation B",
        description: "Description de la formation B pour le métier de chargé de recrutement en alternance.",
        count: 30,
        competences: ["Compétence 4", "Compétence 5", "Compétence 6"],
      },
      {
        title: "Formation C",
        description: "Description de la formation C pour le métier de chargé de recrutement en alternance.",
        count: 20,
        competences: ["Compétence 7", "Compétence 8", "Compétence 9"],
      },
    ],
    villes: [
      {
        nom: "Paris",
        job_count: 10,
        geopoint: { lat: 48.8566, long: 2.3522 },
      },
      {
        nom: "Lyon",
        job_count: 8,
        geopoint: { lat: 45.764, long: 4.8357 },
      },
      { nom: "Marseille", job_count: 5, geopoint: { lat: 43.2965, long: 5.3698 } },
    ],
    cards: [],
    missions: [
      {
        title: "Rédaction et diffusion d'annonces",
        description: "Création d'offres d'emploi attractives et publication sur différents canaux",
      },
      {
        title: "Sourcing de candidats",
        description: "Recherche active de profils qualifiés sur les jobboards et réseaux sociaux",
      },
      {
        title: "Présélection de candidatures",
        description: "Analyse des CV et lettres de motivation selon les critères définis",
      },
      {
        title: "Conduite d'entretiens",
        description: "Organisation et réalisation d'entretiens de recrutement en présentiel ou visio",
      },
      {
        title: "Gestion de la relation candidat",
        description: "Accompagnement des candidats tout au long du processus de recrutement",
      },
      {
        title: "Reporting et suivi",
        description: "Mise à jour des tableaux de bord et indicateurs de recrutement",
      },
    ],
    competences: [
      {
        title: "Techniques d'entretien",
        description: "Maîtrise des méthodes d'évaluation et de questionnement des candidats",
      },
      {
        title: "Communication interpersonnelle",
        description: "Capacité à échanger efficacement avec candidats et managers",
      },
      {
        title: "Outils de recrutement",
        description: "Utilisation d'ATS, jobboards et réseaux sociaux professionnels comme LinkedIn",
      },
      {
        title: "Analyse de profils",
        description: "Évaluation des compétences et adéquation candidat-poste",
      },
      {
        title: "Organisation et rigueur",
        description: "Gestion simultanée de plusieurs processus de recrutement",
      },
      {
        title: "Droit du travail",
        description: "Connaissance des réglementations en matière de recrutement et d'embauche",
      },
    ],
  }

  if (!data) {
    return {
      title: "Métiers en alternance | La bonne alternance",
      description: "Trouvez votre contrat d'apprentissage",
    }
  }

  return {
    title: `Alternance en ${data.metier} : ${0} Offres | Salaires & Formations ${new Date().getFullYear()} | La bonne alternance`,
    description: `${0} offres d'alternance en ${data.metier}. .`,
  }
}

const boxCss = {
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  minWidth: { xs: "146px", md: "160px", lg: "210px" },
  maxWidth: { xs: "75%", md: "70%", lg: "45%" },
  minHeight: { xs: "146px", md: "210px" },
  padding: fr.spacing("7v"),
  backgroundColor: "white",
  borderRadius: "5px",
  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
  justifySelf: "center",
}
export default async function Metier({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params
  console.log("METIER", metier)
  //const data = await apiGet("/_private/seo/metier/:metier", { params: { metier } })

  const data = {
    metier: "Chargé de recrutement",
    slug: "charge-de-recrutement",
    romes: ["M1502"],

    description:
      "Le chargé de recrutement identifie et sélectionne les meilleurs candidats pour répondre aux besoins en personnel des entreprises. Il gère l'ensemble du processus de recrutement, de la rédaction d'annonces aux entretiens d'embauche. En alternance, il développe des compétences en ressources humaines tout en participant activement aux recrutements de l'entreprise.",

    job_count: 30,
    company_count: 25,
    applicant_count: 200,
    salaire: {
      salaire_brut_moyen: 1200,
      salaire_1ere_annee: 1000,
      salaire_2eme_annee: 1300,
      salaire_median: 24000,
    },
    entreprises: [
      { nom: "Entreprise A", job_count: 5 },
      { nom: "Entreprise B", job_count: 3 },
      { nom: "Entreprise C", job_count: 2 },
      { nom: "Entreprise D", job_count: 4 },
      { nom: "Entreprise E", job_count: 1 },
      { nom: "Entreprise F", job_count: 6 },
    ],
    formations: [
      {
        title: "Formation A",
        description: "Description de la formation A pour le métier de chargé de recrutement en alternance.",
        count: 50,
        competences: ["Compétence 1", "Compétence 2", "Compétence 3"],
      },
      {
        title: "Formation B",
        description: "Description de la formation B pour le métier de chargé de recrutement en alternance.",
        count: 30,
        competences: ["Compétence 4", "Compétence 5", "Compétence 6"],
      },
      {
        title: "Formation C",
        description: "Description de la formation C pour le métier de chargé de recrutement en alternance.",
        count: 20,
        competences: ["Compétence 7", "Compétence 8", "Compétence 9"],
      },
    ],
    villes: [
      {
        nom: "Paris",
        job_count: 10,
        geopoint: { lat: 48.8566, long: 2.3522 },
      },
      {
        nom: "Lyon",
        job_count: 8,
        geopoint: { lat: 45.764, long: 4.8357 },
      },
      { nom: "Marseille", job_count: 5, geopoint: { lat: 43.2965, long: 5.3698 } },
    ],
    cards: [],
    missions: [
      {
        title: "Rédaction et diffusion d'annonces",
        description: "Création d'offres d'emploi attractives et publication sur différents canaux",
      },
      {
        title: "Sourcing de candidats",
        description: "Recherche active de profils qualifiés sur les jobboards et réseaux sociaux",
      },
      {
        title: "Présélection de candidatures",
        description: "Analyse des CV et lettres de motivation selon les critères définis",
      },
      {
        title: "Conduite d'entretiens",
        description: "Organisation et réalisation d'entretiens de recrutement en présentiel ou visio",
      },
      {
        title: "Gestion de la relation candidat",
        description: "Accompagnement des candidats tout au long du processus de recrutement",
      },
      {
        title: "Reporting et suivi",
        description: "Mise à jour des tableaux de bord et indicateurs de recrutement",
      },
    ],
    competences: [
      {
        title: "Techniques d'entretien",
        description: "Maîtrise des méthodes d'évaluation et de questionnement des candidats",
      },
      {
        title: "Communication interpersonnelle",
        description: "Capacité à échanger efficacement avec candidats et managers",
      },
      {
        title: "Outils de recrutement",
        description: "Utilisation d'ATS, jobboards et réseaux sociaux professionnels comme LinkedIn",
      },
      {
        title: "Analyse de profils",
        description: "Évaluation des compétences et adéquation candidat-poste",
      },
      {
        title: "Organisation et rigueur",
        description: "Gestion simultanée de plusieurs processus de recrutement",
      },
      {
        title: "Droit du travail",
        description: "Connaissance des réglementations en matière de recrutement et d'embauche",
      },
    ],
  }

  const utmParams = "utm_source=lba&utm_medium=website&utm_campaign=lba_seo-prog-metiers"
  console.log(utmParams)

  if (!data) {
    redirect("/404")
  }

  return (
    <Box>
      <DefaultContainer sx={{ px: 0 }}>
        <Box
          sx={{
            position: "relative",
            px: { xs: fr.spacing("2w"), md: fr.spacing("4w") },
            py: fr.spacing("4w"),
            marginTop: { xs: 0, sm: fr.spacing("4w") },
            marginBottom: fr.spacing("4w"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Box
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            <HomeCircleImageDecoration size="small" />
          </Box>
          <Box
            sx={{
              position: "relative",
            }}
          >
            <Box>
              <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
                Alternance{" "}
                <Typography component="span" variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }}>
                  {data.metier}
                </Typography>
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                gap: { xs: fr.spacing("2v"), md: fr.spacing("3v"), lg: fr.spacing("5v") },
                alignItems: "stretch",
              }}
            >
              <Box sx={boxCss}>
                <Image alt="" src={`/images/seo/metier/malette.svg`} width={80} height={80} />
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "32px", md: "40px" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                  {data.job_count}
                </Typography>
                <Typography sx={{ mt: fr.spacing("2v"), fontSize: { sx: "18px", md: "20px" }, fontWeight: "bold", lineHeight: { sx: "20px", md: "24px" }, color: "#161616" }}>
                  Offres disponibles
                </Typography>
              </Box>
              <Box sx={boxCss}>
                <Image alt="" src={`/images/seo/metier/ecosystem.svg`} width={80} height={80} />
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "32px", md: "40px" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                  {data.applicant_count}
                </Typography>
                <Typography sx={{ mt: fr.spacing("2v"), fontSize: { sx: "18px", md: "20px" }, fontWeight: "bold", lineHeight: { sx: "20px", md: "24px" }, color: "#161616" }}>
                  candidats sur les 3 derniers mois
                </Typography>
              </Box>
              <Box sx={boxCss}>
                <Image alt="" src={`/images/seo/metier/usine.svg`} width={80} height={80} />
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "32px", md: "40px" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                  {data.company_count}
                </Typography>
                <Typography sx={{ mt: fr.spacing("2v"), fontSize: { sx: "18px", md: "20px" }, fontWeight: "bold", lineHeight: { sx: "20px", md: "24px" }, color: "#161616" }}>
                  entreprises recrutent activement
                </Typography>
              </Box>
              <Box sx={boxCss}>
                <Image alt="" src={`/images/seo/metier/monnaie.svg`} width={80} height={80} />
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "32px", md: "40px" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                  {data.salaire.salaire_brut_moyen}€
                </Typography>
                <Typography sx={{ mt: fr.spacing("2v"), fontSize: { sx: "18px", md: "20px" }, fontWeight: "bold", lineHeight: { sx: "20px", md: "24px" }, color: "#161616" }}>
                  Salaire brut mensuel moyen*
                </Typography>
              </Box>
              <Box sx={{ maxWidth: { xs: "75%", md: "70%", lg: "45%" }, gridColumn: { xs: "span 2", md: "span 4" }, justifySelf: "right" }}>
                <Typography sx={{ fontSize: "12px", color: "#666" }}>*calcul basé sur les contrats enregistrés pour l'année 2024/2025</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Button size="large" priority="primary" style={{ marginTop: fr.spacing("2v") }}>
            <DsfrLink style={{ color: "#fff" }} href={`/recherche?romes=${data.romes.join()}&radius=30&displayFormations=false`}>
              Voir toutes les offres en alternance
              <ArrowRightLine sx={{ color: "#fff", mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
            </DsfrLink>
          </Button>
        </Box>

        {/**
         * BLOC DESCRIPTION METIER
         */}
        <Box sx={{ my: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
          <Box sx={{ mb: fr.spacing("6v") }}>
            <Typography component={"h2"} variant="h2" sx={{ mb: 2, color: "#161616" }}>
              Le métier de <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.metier.toLocaleLowerCase()},</span> en alternance
            </Typography>
            <Box
              component="hr"
              sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
            />
            <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.description }} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Image src="/images/seo/metier/mission.svg" alt="" aria-hidden="true" width={60} height={60} />
            <Typography sx={{ ml: fr.spacing("4v"), fontSize: "20px", fontWeight: "bold" }}>Missions principales :</Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
              gap: fr.spacing("4v"),
              alignItems: "stretch",
              mt: fr.spacing("4v"),
            }}
          >
            {(data.missions as { title: string; description: string }[]).map((mission) => (
              <Box
                key={mission.title}
                sx={{
                  backgroundColor: "white",
                  padding: fr.spacing("7v"),
                  borderRadius: "5px",
                  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                }}
              >
                <Typography sx={{ fontSize: "20px", fontWeight: "bold", color: "#000091" }}>{mission.title} :</Typography>
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: "20px" }}>{mission.description}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mt: fr.spacing("10v"), mb: fr.spacing("4v") }}>
            <Image src="/images/seo/metier/competence.svg" alt="" aria-hidden="true" width={60} height={60} />
            <Typography sx={{ ml: fr.spacing("4v"), fontSize: "20px", fontWeight: "bold" }}>Compétences développées :</Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
              gap: fr.spacing("4v"),
              alignItems: "stretch",
              mt: fr.spacing("4v"),
            }}
          >
            {(data.competences as { title: string; description: string }[]).map((competence) => (
              <Box
                key={competence.title}
                sx={{
                  backgroundColor: "white",
                  padding: fr.spacing("7v"),
                  borderRadius: "5px",
                  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                }}
              >
                <Typography sx={{ fontSize: "20px", fontWeight: "bold", color: "#000091" }}>{competence.title} :</Typography>
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: "20px" }}>{competence.description}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/**
         * BLOC VIE D'ALTERNANT
         */}
        {/* <Box
          sx={{
            mb: fr.spacing("4w"),
            py: fr.spacing("4w"),
            px: { xs: fr.spacing("2w"), md: fr.spacing("4w") },
            backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
          }}
        >
          <Typography component={"h2"} variant="h2" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
            La vie d'alternant <span style={{ color: "#161616" }}>à {data.ville}</span>
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          <Typography component={"h5"} sx={{ fontSize: "22px", fontWeight: "bold" }}>
            Le bassin socio économique
          </Typography>
          <Box sx={{ mt: fr.spacing("4w"), display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4w") }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.vie.text }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography component={"h5"} sx={{ fontSize: "22px", fontWeight: "bold", mb: fr.spacing("2w") }}>
                Activités porteuses :
              </Typography>
              {(data.content.vie.activites as { naf_label?: string; rome_codes?: string[] }[]).map((activite) => (
                <Link
                  key={activite.naf_label}
                  underline="none"
                  href={`/recherche-emploi?romes=${activite.rome_codes.join(",")}&job_name=${activite.naf_label}&radius=30&lat=${data.geopoint.lat}&lon=${data.geopoint.long}&address=${data.ville} (${data.cp})&${utmParams}`}
                  sx={{
                    display: "flex",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      width: "100%",
                      mb: fr.spacing("1w"),
                      backgroundColor: "white",
                      padding: fr.spacing("2w"),
                      borderRadius: "5px",
                      boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                      ":hover": {
                        backgroundColor: "#E8EDFF",
                      },
                    }}
                  >
                    {activite.naf_label}
                    <ArrowRightLine sx={{ ml: "auto", width: 16, height: 16 }} />
                  </Box>
                </Link>
              ))}
              <Box sx={{ mt: fr.spacing("2w"), textAlign: "right" }}>
                <Link sx={{ textDecoration: "underline" }} href={`/?${utmParams}`}>
                  Voir toutes les opportunités à {data.ville}
                  <ArrowRightLine sx={{ ml: fr.spacing("2w"), width: 12, height: 12 }} />
                </Link>
              </Box>
            </Box>
          </Box>
        </Box> */}

        {/**
         * BLOC STATISTIQUES
         */}
        {/* <Box sx={{ mb: fr.spacing("4w"), px: { xs: fr.spacing("2w"), md: fr.spacing("4w") } }}>
          <Typography component={"h2"} variant="h2" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
            Opportunités d'emploi
            <br />
            en alternance <span style={{ color: "#161616" }}>à {data.ville}</span>
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("2w") }}>
            <Box sx={{ flex: 1, boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)", padding: fr.spacing("2w") }}>
              <TagOffreEmploi />
              <Box sx={{ display: "flex" }}>
                <Box sx={{ flex: 2 }}>
                  <Typography sx={{ fontWeight: "bold", lineHeight: "2.5rem", fontSize: "2rem", color: fr.colors.decisions.text.default.info.default, mt: fr.spacing("2w") }}>
                    {data.job_count}
                  </Typography>
                  <Typography sx={{ fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                    offres d'emploi{" "}
                    <Typography component="span" sx={{ fontWeight: "bold", color: "#161616" }}>
                      auprès desquelles postuler
                    </Typography>
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: "right", pt: fr.spacing("2w") }}>
                  <Image src="/images/seo/offre-emploi.svg" alt="" width={80} height={80} />
                </Box>
              </Box>
            </Box>

            <Box sx={{ flex: 1, boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)", padding: fr.spacing("2w") }}>
              <TagCandidatureSpontanee />
              <Box sx={{ display: "flex" }}>
                <Box sx={{ flex: 2 }}>
                  <Typography sx={{ fontWeight: "bold", lineHeight: "2.5rem", fontSize: "2rem", color: "#716043", mt: fr.spacing("2w") }}>{data.recruteur_count}</Typography>
                  <Typography sx={{ fontWeight: "bold", color: "#716043" }}>
                    entreprises{" "}
                    <Typography component="span" sx={{ fontWeight: "bold", color: "#161616" }}>
                      auprès desquelles adresser des candidatures spontanées
                    </Typography>{" "}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: "right", pt: fr.spacing("2w") }}>
                  <Image src="/images/seo/candidature-spontanee.svg" alt="" width={80} height={80} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box> */}

        {/**
         * BLOC MOBILITE
         */}
        {/* <Box
          sx={{
            mb: fr.spacing("4w"),
            py: fr.spacing("4w"),
            px: { xs: fr.spacing("2w"), md: fr.spacing("4w") },
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Typography component={"h2"} variant="h2" sx={{ mb: 2 }}>
            La mobilité et le logement
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          <Box sx={{ mt: fr.spacing("1w"), display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: fr.spacing("1w"), md: fr.spacing("4w") } }}>
            <Box sx={{ flex: 1 }}></Box>
            <Box sx={{ flex: 1 }}>
              <Typography component={"h5"} sx={{ fontSize: "22px", fontWeight: "bold", mb: { xs: fr.spacing("3v"), md: 0 } }}>
                La mobilité
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: fr.spacing("1w"), display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: fr.spacing("1w"), md: fr.spacing("4w") } }}>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                  gap: fr.spacing("2w"),
                }}
              >
                {(data.content.mobilite.transports as { type?: string; label?: string }[]).map((transport) => (
                  <Box
                    key={transport.type}
                    sx={{
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "146px",
                      height: "146px",
                      padding: fr.spacing("3v"),
                      backgroundColor: "white",
                      borderRadius: "5px",
                      boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                    }}
                  >
                    <Image alt="" src={`/images/seo/transports/${transports[transport.type as string]}`} width="50" height={50} />
                    <Typography sx={{ mt: fr.spacing("1v"), fontWeight: "bold", color: "#161616" }}>{transport.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ whiteSpace: "pre-wrap", mt: { xs: fr.spacing("5v"), md: 0 } }} dangerouslySetInnerHTML={{ __html: data.content.mobilite.text }} />
            </Box>
          </Box> */}

        {/**
         * BLOC LOGEMENT
         */}
        {/* <Box sx={{ mt: fr.spacing("3v"), display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: fr.spacing("1w"), md: fr.spacing("4w") } }}>
            <Box sx={{ flex: 1 }}>
              <Typography component={"h5"} sx={{ fontSize: "22px", fontWeight: "bold", my: { xs: fr.spacing("3v"), md: 0 } }}>
                Le logement
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}></Box>
          </Box>

          <Box sx={{ mt: fr.spacing("1w"), display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: fr.spacing("1w"), md: fr.spacing("4w") } }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.logement.text }} />
            </Box>

            <Box sx={{ flex: 1, alignItems: "center", justifyContent: "center", alignContent: "center" }}>
              <Box
                sx={{
                  display: "grid",
                  alignItems: "center",
                  justifyContent: "center",
                  alignContent: "center",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: fr.spacing("2w"),
                }}
              >
                {(data.content.logement.loyers as { type?: string; price_range?: string }[]).map((appartement) => (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "center",
                      width: "100%",
                      maxWidth: "250px",
                      p: fr.spacing("3w"),
                      backgroundColor: "white",
                      borderRadius: "5px",
                      boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                    }}
                    key={appartement.type}
                  >
                    <Image alt="" style={{ margin: "auto" }} src={`/images/seo/logement/${appartements[appartement.type]}`} width="90" height="90" />
                    <Typography sx={{ fontWeight: "bold", fontSize: "20px", mt: fr.spacing("1w") }}>{appartement.type} à louer</Typography>
                    <Typography
                      sx={{
                        lineHeight: "2.5rem",
                        fontWeight: "bold",
                        fontSize: "2rem",
                        mt: fr.spacing("3v"),
                        color: fr.colors.decisions.text.default.info.default,
                      }}
                    >
                      {appartement.price_range}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box> */}

        {/**
         * BLOC LOISIRS
         */}
        {/* <Box sx={{ mb: fr.spacing("4w"), px: { xs: fr.spacing("2w"), md: fr.spacing("4w") } }}>
          <Typography component={"h2"} variant="h2" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
            Les loisirs <span style={{ color: "#161616" }}>à {data.ville}</span>
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          <Box sx={{ mt: fr.spacing("1w"), display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4w") }}>
            <Box
              sx={{
                flex: 1,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                  gap: fr.spacing("2w"),
                }}
              >
                {(data.content.loisirs.types as { type?: string; label?: string }[]).map((loisir) => (
                  <Box
                    key={loisir.type}
                    sx={{
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "146px",
                      height: "146px",
                      padding: fr.spacing("3v"),
                      backgroundColor: "white",
                      borderRadius: "5px",
                      boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                    }}
                  >
                    <Image alt="" src={`/images/seo/loisirs/${loisirs[loisir.type]}`} width="50" height={50} />
                    <Typography sx={{ mt: fr.spacing("1v"), fontWeight: "bold", color: "#161616" }}>{loisir.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.loisirs.text }} />
            </Box> 
          </Box>
        </Box>*/}
      </DefaultContainer>
    </Box>
  )
}
