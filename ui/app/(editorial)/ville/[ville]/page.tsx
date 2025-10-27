import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Link, Typography } from "@mui/material"
import Image from "next/image"

import { villeData } from "@/app/(editorial)/ville/_components/ville_data"
import { HomeCircleImageDecoration } from "@/app/(home)/_components/HomeCircleImageDecoration"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"

// export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
//   const _params = await params

//   return PAGES.dynamic.metierJobById(metier.name).getMetadata()
// }

// const loisirs = {
//   Exposition: "expo.svg",
//   Promenade: "promenade.svg",
// }

const transports = {
  Bus: "bus.svg",
  TGV: "tgv.svg",
}

const appartements = {
  Studio: "studio.svg",
  T2: "t2.svg",
}

export default async function Ville({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params

  const data = villeData.find((town) => town.slug === ville)
  if (!data) {
    throw new Error("Ville not found")
  }

  // Data à fetch :
  // - nombre d'offres en alternance pour cette ville
  // - nombre de recruteurs lba dans cette ville

  const offerCount = 234
  const recruiterCount = 1000

  console.log("Ville data:", data)

  return (
    <Box>
      <DefaultContainer>
        <Box
          sx={{ position: "relative", p: fr.spacing("4w"), marginY: fr.spacing("4w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}
        >
          <Box
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            <HomeCircleImageDecoration height={100} />
          </Box>
          <Box sx={{ position: "relative", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4w"), justifyContent: "space-between" }}>
            <Box>
              <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
                Trouver une alternance
                <Typography component="h1" variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default, display: "block" }}>
                  <span style={{ color: "#161616" }}>à </span>
                  {data.ville}
                </Typography>
              </Typography>
              <Typography>
                <span style={{ color: fr.colors.decisions.text.default.info.default }}>{offerCount + recruiterCount}</span> offres en alternance sont disponibles:
                <br />
                <Button style={{ marginTop: fr.spacing("2w"), marginBottom: fr.spacing("2w") }}>Démarrer mes recherches</Button>
              </Typography>
            </Box>
            <Box sx={{ marginLeft: "auto", mt: fr.spacing("4w") }}>
              <Image src="/images/howto1.svg" alt="" unoptimized width={286} height={141} style={{ width: "100%" }} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: fr.spacing("4w"), paddingX: fr.spacing("4w") }}>
          <Typography component={"h2"} variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
            <span style={{ color: "#161616" }}>{data.ville},</span> {data.content.description_ville.title}
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />

          <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.description_ville.text }} />
        </Box>

        <Box sx={{ mb: fr.spacing("4w"), p: fr.spacing("4w"), backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
          <Typography component={"h2"} variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
            La vie d'alternant <span style={{ color: "#161616" }}>à {data.ville}</span>
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          <Typography>Le bassin socio économique</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.vie.text }} />
          <Box>
            {data.content.vie.activites.map((activite) => (
              <Typography key={activite.naf_label}>{activite.naf_label}</Typography>
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: fr.spacing("4w"), paddingX: fr.spacing("4w") }}>
          <Typography component={"h2"} variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
            Stats nombre d'opportunite_emploi
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          stats recruteurs spontanées
          <br />
          stats offres d'emploi
        </Box>

        <Box sx={{ mb: fr.spacing("4w"), p: fr.spacing("4w"), backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Typography component={"h2"} variant="h1" sx={{ mb: 2 }}>
            La mobilité et le logement
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          <Typography>La mobilite</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.mobilite.text }} />
          <Box>
            {data.content.mobilite.transports.map((transport) => (
              <Box key={transport}>
                <Typography>{transport}</Typography>
                <Image alt="" src={transports[transport]} width="50" height={50} />
              </Box>
            ))}
          </Box>

          <Typography>Le logement</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.logement.text }} />
          <Box>
            {data.content.logement.loyers.map((appartement) => (
              <Box key={appartement.type}>
                <Typography>{appartement.type} à louer</Typography>
                <Typography>{appartement.price_range}</Typography>
                <Image alt="" src={appartements[appartement.type]} width="50" height={50} />
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: fr.spacing("4w"), paddingX: fr.spacing("4w") }}>
          <Typography component={"h2"} variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
            Les loisirs <span style={{ color: "#161616" }}>à {data.ville}</span>
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          <Typography>Le bassin socio économique</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: data.content.vie.text }} />
          <Box>
            {data.content.vie.activites.map((activite) => (
              <Typography key={activite.naf_label}>{activite.naf_label}</Typography>
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: fr.spacing("4w"), p: fr.spacing("4w"), backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Typography component={"h2"} variant="h1" sx={{ mb: 2 }}>
            Découvrez également
          </Typography>
          <Box
            component="hr"
            sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
          />
          {villeData.map((autre_ville) =>
            autre_ville.slug !== ville ? (
              <Link key={autre_ville.slug} href={`/ville/${autre_ville.slug}`}>
                Trouver une alternance à {autre_ville.ville}
              </Link>
            ) : null
          )}
        </Box>
      </DefaultContainer>
    </Box>
  )
}
