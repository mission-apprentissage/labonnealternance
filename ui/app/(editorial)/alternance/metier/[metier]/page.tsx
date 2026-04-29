import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, List, ListItem, Typography } from "@mui/material"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import CarteOffre from "@/app/(editorial)/alternance/_components/CarteOffre"
import { JobsCtaTracked } from "@/app/(editorial)/alternance/_components/JobsCtaTracked"
import { HomeCircleImageDecoration } from "@/app/(home)/_components/HomeCircleImageDecoration"
import { ArrowRightLine } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const UTM_PARAMS = "utm_source=lba&utm_medium=website&utm_campaign=lba_seo-prog-metiers"

// Shared style constants
const boxCss = {
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: fr.spacing("3v"),
  backgroundColor: "white",
  borderRadius: "5px",
  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
  justifySelf: "center",
}

const cardSx = {
  backgroundColor: "white",
  padding: fr.spacing("7v"),
  borderRadius: "5px",
  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
}

const hrSx = {
  maxWidth: "93px",
  border: "none",
  borderBottom: "none",
  borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`,
  opacity: 1,
}

const threeColGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
  gap: fr.spacing("4v"),
  alignItems: "stretch",
  mt: fr.spacing("4v"),
}

async function fetchMetierData(metier: string) {
  return apiGet("/_private/seo/metier/:metier", { params: { metier } })
}

function JobsCta({ href, metier }: { href: string; metier: string }) {
  return (
    <Box sx={{ textAlign: "center", mx: fr.spacing("4v") }}>
      <JobsCtaTracked href={href} searchOrigin="page_metier" searchJobName={metier} style={{ marginTop: fr.spacing("2v") }}>
        Voir toutes les offres en alternance
        <ArrowRightLine sx={{ color: "#fff", mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
      </JobsCtaTracked>
    </Box>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params
  const data = await fetchMetierData(metier)

  if (!data) {
    return {
      title: "Métiers en alternance | La bonne alternance",
      description: "Trouvez votre contrat d'apprentissage",
    }
  }

  const jobCount = data.job_count ?? 0
  const listeEntreprises = (data.entreprises as { nom: string }[])
    .slice(0, 3)
    .map((e) => e.nom)
    .join(", ")

  const firstFormation = (data.formations as { title: string }[]).pop() ?? { title: "" }
  const lastFormation = (data.formations as { title: string }[]).shift() ?? { title: "" }

  return {
    title: `Alternance en ${data.metier} : ${jobCount} Offres, ${data.salaire.salaire_brut_moyen}€/mois | La bonne alternance`,
    description: `Trouvez votre alternance ${data.metier} parmi ${jobCount} offres. Salaire moyen ${data.salaire.salaire_brut_moyen}€ brut/mois. ${listeEntreprises} recrutent. Formations de ${lastFormation.title} à ${firstFormation.title}.`,
  }
}

export default async function Metier({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params
  const data = await fetchMetierData(metier)

  if (!data) {
    redirect("/404")
  }

  const romesParam = data.romes.join()
  const jobsSearchUrl = `/recherche?romes=${romesParam}&radius=30&displayFormations=false&job_name=${encodeURIComponent(data.metier)}&${UTM_PARAMS}`
  const formationsSearchUrl = `/recherche?romes=${romesParam}&radius=30&displayEntreprises=false&job_name=${encodeURIComponent(data.metier)}&${UTM_PARAMS}`

  const statItems = [
    { icon: "/images/seo/metier/malette.svg", value: data.job_count, label: "Offres d'emploi en alternance disponibles" },
    { icon: "/images/seo/metier/ecosystem.svg", value: data.applicant_count, label: "candidats sur les 3 derniers mois" },
    { icon: "/images/seo/metier/usine.svg", value: data.company_count, label: "entreprises recrutent activement" },
    { icon: "/images/seo/metier/monnaie.svg", value: `${data.salaire.salaire_brut_moyen}€`, label: "Salaire brut mensuel moyen*" },
  ]

  return (
    <Box>
      <DefaultContainer sx={{ px: 0 }}>
        <Box
          sx={{
            position: "relative",
            px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            py: fr.spacing("8v"),
            marginTop: { xs: 0, sm: fr.spacing("8v") },
            marginBottom: fr.spacing("8v"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <HomeCircleImageDecoration size="small" />
          </Box>
          <Box sx={{ position: "relative" }}>
            <Typography component="h1" variant="h1" sx={{ mb: fr.spacing("10v") }}>
              Alternance{" "}
              <Typography component="span" variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }}>
                {data.metier}
              </Typography>
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                gap: fr.spacing("4v"),
              }}
            >
              {statItems.map(({ icon, value, label }) => (
                <Box key={label} sx={boxCss}>
                  <Image alt="" aria-hidden="true" src={icon} width={80} height={80} />
                  <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                    {value}
                  </Typography>
                  <Typography sx={{ mt: fr.spacing("4v"), fontSize: { xs: "1.125rem", md: "1.25rem" }, fontWeight: "bold", lineHeight: 1.2, color: "#161616" }}>{label}</Typography>
                </Box>
              ))}
            </Box>
            <Typography sx={{ mt: fr.spacing("2v"), fontSize: "0.75rem", color: "#666", textAlign: "right" }}>
              *calcul basé sur les contrats enregistrés pour l'année 2024/2025
            </Typography>
          </Box>
        </Box>

        <JobsCta href={jobsSearchUrl} metier={data.metier} />

        {/**
         * BLOC DESCRIPTION METIER
         */}
        <Box sx={{ my: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
          <Box sx={{ mb: fr.spacing("6v") }}>
            <Typography component="h2" variant="h2" sx={{ mb: fr.spacing("4v"), color: "#161616" }}>
              Le métier de <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.metier.toLocaleLowerCase()},</span> en alternance
            </Typography>
            <Box component="hr" sx={hrSx} />
            <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.description }} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Image src="/images/seo/metier/mission.svg" alt="" aria-hidden="true" width={60} height={60} />
            <Typography sx={{ ml: fr.spacing("4v"), fontSize: "1.25rem", fontWeight: "bold" }}>Missions principales :</Typography>
          </Box>

          <Box sx={threeColGridSx}>
            {(data.missions as { title: string; description: string }[]).map((mission) => (
              <Box key={mission.title} sx={cardSx}>
                <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.default }}>{mission.title} :</Typography>
                <Typography sx={{ mt: fr.spacing("1v") }}>{mission.description}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mt: fr.spacing("10v"), mb: fr.spacing("4v") }}>
            <Image src="/images/seo/metier/competence.svg" alt="" aria-hidden="true" width={60} height={60} />
            <Typography sx={{ ml: fr.spacing("4v"), fontWeight: "bold" }}>Compétences développées :</Typography>
          </Box>

          <Box sx={threeColGridSx}>
            {(data.competences as { title: string; description: string }[]).map((competence) => (
              <Box key={competence.title} sx={cardSx}>
                <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.default }}>{competence.title} :</Typography>
                <Typography sx={{ mt: fr.spacing("1v") }}>{competence.description}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/**
         * BLOC SALAIRE
         */}
        <Box
          sx={{
            mb: fr.spacing("8v"),
            py: fr.spacing("8v"),
            px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
          }}
        >
          <Typography component={"h2"} variant="h2" sx={{ mb: fr.spacing("4v") }}>
            Le salaire d’un alternant <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.metier.toLocaleLowerCase()}</span>
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          <Typography variant="h5" sx={{ mb: fr.spacing("4v") }} gutterBottom>
            Rémunération et évolution des apprentis
          </Typography>
          <Typography variant="body1">Minimum réglementaire en pourcentage du SMIC selon l’âge et à mesure de l’avancée dans le contrat :</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
              gap: fr.spacing("4v"),
              alignItems: "stretch",
              mt: fr.spacing("4v"),
            }}
          >
            <Box sx={cardSx}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
                Moins de 18 ans
              </Typography>
              <List
                sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}
              >
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    27%
                  </Typography>{" "}
                  la 1re année
                </ListItem>
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    39%
                  </Typography>{" "}
                  la 2e année
                </ListItem>
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    55%
                  </Typography>{" "}
                  la 3e année
                </ListItem>
              </List>
            </Box>
            <Box sx={cardSx}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
                18 à 20 ans
              </Typography>
              <List
                sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}
              >
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    43%
                  </Typography>{" "}
                  la 1re année
                </ListItem>
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    51%
                  </Typography>{" "}
                  la 2e année
                </ListItem>
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    60%
                  </Typography>{" "}
                  la 3e année
                </ListItem>
              </List>
            </Box>
            <Box sx={cardSx}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
                21 à 25 ans
              </Typography>
              <List
                sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}
              >
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    53%
                  </Typography>{" "}
                  la 1re année
                </ListItem>
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    61%
                  </Typography>{" "}
                  la 2e année
                </ListItem>
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    78%
                  </Typography>{" "}
                  la 3e année
                </ListItem>
              </List>
            </Box>
            <Box sx={cardSx}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
                26 ans et plus
              </Typography>
              <List
                sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}
              >
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    100%
                  </Typography>{" "}
                  la 1re année
                </ListItem>
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    100%
                  </Typography>{" "}
                  la 2e année
                </ListItem>
                <ListItem>
                  <Typography component={"span"} fontWeight={"bold"}>
                    100%
                  </Typography>{" "}
                  la 3e année
                </ListItem>
              </List>
            </Box>
          </Box>
          <Box sx={{ mt: fr.spacing("6v"), mb: fr.spacing("4v"), textAlign: "center" }}>
            <Button
              linkProps={{ href: `${PAGES.static.salaireAlternant.getPath()}?${UTM_PARAMS}` }}
              aria-label={"Calculer ma rémunération en alternance sur le simulateur la bonne alternance"}
              size="large"
              priority="secondary"
              style={{ marginTop: fr.spacing("2v") }}
            >
              Calculer ma rémunération en alternance
              <ArrowRightLine sx={{ mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
            </Button>
          </Box>
        </Box>

        {/**
         * BLOC ENTREPRISES
         */}
        <Box sx={{ my: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
          <Box sx={{ mb: fr.spacing("6v") }}>
            <Typography component="h2" variant="h2" sx={{ mb: fr.spacing("4v"), color: "#161616" }}>
              Entreprises qui recrutent activement en alternance
            </Typography>
            <Box component="hr" sx={hrSx} />
            <Typography sx={{ fontSize: "1.125rem", mb: fr.spacing("6v") }}>
              Découvrez{" "}
              <Typography component="span" sx={{ color: fr.colors.decisions.text.default.info.default, fontWeight: 700, fontSize: "1.125rem" }}>
                les {data.company_count} entreprises
              </Typography>{" "}
              qui recrutent activement des alternants {data.metier.toLowerCase()} :
            </Typography>
            <Box sx={threeColGridSx}>
              {(data.entreprises as { nom: string; job_count: number }[]).map((entreprise) => (
                <Box key={entreprise.nom} sx={cardSx}>
                  <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.default }}>{entreprise.nom}</Typography>
                  <Typography sx={{ mt: fr.spacing("1v"), color: fr.colors.decisions.text.label.grey.default }}>{entreprise.job_count} postes</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <JobsCta href={jobsSearchUrl} metier={data.metier} />

        <Box
          sx={{
            mt: fr.spacing("10v"),
            mb: fr.spacing("8v"),
            py: fr.spacing("8v"),
            px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Typography component="h2" variant="h2" sx={{ mb: fr.spacing("4v"), color: "#161616" }}>
            Les formations
          </Typography>
          <Box component="hr" sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: "4px solid #4B9F6C", opacity: 1 }} />
          <Typography component="h5" sx={{ fontSize: "1.375rem", fontWeight: "bold" }}>
            Niveaux de formation disponibles
          </Typography>
          <Box sx={threeColGridSx}>
            {(data.formations as { title: string; description: string; duree: string; niveau: string; count: number; competences: string[] }[]).map((formation) => (
              <Box key={formation.title} sx={{ ...cardSx, textAlign: "center" }}>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#4B9F6C" }}>{formation.title}</Typography>
                <Typography sx={{ my: fr.spacing("6v"), fontSize: "1.125rem", color: "#666" }}>{formation.description}</Typography>
                <Typography sx={{ fontSize: "1.375rem", fontWeight: 700 }}>{formation.count} formations</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Button linkProps={{ href: formationsSearchUrl }} size="large" priority="primary" style={{ marginTop: fr.spacing("6v") }}>
              Voir toutes les formations en alternance
              <ArrowRightLine sx={{ color: "#fff", mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
            </Button>
          </Box>
        </Box>

        {/**
         * BLOC VILLES
         */}
        <Box sx={{ my: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
          <Box sx={{ mb: fr.spacing("6v") }}>
            <Typography component="h2" variant="h2" sx={{ mb: fr.spacing("4v"), color: "#161616" }}>
              Où trouver une alternance <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.metier.toLocaleLowerCase()}</span> ?
            </Typography>
            <Box component="hr" sx={hrSx} />
            <Typography component="h5" sx={{ fontSize: "1.375rem", fontWeight: "bold" }}>
              Les offres par ville :
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
              gap: fr.spacing("4v"),
              mt: fr.spacing("4v"),
            }}
          >
            {(data.villes as { nom: string; job_count: number; geopoint: { lat: number; long: number } }[]).map((ville) => (
              <Link
                key={ville.nom}
                href={`/recherche?romes=${romesParam}&lat=${ville.geopoint.lat}&lon=${ville.geopoint.long}&address=${ville.nom}&job_name=${encodeURIComponent(data.metier)}&displayFormations=false&${UTM_PARAMS}`}
                style={{ background: "transparent" }}
                aria-label={`Afficher les offres en alternance de ${data.metier} à ${ville.nom}`}
              >
                <Box
                  sx={{
                    ...boxCss,
                    minWidth: "220px",
                    width: "100%",
                    maxWidth: "100%",
                    paddingY: fr.spacing("8v"),
                    paddingX: fr.spacing("6v"),
                    ":hover": {
                      backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
                      cursor: "pointer",
                    },
                  }}
                >
                  <Box sx={{ width: "100%", textAlign: "center" }}>
                    <Image alt="" aria-hidden="true" src="/images/seo/metier/france.svg" width={60} height={60} />
                  </Box>
                  <Box sx={{ width: "100%", textAlign: "left" }}>
                    <Typography
                      sx={{ mt: fr.spacing("1v"), fontSize: "2rem", fontWeight: "bold", lineHeight: 1.2, color: fr.colors.decisions.background.actionHigh.blueFrance.default }}
                    >
                      {ville.nom}
                    </Typography>
                    <Box sx={{ width: "100%", display: "flex", alignItems: "center", flexDirection: "row" }}>
                      <Typography sx={{ flex: 1, mt: fr.spacing("2v"), fontSize: "1.375rem", fontWeight: "bold", lineHeight: 1.1, color: "#161616" }}>
                        {ville.job_count} offres
                      </Typography>
                      <ArrowRightLine
                        sx={{ color: fr.colors.decisions.background.actionHigh.blueFrance.default, mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Link>
            ))}
          </Box>
        </Box>

        {/**
         * BLOC OFFRES
         */}
        {data.cards.length > 0 && (
          <Box sx={{ mb: fr.spacing("8v"), mt: fr.spacing("16v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
            <Box sx={{ mb: fr.spacing("6v") }}>
              <Typography component="h2" variant="h2" sx={{ mb: fr.spacing("4v"), color: "#161616" }}>
                Découvrez les {statItems[0].value} offres disponibles pour devenir{" "}
                <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.metier.toLocaleLowerCase()}</span>
              </Typography>
              <Box component="hr" sx={hrSx} />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                gap: fr.spacing("4v"),
                my: fr.spacing("4v"),
              }}
            >
              {data.cards.map((card, idx) => (
                <CarteOffre key={idx} card={card} utmParams={UTM_PARAMS} />
              ))}
            </Box>

            <JobsCta href={jobsSearchUrl} metier={data.metier} />
          </Box>
        )}
      </DefaultContainer>
    </Box>
  )
}
