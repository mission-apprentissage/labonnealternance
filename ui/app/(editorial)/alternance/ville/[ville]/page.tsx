import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Link, Typography } from "@mui/material"
import Image from "next/image"
import { redirect } from "next/navigation"

import { appartements, loisirs, transports, villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { ArrowRightLine } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"

export async function generateStaticParams() {
  return villeData.map((ville) => ({ ville: ville.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params
  const data = await apiGet("/_private/seo/ville/:ville", { params: { ville } })

  return {
    title: `Alternance ${data.ville} : ${data.job_count + data.recruteur_count} Offres | Salaires & Formations 2025`,
    description: `${data.job_count + data.recruteur_count} offres d'alternance à ${data.ville}. Salaire moyen 1050€. BTS, Licence Pro, Master. Trouvez votre contrat d'apprentissage en ${data.region}.`,
  }
}

export const dynamic = "force-static"
export const dynamicParams = false

// export default async function Ville({ params }: { params: Promise<{ ville: string }> }) {
//   const { ville } = await params
export default async function Ville({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params
  const data = await apiGet("/_private/seo/ville/:ville", { params: { ville } })

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
              position: "relative",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: fr.spacing("1w"), md: fr.spacing("4w") },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
                Trouver une alternance
                <Typography component="h1" variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default, display: "block" }}>
                  <span style={{ color: "#161616" }}>à </span>
                  {data.ville}
                </Typography>
              </Typography>
              <Typography>
                <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.job_count + data.recruteur_count}</span> offres en alternance sont disponibles:
                <br />
                <Button
                  priority="primary"
                  style={{ marginTop: fr.spacing("2w"), marginBottom: fr.spacing("2w") }}
                  aria-label={`Démarrer mes recherches d'alternance à ${data.ville}`}
                  size="large"
                >
                  <Link sx={{ color: "white", textDecoration: "none" }} href={`/recherche?lat=${data.geopoint.lat}&lon=${data.geopoint.long}&address=${data.ville}+${data.cp}`}>
                    Démarrer mes recherches
                  </Link>
                </Button>
              </Typography>
            </Box>
            <Box sx={{ display: { xs: "none", md: "block" }, marginLeft: "auto", mt: fr.spacing("4w") }}>
              <Image src="/images/howto1.svg" alt="" unoptimized width={286} height={141} style={{ width: "100%" }} />
            </Box>
          </Box>
        </Box>

        {/**
         * BLOC DESCRIPTION DE LA VILLE
         */}
        <Box sx={{ mb: fr.spacing("4w"), px: { xs: fr.spacing("2w"), md: fr.spacing("4w") } }}>
          <Box
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: fr.spacing("1w"), md: fr.spacing("4w") },
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ mb: fr.spacing("4w") }}>
              <Typography component={"h2"} variant="h2" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
                <span style={{ color: "#161616" }}>{data.ville},</span> {data.content.description_ville.title}
              </Typography>
              <Box
                component="hr"
                sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
              />

              <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.description_ville.text }} />
            </Box>
            <Box
              sx={{
                marginLeft: { xs: "unset", md: "auto" },
                margin: { xs: "auto", md: "unset" },
                width: { xs: "100%", md: "250px", lg: "385px" },
                minWidth: { xs: "unset", md: "250px", lg: "385px" },
                maxWidth: "385px",
                mb: fr.spacing("4w"),
              }}
            >
              <Image
                src={`/images/seo/ville/${data.content.description_ville.image}`}
                alt=""
                width={385}
                height={385}
                style={{ width: "100%", height: "auto", borderRadius: "5px", boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)" }}
              />
            </Box>
          </Box>
        </Box>

        {/**
         * BLOC VIE D'ALTERNANT
         */}
        <Box
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
              {data.content.vie.activites.map((activite: { naf_label?: string; rome_codes?: string[] }) => (
                <Link
                  key={activite.naf_label}
                  underline="none"
                  href={`/recherche?romes=${activite.rome_codes.join(",")}&job_name=${activite.naf_label}&radius=30&lat=${data.geopoint.lat}&lon=${data.geopoint.long}&address=${data.ville} (${data.cp})`}
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
                <Link sx={{ textDecoration: "underline" }} href={`/recherche?lat=${data.geopoint.lat}&lon=${data.geopoint.long}&address=${data.ville}+${data.cp}`}>
                  Voir toutes les opportunités à {data.ville}
                  <ArrowRightLine sx={{ ml: fr.spacing("2w"), width: 12, height: 12 }} />
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>

        {/**
         * BLOC STATISTIQUES
         */}
        <Box sx={{ mb: fr.spacing("4w"), px: { xs: fr.spacing("2w"), md: fr.spacing("4w") } }}>
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
        </Box>

        {/**
         * BLOC MOBILITE
         */}
        <Box
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
                {data.content.mobilite.transports.map((transport: { type?: string; label?: string }) => (
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
                    <Image alt="" src={`/images/seo/transports/${transports[transport.type]}`} width="50" height={50} />
                    <Typography sx={{ mt: fr.spacing("1v"), fontWeight: "bold", color: "#161616" }}>{transport.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ whiteSpace: "pre-wrap", mt: { xs: fr.spacing("5v"), md: 0 } }} dangerouslySetInnerHTML={{ __html: data.content.mobilite.text }} />
            </Box>
          </Box>

          {/**
           * BLOC LOGEMENT
           */}
          <Box sx={{ mt: fr.spacing("3v"), display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: fr.spacing("1w"), md: fr.spacing("4w") } }}>
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
                {data.content.logement.loyers.map((appartement: { type?: string; price_range?: string }) => (
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
        </Box>

        {/**
         * BLOC LOISIRS
         */}
        <Box sx={{ mb: fr.spacing("4w"), px: { xs: fr.spacing("2w"), md: fr.spacing("4w") } }}>
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
                {data.content.loisirs.types.map((loisir: { type?: string; label?: string }) => (
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
        </Box>
      </DefaultContainer>
    </Box>
  )
}
