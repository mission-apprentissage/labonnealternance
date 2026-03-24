import { fr } from "@codegouvfr/react-dsfr"
import { Box, Divider, Grid, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { SchemaOrg } from "@/components/SchemaOrg"
import { type IPage, PAGES } from "@/utils/routes.utils"
import { AllerPlusLoinItem } from "./AllerPlusLoinItem"

export const LayoutArticle = ({
  pages,
  title,
  bandeau,
  updatedAt,
  description,
  children,
  allerPlusLoinItems,
  sourceAllerPlusLoin,
  parentPage,
  page,
}: {
  pages: IPage[]
  title: ReactNode
  bandeau?: ReactNode
  updatedAt: ReactNode
  description: ReactNode
  children: ReactNode
  allerPlusLoinItems?: Array<{
    id: string
    title: string
    description: string
    imageUrl?: string
    path: string
  }>
  sourceAllerPlusLoin?: string
  parentPage?: IPage
  page: IPage
}) => (
  <>
    <SchemaOrg
      type="Article"
      title={page.getMetadata().title as string}
      description={page.getMetadata().description}
      url={page.getPath()}
      breadcrumbs={[
        { name: PAGES.static.home.title, url: PAGES.static.home.getPath() },
        ...(parentPage ? [{ name: parentPage.title, url: parentPage.getPath() }] : []),
        { name: page.title, url: page.getPath() },
      ]}
    />
    <Breadcrumb pages={pages} />
    <DefaultContainer sx={{ marginBottom: fr.spacing("10v") }}>
      <Grid container spacing={fr.spacing("6v")}>
        <Grid size={{ md: 12, xs: 12 }}>
          <Typography component="h1" variant="h1" color={fr.colors.decisions.text.default.info.default}>
            {title}
          </Typography>
        </Grid>
        <Grid container>
          <Grid size={{ md: 1, xs: 0 }}></Grid>
          <Grid size={{ md: 10, xs: 12 }}>
            <Box gap={fr.spacing("6v")} display={"flex"} flexDirection={"column"}>
              {bandeau}
              {updatedAt}
              {description}
              {children}
            </Box>
          </Grid>
          <Grid size={{ md: 1, xs: 0 }}></Grid>
        </Grid>
      </Grid>
      <Divider sx={{ width: "100%", height: 0, background: "none", borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`, my: fr.spacing("6v") }} />
      {allerPlusLoinItems?.length > 0 && (
        <Grid container spacing={fr.spacing("6v")} marginTop={fr.spacing("8v")}>
          <Grid size={12} spacing={fr.spacing("6v")}>
            <Typography component={"h2"} variant="h2">
              Pour continuer d'explorer
            </Typography>
            <Divider
              sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
            />
          </Grid>
          {allerPlusLoinItems.map((item, index) => (
            <Grid key={index} size={{ md: 4, xs: 12 }}>
              <AllerPlusLoinItem {...item} source={sourceAllerPlusLoin} />
            </Grid>
          ))}
        </Grid>
      )}
    </DefaultContainer>
  </>
)
