import { fr } from "@codegouvfr/react-dsfr"
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { redirect } from "next/navigation"

import Button from "@codegouvfr/react-dsfr/Button"
import Link from "next/link"
import { HomeCircleImageDecoration } from "@/app/(home)/_components/HomeCircleImageDecoration"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ArrowRightLine } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"

export async function generateMetadata({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params
  const data = await apiGet("/_private/seo/metier/:metier", { params: { metier } })

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
  const data = await apiGet("/_private/seo/metier/:metier", { params: { metier } })

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
            px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            py: fr.spacing("8v"),
            marginTop: { xs: 0, sm: fr.spacing("8v") },
            marginBottom: fr.spacing("8v"),
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
              <Typography component="h1" variant="h1" sx={{ mb: fr.spacing("10v") }}>
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
                <Image alt="" aria-hidden="true" src={`/images/seo/metier/malette.svg`} width={80} height={80} />
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "32px", md: "40px" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                  {data.job_count}
                </Typography>
                <Typography sx={{ mt: fr.spacing("2v"), fontSize: { sx: "18px", md: "20px" }, fontWeight: "bold", lineHeight: { sx: "20px", md: "24px" }, color: "#161616" }}>
                  Offres disponibles
                </Typography>
              </Box>
              <Box sx={boxCss}>
                <Image alt="" aria-hidden="true" src={`/images/seo/metier/ecosystem.svg`} width={80} height={80} />
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "32px", md: "40px" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                  {data.applicant_count}
                </Typography>
                <Typography sx={{ mt: fr.spacing("2v"), fontSize: { sx: "18px", md: "20px" }, fontWeight: "bold", lineHeight: { sx: "20px", md: "24px" }, color: "#161616" }}>
                  candidats sur les 3 derniers mois
                </Typography>
              </Box>
              <Box sx={boxCss}>
                <Image alt="" aria-hidden="true" src={`/images/seo/metier/usine.svg`} width={80} height={80} />
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "32px", md: "40px" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                  {data.company_count}
                </Typography>
                <Typography sx={{ mt: fr.spacing("2v"), fontSize: { sx: "18px", md: "20px" }, fontWeight: "bold", lineHeight: { sx: "20px", md: "24px" }, color: "#161616" }}>
                  entreprises recrutent activement
                </Typography>
              </Box>
              <Box sx={boxCss}>
                <Image alt="" aria-hidden="true" src={`/images/seo/metier/monnaie.svg`} width={80} height={80} />
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
          <Button nativeButtonProps={{ tabIndex: -1 }} size="large" priority="primary" style={{ marginTop: fr.spacing("2v") }}>
            <DsfrLink style={{ color: "#fff" }} href={`/recherche?romes=${data.romes.join()}&radius=30&displayFormations=false&job_name=${encodeURIComponent(data.metier)}`}>
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
                <Typography sx={{ fontSize: "20px", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.hover }}>{mission.title} :</Typography>
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
                <Typography sx={{ fontSize: "20px", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.hover }}>{competence.title} :</Typography>
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: "20px" }}>{competence.description}</Typography>
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
          <Typography component={"h5"} sx={{ fontSize: "22px", fontWeight: "bold" }}>
            Rémunération et évolution
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
              gap: fr.spacing("4v"),
              alignItems: "stretch",
              mt: fr.spacing("4v"),
            }}
          >
            <Box sx={{ ...boxCss, minWidth: "220px", width: "100%", maxWidth: "100%" }}>
              <Typography sx={{ fontSize: "20px", fontWeight: "bold", mb: fr.spacing("4v") }}>1 ère année</Typography>
              <Typography sx={{ fontSize: "40px", fontWeight: "bold", mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
                ≃ {data.salaire.salaire_1ere_annee}€
              </Typography>
              <Typography sx={{ fontSize: "16px" }}>par mois</Typography>
            </Box>
            <Box sx={{ ...boxCss, minWidth: "220px", width: "100%", maxWidth: "100%" }}>
              <Typography sx={{ fontSize: "20px", fontWeight: "bold", mb: fr.spacing("4v") }}>2 ème année</Typography>
              <Typography sx={{ fontSize: "40px", fontWeight: "bold", mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
                ≃ {data.salaire.salaire_2eme_annee}€
              </Typography>
              <Typography sx={{ fontSize: "16px" }}>par mois</Typography>
            </Box>
            <Box sx={{ ...boxCss, minWidth: "220px", width: "100%", maxWidth: "100%" }}>
              <Typography sx={{ fontSize: "20px", fontWeight: "bold", mb: fr.spacing("4v") }}>
                Salaire médian pour un professionnel{" "}
                <Tooltip kind="hover" title="Le salaire médian divise les travailleurs en deux groupes, la moitié gagne davantage, l'autre moins" />
              </Typography>
              <Typography sx={{ fontSize: "40px", fontWeight: "bold", mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
                ≃ {data.salaire.salaire_median}€
              </Typography>
              <Typography sx={{ fontSize: "16px" }}>par mois</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: fr.spacing("6v"), mb: fr.spacing("4v"), textAlign: "center" }}>
            <Button nativeButtonProps={{ tabIndex: -1 }} size="large" priority="secondary" style={{ marginTop: fr.spacing("2v") }}>
              <DsfrLink aria-label="Aller au simulateur pour calculer ma rémunération en alternance" href={`/simulateur?${utmParams}`}>
                Calculer ma rémunération en alternance
                <ArrowRightLine sx={{ mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
              </DsfrLink>
            </Button>
          </Box>
        </Box>

        {/**
         * BLOC ENTREPRISES
         */}
        <Box sx={{ my: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
          <Box sx={{ mb: fr.spacing("6v") }}>
            <Typography component={"h2"} variant="h2" sx={{ mb: 2, color: "#161616" }}>
              Entreprises qui recrutent activement en alternance
            </Typography>
            <Box
              component="hr"
              sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
            />
            <Typography sx={{ fontSize: "18px", mb: fr.spacing("6v") }}>
              Découvrez{" "}
              <Typography component={"span"} sx={{ color: fr.colors.decisions.text.default.info.default, fontWeight: 700, fontSize: "18px" }}>
                les {data.company_count} entreprises
              </Typography>{" "}
              qui recrutent activement des alternants développeur web :
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                gap: fr.spacing("4v"),
                alignItems: "stretch",
                mt: fr.spacing("4v"),
              }}
            >
              {(data.entreprises as { nom: string; job_count: number }[]).map((entreprise) => (
                <Box
                  key={entreprise.nom}
                  sx={{
                    backgroundColor: "white",
                    padding: fr.spacing("7v"),
                    borderRadius: "5px",
                    boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                  }}
                >
                  <Typography sx={{ fontSize: "20px", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.default }}>{entreprise.nom}</Typography>
                  <Typography sx={{ mt: fr.spacing("1v"), fontSize: "20px", color: fr.colors.decisions.text.label.grey.default }}>{entreprise.job_count} postes</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Button nativeButtonProps={{ tabIndex: -1 }} size="large" priority="primary" style={{ marginTop: fr.spacing("2v") }}>
            <DsfrLink style={{ color: "#fff" }} href={`/recherche?romes=${data.romes.join()}&radius=30&displayFormations=false&job_name=${encodeURIComponent(data.metier)}`}>
              Voir toutes les offres en alternance
              <ArrowRightLine sx={{ color: "#fff", mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
            </DsfrLink>
          </Button>
        </Box>

        <Box
          sx={{
            mt: fr.spacing("10v"),
            mb: fr.spacing("8v"),
            py: fr.spacing("8v"),
            px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Typography component={"h2"} variant="h2" sx={{ mb: 2, color: "#161616" }}>
            Les formations
          </Typography>
          <Box component="hr" sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid #4B9F6C`, opacity: 1 }} />
          <Typography component={"h5"} sx={{ fontSize: "22px", fontWeight: "bold" }}>
            Niveaux de formation disponibles
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
              gap: fr.spacing("4v"),
              alignItems: "stretch",
              mt: fr.spacing("4v"),
            }}
          >
            {(data.formations as { title: string; description: string; duree: string; niveau: string; count: number; competences: string[] }[]).map((formation) => (
              <Box
                key={formation.title}
                sx={{
                  backgroundColor: "white",
                  padding: fr.spacing("7v"),
                  borderRadius: "5px",
                  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontSize: "28px", fontWeight: "bold", color: "#4B9F6C" }}>{formation.title}</Typography>
                <Typography sx={{ my: fr.spacing("6v"), fontSize: "22px", fontWeight: 700 }}>{formation.count} formations</Typography>
                <Typography sx={{ fontSize: "18px", color: "#666" }}>
                  Durée : {formation.duree} | Niveau : {formation.niveau}
                  {/* <br />
                  {formation.description} */}
                </Typography>
                {/* <Box sx={{ backgroundColor: fr.colors.decisions.background.alt.greenEmeraude.default, padding: fr.spacing("4v"), mt: fr.spacing("6v"), fontSize: "18px" }}>
                  <Typography sx={{ margin: "auto", fontWeight: 700 }}>Compétences développées</Typography>
                  <ul>
                    {(formation.competences as string[]).map((competence) => (
                      <li>{competence}</li>
                    ))}
                  </ul>
                </Box> */}
              </Box>
            ))}
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Button nativeButtonProps={{ tabIndex: -1 }} size="large" priority="primary" style={{ marginTop: fr.spacing("6v") }}>
              <DsfrLink style={{ color: "#fff" }} href={`/recherche?romes=${data.romes.join()}&radius=30&displayEntreprises=false&job_name=${encodeURIComponent(data.metier)}`}>
                Voir toutes les formations en alternance
                <ArrowRightLine sx={{ color: "#fff", mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
              </DsfrLink>
            </Button>
          </Box>
        </Box>

        {/**
         * BLOC VILLES
         */}
        <Box sx={{ my: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
          <Box sx={{ mb: fr.spacing("6v") }}>
            <Typography component={"h2"} variant="h2" sx={{ mb: 2, color: "#161616" }}>
              Où trouver une alternance <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.metier.toLocaleLowerCase()}</span> ?
            </Typography>
            <Box
              component="hr"
              sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
            />
            <Typography component={"h5"} sx={{ fontSize: "22px", fontWeight: "bold" }}>
              Les offres par ville :
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
              gap: fr.spacing("4v"),
              //alignItems: "stretch",
              mt: fr.spacing("4v"),
            }}
          >
            {(data.villes as { nom: string; job_count: number; geopoint: { lat: number; long: number } }[]).map((ville) => (
              <Link
                href={`/recherche?romes=${data.romes.join()}&lat=${ville.geopoint.lat}&lon=${ville.geopoint.long}&address=${ville.nom}&job_name=${encodeURIComponent(data.metier)}&displayFormations=false`}
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
                    <Image alt="" aria-hidden="true" src={`/images/seo/metier/france.svg`} width={60} height={60} />
                  </Box>
                  <Box sx={{ width: "100%", textAlign: "left" }}>
                    <Typography sx={{ mt: fr.spacing("1v"), fontSize: "40px", fontWeight: "bold", lineHeight: "48px", color: fr.colors.decisions.text.default.info.default }}>
                      {ville.nom}
                    </Typography>
                    <Box sx={{ width: "100%", display: "flex", alignItems: "center", flexDirection: "row" }}>
                      <Typography sx={{ flex: 1, mt: fr.spacing("2v"), fontSize: "22px", fontWeight: "bold", lineHeight: "24px", color: "#161616" }}>
                        {ville.job_count} offres
                      </Typography>
                      <ArrowRightLine
                        sx={{ color: fr.colors.decisions.background.actionHigh.blueFrance.hover, mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Link>
            ))}
          </Box>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
