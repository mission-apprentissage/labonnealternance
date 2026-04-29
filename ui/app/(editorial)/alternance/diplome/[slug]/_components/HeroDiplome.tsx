import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

import { UTM_PARAMS } from "../_data/constants"
import type { IDiplomeKpi } from "../_data/types"
import diplomeDecoration from "./diplome_decoration.svg"

export function HeroDiplome({ titre, titreAccent, sousTitre, kpis }: { titre: string; titreAccent: string; sousTitre: string; kpis: IDiplomeKpi[] }) {
  const titreSuffix = titre.replace(titreAccent, "").trim()

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
              {titreAccent}
            </Typography>
            {titreSuffix && ` ${titreSuffix}`}
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
        {kpis.map((kpi) => {
          const valueFontSizeMd = kpi.value.length > 8 ? "32px" : "40px"
          const valueLineHeightMd = kpi.value.length > 8 ? "40px" : "48px"
          const valueFontSizeXs = kpi.value.length > 8 ? "22px" : "28px"
          const valueLineHeightXs = kpi.value.length > 8 ? "28px" : "36px"

          return (
            <Box
              key={kpi.label}
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
                <Image src={kpi.iconSrc} alt="" width={80} height={80} aria-hidden="true" style={{ width: "100%", height: "100%" }} />
              </Box>

              {kpi.labelFirst ? (
                <>
                  <Typography
                    sx={{ fontWeight: 700, fontSize: { xs: "16px", md: "20px" }, lineHeight: { xs: "22px", md: "28px" }, color: fr.colors.decisions.text.title.grey.default }}
                  >
                    {kpi.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: valueFontSizeXs, md: valueFontSizeMd },
                      lineHeight: { xs: valueLineHeightXs, md: valueLineHeightMd },
                      color: fr.colors.decisions.text.default.info.default,
                    }}
                  >
                    {kpi.value}
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
                    {kpi.value}
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 700, fontSize: { xs: "16px", md: "20px" }, lineHeight: { xs: "22px", md: "28px" }, color: fr.colors.decisions.text.title.grey.default }}
                  >
                    {kpi.label}
                  </Typography>
                </>
              )}
            </Box>
          )
        })}
      </Box>

      {/* CTA centered below KPIs */}
      <Box sx={{ textAlign: "center", mt: fr.spacing("6v"), pb: fr.spacing("2v") }}>
        <Button priority="primary" size="large" iconId="fr-icon-arrow-right-line" iconPosition="right" linkProps={{ href: `/recherche-emploi?${UTM_PARAMS}` }}>
          Voir toutes les opportunités
        </Button>
      </Box>
    </Box>
  )
}
