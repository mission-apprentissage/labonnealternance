import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

import type { IDiplomeKpi } from "../_data/types"

export function HeroDiplome({ titre, titreAccent, sousTitre, kpis }: { titre: string; titreAccent: string; sousTitre: string; kpis: IDiplomeKpi[] }) {
  const titreSuffix = titre.replace(titreAccent, "").trim()

  return (
    <Box sx={{ marginBottom: fr.spacing("5w") }}>
      {/* Banner - même structure que la page métier */}
      <Box
        sx={{
          position: "relative",
          p: fr.spacing("5w"),
          pb: fr.spacing("20v"),
          borderRadius: "10px",
          backgroundColor: fr.colors.decisions.background.default.grey.hover,
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(224, 132, 11, 0.29)",
            right: "200px",
            top: fr.spacing("6v"),
          }}
        />
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            backgroundColor: "#E8DDC3",
            right: "100px",
            top: fr.spacing("4v"),
          }}
        />
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 141, 126, 0.31)",
            left: "42%",
            top: "140px",
          }}
        />
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            border: "11px solid #DDDDF2",
            right: "60px",
            top: "-10px",
          }}
        />

        {/* Dashed decorative ellipse */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            width: "95%",
            height: "113px",
            left: "2%",
            top: "76px",
            border: "5px dashed",
            borderColor: fr.colors.decisions.border.default.grey.default,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Title - structure identique à la page métier */}
        <Box sx={{ position: "relative" }}>
          <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
            <Typography component="span" variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }}>
              {titreAccent}
            </Typography>
            {titreSuffix && ` ${titreSuffix}`}
          </Typography>
          <Box
            component="hr"
            sx={{
              maxWidth: "93px",
              border: "none",
              borderBottom: "none",
              borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`,
              opacity: 1,
              my: fr.spacing("3w"),
            }}
          />
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
          mt: `-${fr.spacing("16v")}`,
          position: "relative",
          zIndex: 1,
          px: { xs: fr.spacing("2v"), md: fr.spacing("4v") },
        }}
      >
        {kpis.map((kpi) => {
          const valueFontSize = kpi.value.length > 8 ? "32px" : "40px"
          const valueLineHeight = kpi.value.length > 8 ? "40px" : "48px"

          return (
            <Box
              key={kpi.label}
              sx={{
                textAlign: "center",
                p: fr.spacing("6v"),
                backgroundColor: fr.colors.decisions.background.default.grey.default,
                borderRadius: "5px",
                boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: fr.spacing("2v"),
                minHeight: { xs: "auto", md: "274px" },
              }}
            >
              <Image src={kpi.iconSrc} alt="" width={80} height={80} aria-hidden="true" />

              {kpi.labelFirst ? (
                <>
                  <Typography sx={{ fontWeight: 700, fontSize: "20px", lineHeight: "28px", color: fr.colors.decisions.text.title.grey.default }}>{kpi.label}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: valueFontSize, lineHeight: valueLineHeight, color: fr.colors.decisions.text.default.info.default }}>
                    {kpi.value}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 700, fontSize: valueFontSize, lineHeight: valueLineHeight, color: fr.colors.decisions.text.default.info.default }}>
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "20px", lineHeight: "28px", color: fr.colors.decisions.text.title.grey.default }}>{kpi.label}</Typography>
                </>
              )}
            </Box>
          )
        })}
      </Box>

      {/* CTA centered below KPIs */}
      <Box sx={{ textAlign: "center", mt: fr.spacing("6v") }}>
        <Button priority="primary" size="large" iconId="fr-icon-arrow-right-line" iconPosition="right" linkProps={{ href: "/recherche-emploi" }}>
          Voir toutes les opportunités
        </Button>
      </Box>
    </Box>
  )
}
