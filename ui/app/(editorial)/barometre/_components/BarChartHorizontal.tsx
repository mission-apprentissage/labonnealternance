"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { domAnimation, LazyMotion } from "motion/react"
import * as motion from "motion/react-m"

export type BarChartHorizontalItem = {
  label: string
  value: number
  displayValue?: string
}

type Tone = "info" | "success" | "error"

const toneToColor: Record<Tone, string> = {
  info: fr.colors.decisions.background.actionHigh.blueFrance.default,
  success: fr.colors.decisions.background.actionHigh.greenBourgeon.default,
  error: fr.colors.decisions.background.actionHigh.redMarianne.default,
}

function darken(color: string): string {
  return `color-mix(in srgb, ${color} 78%, #000)`
}

export function BarChartHorizontal({
  title,
  caption,
  items,
  tone = "info",
  source = "La bonne alternance",
}: {
  title: string
  caption?: string
  items: BarChartHorizontalItem[]
  tone?: Tone
  source?: string
}) {
  const max = Math.max(...items.map((item) => item.value))
  const color = toneToColor[tone]
  const gradient = `linear-gradient(90deg, ${color} 0%, ${darken(color)} 100%)`

  return (
    <LazyMotion features={domAnimation}>
      <Box
        component="figure"
        sx={{
          m: 0,
          my: fr.spacing("8v"),
          p: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          borderRadius: "4px",
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.2s ease",
          "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)" },
        }}
      >
        <Box component="figcaption" sx={{ mb: fr.spacing("6v") }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: "16px", md: "18px" }, color: fr.colors.decisions.text.title.grey.default, lineHeight: 1.3 }}>{title}</Typography>
          {caption ? (
            <Typography component="p" sx={{ fontSize: "13px", color: fr.colors.decisions.text.mention.grey.default, mt: fr.spacing("1v"), fontStyle: "italic" }}>
              {caption}
            </Typography>
          ) : null}
        </Box>

        <Box component="dl" sx={{ m: 0, display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
          {items.map((item, index) => {
            const percent = max > 0 ? (item.value / max) * 100 : 0
            return (
              <Box
                key={item.label}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "minmax(180px, 32%) 1fr" },
                  gap: { xs: fr.spacing("1v"), md: fr.spacing("3v") },
                  alignItems: "center",
                  "&:hover .bar-fill": { filter: "brightness(1.08)" },
                  "&:hover .bar-value": { backgroundColor: fr.colors.decisions.background.contrast.grey.default },
                }}
              >
                <Typography
                  component="dt"
                  sx={{
                    fontSize: "14px",
                    color: fr.colors.decisions.text.default.grey.default,
                    fontWeight: 500,
                    lineHeight: 1.35,
                  }}
                >
                  {item.label}
                </Typography>
                <Box component="dd" sx={{ m: 0, display: "flex", alignItems: "center", gap: fr.spacing("2v") }}>
                  <Box
                    sx={{
                      flexGrow: 1,
                      position: "relative",
                      height: "20px",
                      backgroundColor: fr.colors.decisions.background.contrast.grey.default,
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                    aria-hidden="true"
                  >
                    <motion.div
                      className="bar-fill"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percent}%` }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.9, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: "100%",
                        minWidth: "4px",
                        background: gradient,
                        borderRadius: "10px",
                        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.08)",
                        transition: "filter 0.2s ease",
                      }}
                    />
                  </Box>
                  <motion.span
                    className="bar-value"
                    initial={{ opacity: 0, x: -4 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: index * 0.05 + 0.6 }}
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: fr.colors.decisions.text.default.grey.default,
                      whiteSpace: "nowrap",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      minWidth: "48px",
                      textAlign: "right",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    {item.displayValue ?? item.value.toLocaleString("fr-FR")}
                  </motion.span>
                </Box>
              </Box>
            )
          })}
        </Box>

        <Typography
          component="p"
          sx={{
            mt: fr.spacing("6v"),
            fontSize: "11px",
            color: fr.colors.decisions.text.mention.grey.default,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          Source&nbsp;: {source}
        </Typography>
      </Box>
    </LazyMotion>
  )
}
