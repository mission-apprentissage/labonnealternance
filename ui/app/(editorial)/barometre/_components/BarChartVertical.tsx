"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { domAnimation, LazyMotion } from "motion/react"
import * as motion from "motion/react-m"

export type BarChartVerticalSegment = {
  value: number
  color: string
  label: string
}

export type BarChartVerticalItem = {
  label: string
  shortLabel?: string
  segments: BarChartVerticalSegment[]
  total?: number
  totalDisplay?: string
  annotation?: string
  highlighted?: boolean
}

function darken(color: string): string {
  return `color-mix(in srgb, ${color} 80%, #000)`
}

export function BarChartVertical({
  title,
  caption,
  items,
  legend,
  source = "La bonne alternance",
  yAxisLabel,
}: {
  title: string
  caption?: string
  items: BarChartVerticalItem[]
  legend?: { label: string; color: string }[]
  source?: string
  yAxisLabel?: string
}) {
  const max = items.length > 0 ? Math.max(...items.map((item) => item.total ?? item.segments.reduce((sum, s) => sum + s.value, 0))) : 0
  const shouldRotateLabels = items.length > 8

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

        <Box sx={{ display: "flex", alignItems: "stretch", gap: fr.spacing("1v") }}>
          {yAxisLabel ? (
            <Typography
              component="span"
              sx={{
                display: { xs: "none", md: "block" },
                fontSize: "11px",
                color: fr.colors.decisions.text.mention.grey.default,
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                alignSelf: "center",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
              }}
            >
              {yAxisLabel}
            </Typography>
          ) : null}

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "flex-end",
              gap: { xs: fr.spacing("1v"), md: fr.spacing("2v") },
              height: "280px",
              borderBottom: `2px solid ${fr.colors.decisions.border.default.grey.default}`,
              pb: fr.spacing("1v"),
              // Espace réservé sous l'axe pour les libellés (positionnés en absolu) :
              // plus large quand ils sont pivotés à -45°.
              mb: shouldRotateLabels ? fr.spacing("14v") : fr.spacing("7v"),
            }}
          >
            {items.map((item, index) => {
              const total = item.total ?? item.segments.reduce((sum, s) => sum + s.value, 0)
              const heightPercent = max > 0 ? (total / max) * 100 : 0
              const delay = index * 0.05

              return (
                <Box
                  key={item.label}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                    justifyContent: "flex-end",
                    minWidth: 0,
                    position: "relative",
                  }}
                >
                  {item.annotation ? (
                    <motion.span
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: delay + 0.9, type: "spring", stiffness: 220, damping: 18 }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#fff",
                        backgroundColor: fr.colors.decisions.background.actionHigh.success.default,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        marginBottom: "6px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                      }}
                    >
                      ↑ {item.annotation}
                    </motion.span>
                  ) : null}

                  {item.totalDisplay ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: delay + 0.8 }}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: fr.colors.decisions.text.default.grey.default,
                        marginBottom: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.totalDisplay}
                    </motion.span>
                  ) : null}

                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: { xs: "32px", md: "56px" },
                      height: `${heightPercent}%`,
                      minHeight: total > 0 ? "4px" : 0,
                      position: "relative",
                      "&:hover .bar-stack, &:focus-within .bar-stack": {
                        filter: "brightness(1.08)",
                      },
                      "&:hover .bar-tooltip, &:focus-within .bar-tooltip": {
                        opacity: 1,
                        transform: "translate(-50%, -8px)",
                      },
                    }}
                  >
                    <motion.div
                      className="bar-stack"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                      role="img"
                      tabIndex={0}
                      aria-label={`${item.label}: ${item.totalDisplay ?? total.toLocaleString("fr-FR")}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column-reverse",
                        borderRadius: "6px 6px 0 0",
                        overflow: "hidden",
                        transformOrigin: "bottom",
                        boxShadow: item.highlighted
                          ? `0 0 0 2px ${fr.colors.decisions.background.actionHigh.blueFrance.default}, 0 4px 12px rgba(0, 0, 145, 0.25)`
                          : "0 1px 2px rgba(0,0,0,0.08)",
                        transition: "filter 0.2s ease",
                      }}
                    >
                      {item.segments.map((segment, idx) => {
                        const segPercent = total > 0 ? (segment.value / total) * 100 : 0
                        return (
                          <Box
                            key={`${item.label}-${segment.label}-${idx}`}
                            sx={{
                              height: `${segPercent}%`,
                              background: `linear-gradient(180deg, ${segment.color} 0%, ${darken(segment.color)} 100%)`,
                              minHeight: segment.value > 0 ? "2px" : 0,
                            }}
                          />
                        )
                      })}
                    </motion.div>

                    <Box
                      className="bar-tooltip"
                      sx={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translate(-50%, 0)",
                        backgroundColor: fr.colors.decisions.background.actionHigh.grey.default,
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        opacity: 0,
                        pointerEvents: "none",
                        transition: "opacity 0.2s ease, transform 0.2s ease",
                        zIndex: 2,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          top: "100%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          border: "4px solid transparent",
                          borderTopColor: fr.colors.decisions.background.actionHigh.grey.default,
                        },
                      }}
                    >
                      {item.totalDisplay ?? total.toLocaleString("fr-FR")}
                    </Box>
                  </Box>

                  <Typography
                    component="span"
                    sx={{
                      position: "absolute",
                      top: "100%",
                      mt: fr.spacing("1v"),
                      fontSize: shouldRotateLabels ? { xs: "8.5px", md: "9.5px" } : { xs: "10px", md: "11px" },
                      color: fr.colors.decisions.text.default.grey.default,
                      lineHeight: 1.2,
                      fontWeight: item.highlighted ? 700 : 400,
                      whiteSpace: "nowrap",
                      // Libellés ancrés au centre de chaque barre : centrés à l'horizontale, ou
                      // coin haut-droit ancré au centre de la barre quand ils sont pivotés à -45°.
                      ...(shouldRotateLabels
                        ? { right: "50%", transformOrigin: "top right", transform: "rotate(-45deg)" }
                        : { left: "50%", transform: "translateX(-50%)", textAlign: "center" }),
                    }}
                  >
                    {item.shortLabel ?? item.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>

        {legend && legend.length > 0 ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("4v"), mt: fr.spacing("6v") }}>
            {legend.map((entry) => (
              <Box key={entry.label} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
                <Box
                  sx={{
                    width: "14px",
                    height: "14px",
                    background: `linear-gradient(180deg, ${entry.color} 0%, ${darken(entry.color)} 100%)`,
                    borderRadius: "3px",
                  }}
                  aria-hidden="true"
                />
                <Typography component="span" sx={{ fontSize: "13px", color: fr.colors.decisions.text.default.grey.default }}>
                  {entry.label}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : null}

        <Typography
          component="p"
          sx={{
            mt: fr.spacing("4v"),
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
