import { Box, Divider, Grid, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { fr } from "@codegouvfr/react-dsfr"
import { AllerPlusLoinItem } from "./AllerPlusLoinItem"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import type { IPage } from "@/utils/routes.utils"

export const LayoutArticle = ({
  pages,
  title,
  description,
  updatedAt,
  children,
  allerPlusLoinItems,
}: {
  pages: IPage[]
  title: ReactNode
  description: ReactNode
  updatedAt: ReactNode
  children: ReactNode
  allerPlusLoinItems?: Array<{
    id: string
    title: string
    description: string
    imageUrl?: string
    path: string
  }>
}) => (
  <DefaultContainer sx={{ marginBottom: fr.spacing("10v"), marginTop: fr.spacing("10v") }}>
    <Breadcrumb pages={pages} />
    <Grid container spacing={fr.spacing("4v")}>
      <Grid size={{ md: 12, xs: 12 }}>
        <Typography component="h1" variant="h1" color={fr.colors.decisions.text.default.info.default}>
          {title}
        </Typography>
      </Grid>
      <Grid size={{ md: 1, xs: 0 }}></Grid>
      <Grid size={{ md: 10, xs: 12 }}>
        <Box gap={fr.spacing("6v")} display={"flex"} flexDirection={"column"}>
          {updatedAt}
          {description}
          {children}
        </Box>
      </Grid>
      <Grid size={{ md: 1, xs: 0 }}></Grid>
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
            <AllerPlusLoinItem {...item} />
          </Grid>
        ))}
      </Grid>
    )}
  </DefaultContainer>
)
