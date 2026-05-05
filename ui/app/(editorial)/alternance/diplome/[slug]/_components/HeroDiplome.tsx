import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import type { IDiplomeKpis } from "shared/models/seoDiplome.model"
import { UTM_PARAMS } from "../_data/constants"
import diplomeDecoration from "./diplome_decoration.svg"

const KPI_CONFIG = [
  { key: "duration" as const, label: "Durée de la formation", iconSrc: "/images/seo/malette.svg", labelFirst: true },
  { key: "entreprises" as const, label: "entreprises recrutent", iconSrc: "/images/seo/usine.svg", labelFirst: false },
  { key: "salaire" as const, label: "Salaire mensuel moyen", iconSrc: "/images/seo/monnaie.svg", labelFirst: true },
  { key: "offres" as const, label: "offres d'alternance", iconSrc: "/images/seo/malette.svg", labelFirst: false },
]

export function HeroDiplome({ titre, sousTitre, kpis, romes }: { titre: string; sousTitre: string; kpis: IDiplomeKpis; romes: string[] }) {
  return (
    <Box sx={{ marginBottom: fr.spacing("5w") }}>
      {/* Banner background */}
      <Box
        sx={{
          position: "relative",
          borderRadius: "10px",
          overflow: "hidden",
          pt: { xs: fr.spacing("4w"), md: fr.spacing("7w") },
          pb: { xs: fr.spacing("15v"), md: "180px" },
          px: { xs: fr.spacing("3w"), md: fr.spacing("8w") },
        }}
      >
        {/* Decoration SVG - same pattern as HomeCircleImageDecoration */}
        <Image
          fetchPriority="low"
          src={diplomeDecoration.src}
          alt=""
          unoptimized
          width={diplomeDecoration.width}
          height={diplomeDecoration.height}
          style={{
            overflow: "visible",
            height: "100%",
            width: "100%",
            top: 0,
            left: 0,
            position: "absolute",
            objectFit: "cover",
          }}
        />

        {/* Title */}
        <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: "12px" }}>
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "32px", md: "48px" },
              lineHeight: { xs: "40px", md: "56px" },
            }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
                fontSize: "inherit",
                lineHeight: "inherit",
                color: fr.colors.decisions.text.default.info.default,
              }}
            >
              {titre}
            </Typography>{" "}
            en alternance
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: "20px", md: "28px" },
              lineHeight: { xs: "28px", md: "36px" },
              color: fr.colors.decisions.text.default.info.default,
            }}
          >
            {sousTitre}
          </Typography>
        </Box>
      </Box>

      {/* KPI cards - overlapping the banner */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: fr.spacing("2v"),
          mt: { xs: `-${fr.spacing("12v")}`, md: "-144px" },
          position: "relative",
          zIndex: 1,
          px: { xs: fr.spacing("2v"), md: fr.spacing("5w") },
        }}
      >
        {KPI_CONFIG.map((config) => {
          const value = kpis[config.key]
          const valueFontSizeMd = ("" + value).length > 8 ? "32px" : "40px"
          const valueLineHeightMd = ("" + value).length > 8 ? "40px" : "48px"
          const valueFontSizeXs = ("" + value).length > 8 ? "22px" : "28px"
          const valueLineHeightXs = ("" + value).length > 8 ? "28px" : "36px"

          return (
            <Box
              key={config.key}
              sx={{
                textAlign: "center",
                p: { xs: fr.spacing("3v"), md: fr.spacing("6v") },
                backgroundColor: fr.colors.decisions.background.default.grey.default,
                borderRadius: "5px",
                boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: fr.spacing("2v"),
                minWidth: 0,
              }}
            >
              <Box sx={{ width: { xs: 56, md: 80 }, height: { xs: 56, md: 80 }, flexShrink: 0 }}>
                <Image src={config.iconSrc} alt="" width={80} height={80} aria-hidden="true" style={{ width: "100%", height: "100%" }} />
              </Box>

              {config.labelFirst ? (
                <>
                  <Typography
                    sx={{ fontWeight: 700, fontSize: { xs: "16px", md: "20px" }, lineHeight: { xs: "22px", md: "28px" }, color: fr.colors.decisions.text.title.grey.default }}
                  >
                    {config.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: valueFontSizeXs, md: valueFontSizeMd },
                      lineHeight: { xs: valueLineHeightXs, md: valueLineHeightMd },
                      color: fr.colors.decisions.text.default.info.default,
                    }}
                  >
                    {value}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: valueFontSizeXs, md: valueFontSizeMd },
                      lineHeight: { xs: valueLineHeightXs, md: valueLineHeightMd },
                      color: fr.colors.decisions.text.default.info.default,
                    }}
                  >
                    {value}
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 700, fontSize: { xs: "16px", md: "20px" }, lineHeight: { xs: "22px", md: "28px" }, color: fr.colors.decisions.text.title.grey.default }}
                  >
                    {config.label}
                  </Typography>
                </>
              )}
            </Box>
          )
        })}
      </Box>

      {/* CTA centered below KPIs */}
      <Box sx={{ textAlign: "center", mt: fr.spacing("6v"), pb: fr.spacing("2v") }}>
        <Button
          title={`Voir toutes les opportunités d'emploi en ${titre} en alternance`}
          priority="primary"
          size="large"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          linkProps={{ href: `/recherche-emploi?romes=${romes.join(",")}&${UTM_PARAMS}` }}
        >
          Voir toutes les opportunités
        </Button>
      </Box>
    </Box>
  )
}
