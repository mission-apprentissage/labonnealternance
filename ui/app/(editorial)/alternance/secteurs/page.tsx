import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { cardArrowSx, cardLinkStyle, cardTitleSx, listicleCardSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import { SectionTitle } from "@/app/(editorial)/alternance/_components/SectionTitle"
import { secteurData } from "@/app/(editorial)/alternance/_components/secteur_data"
import { SchemaOrg } from "@/components/SchemaOrg"
import { ArrowRightLine } from "@/theme/components/icons"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: METADATA.static.alternanceSecteurs().title,
  description: METADATA.static.alternanceSecteurs().description,
}

export default function AlternanceSecteurs() {
  const url = PAGES.static.alternanceSecteurs.getPath()
  const meta = METADATA.static.alternanceSecteurs()
  const breadcrumbs = [
    { name: "Accueil", url: "/" },
    { name: PAGES.static.alternanceSecteurs.title, url },
  ]
  const itemList = secteurData.map((s) => ({ name: `Alternance ${s.secteur.toLowerCase()}`, url: PAGES.dynamic.seoSecteur(s.slug).getPath() }))

  return (
    <Box>
      <SchemaOrg type="CollectionPage" title={meta.title} description={meta.description} url={url} breadcrumbs={breadcrumbs} />
      <SchemaOrg
        type="ItemList"
        title="Secteurs accessibles en alternance"
        description="Annuaire des secteurs les plus recherchés en alternance sur La bonne alternance."
        url={url}
        breadcrumbs={breadcrumbs}
        itemList={itemList}
        omitBreadcrumb
      />

      <Breadcrumb pages={[PAGES.static.alternanceSecteurs]} />

      <DefaultContainer>
        <Box
          sx={{
            p: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
            mb: fr.spacing("8v"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Typography component="h1" variant="h1" sx={{ mb: fr.spacing("4v") }}>
            L'alternance par secteur
          </Typography>
          <Typography component="p" sx={{ fontSize: "1.125rem" }}>
            Vous savez dans quel domaine vous voulez travailler, mais pas encore quel métier ? Pour chaque secteur, découvrez les métiers accessibles en alternance, les offres
            disponibles, les entreprises qui recrutent, les formations et le salaire d'un apprenti.
          </Typography>
        </Box>

        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle title="Choisissez un secteur" />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
              gap: fr.spacing("4v"),
            }}
          >
            {secteurData.map((s) => (
              <Link key={s.slug} href={PAGES.dynamic.seoSecteur(s.slug).getPath()} aria-label={`Alternance ${s.secteur.toLowerCase()} - voir le secteur`} style={cardLinkStyle}>
                <Box sx={listicleCardSx}>
                  <Typography sx={cardTitleSx}>{s.secteur}</Typography>
                  <ArrowRightLine sx={cardArrowSx} />
                </Box>
              </Link>
            ))}
          </Box>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
