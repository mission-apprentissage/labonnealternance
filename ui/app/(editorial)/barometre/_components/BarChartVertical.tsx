"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { ChartFrame } from "./ChartFrame"

export type BarChartVerticalSegment = {
  value: number
  color: string
  label: string
  /** Affiché dans le segment : réservé à la série qui porte le message du graphique. */
  insideLabel?: string
}

export type BarChartVerticalItem = {
  label: string
  shortLabel?: string
  segments: BarChartVerticalSegment[]
  total?: number
  totalDisplay?: string
  annotation?: string
  highlighted?: boolean
  showValue?: boolean
}

const PLOT_HEIGHT = 260
const MIN_INSIDE_LABEL_HEIGHT = 20

function getAxisTicks(max: number): number[] {
  if (max <= 0) return [0]
  const rawStep = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rawStep) ?? magnitude
  const ticks = [0]
  while (ticks[ticks.length - 1] < max * 1.1) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

const formatTick = (value: number) => (value >= 1000 ? `${(value / 1000).toLocaleString("fr-FR")} k` : value.toLocaleString("fr-FR"))

export function BarChartVertical({
  title,
  caption,
  items,
  legend,
  source,
}: {
  title: string
  caption?: string
  items: BarChartVerticalItem[]
  legend?: { label: string; color: string }[]
  source?: string
}) {
  const totals = items.map((item) => item.total ?? item.segments.reduce((sum, s) => sum + s.value, 0))
  const ticks = getAxisTicks(totals.length > 0 ? Math.max(...totals) : 0)
  const axisMax = ticks[ticks.length - 1]
  const shouldRotateLabels = items.length > 8
  const hasHighlight = items.some((item) => item.highlighted)
  const surface = fr.colors.decisions.background.default.grey.default

  return (
    <ChartFrame title={title} caption={caption} source={source}>
      <Box
        sx={{
          position: "relative",
          height: `${PLOT_HEIGHT}px`,
          ml: "40px",
          mt: fr.spacing("4v"),
          mb: shouldRotateLabels ? fr.spacing("14v") : fr.spacing("7v"),
        }}
      >
        {ticks.map((tick) => (
          <Box
            key={tick}
            sx={{ position: "absolute", left: 0, right: 0, bottom: `${(tick / axisMax) * 100}%`, borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
            aria-hidden="true"
          >
            <Typography
              component="span"
              sx={{
                position: "absolute",
                right: "100%",
                top: "-9px",
                pr: fr.spacing("2v"),
                fontSize: "12px",
                lineHeight: "18px",
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                color: fr.colors.decisions.text.mention.grey.default,
              }}
            >
              {formatTick(tick)}
            </Typography>
          </Box>
        ))}

        <Box sx={{ position: "absolute", inset: 0, display: "flex", gap: { xs: fr.spacing("1v"), md: fr.spacing("2v") } }}>
          {items.map((item, index) => {
            const total = totals[index]
            const heightPercent = axisMax > 0 ? (total / axisMax) * 100 : 0
            const barHeight = (heightPercent / 100) * PLOT_HEIGHT
            const isStacked = item.segments.length > 1
            const valueLabel = item.totalDisplay ?? (item.highlighted || item.showValue ? total.toLocaleString("fr-FR") : null)
            const tooltipAlign = index < 2 ? { left: 0 } : index > items.length - 3 ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }
            // Nom accessible de la barre. Sur un graphique empilé, le total seul masque la
            // répartition, qui est l'information portée par le graphique (RGAA 1.6) ; sur une
            // barre simple, le segment unique ne ferait que répéter le total.
            const segmentLabels = item.segments.filter((s) => s.value > 0).map((s) => `${s.label} : ${s.value.toLocaleString("fr-FR")}`)
            const barLabel = [`${item.label} : ${item.totalDisplay ?? total.toLocaleString("fr-FR")}`, ...(isStacked ? segmentLabels : [])].join(", ")

            return (
              <Box
                key={item.label}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  "&:hover .bar-tooltip, &:focus-within .bar-tooltip": { display: "block" },
                }}
              >
                {valueLabel || item.annotation ? (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: `calc(${heightPercent}% + 4px)`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.annotation ? (
                      <Typography component="span" sx={{ display: "block", fontSize: "14px", fontWeight: 700, color: fr.colors.decisions.text.title.grey.default }}>
                        {item.annotation}
                      </Typography>
                    ) : null}
                    {valueLabel ? (
                      <Typography
                        component="span"
                        sx={{
                          display: { xs: item.highlighted ? "block" : "none", md: "block" },
                          fontSize: { xs: "10px", md: "12px" },
                          fontWeight: item.highlighted ? 700 : 400,
                          color: fr.colors.decisions.text.default.grey.default,
                        }}
                      >
                        {valueLabel}
                      </Typography>
                    ) : null}
                  </Box>
                ) : null}

                <div
                  role="img"
                  tabIndex={0}
                  aria-label={barLabel}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    maxWidth: isStacked ? "48px" : "40px",
                    height: `${heightPercent}%`,
                    minHeight: total > 0 ? "3px" : 0,
                    display: "flex",
                    flexDirection: "column-reverse",
                    gap: "2px",
                    borderRadius: "4px 4px 0 0",
                    overflow: "hidden",
                  }}
                >
                  {item.segments
                    .filter((segment) => segment.value > 0)
                    .map((segment) => {
                      const segmentHeight = total > 0 ? (segment.value / total) * barHeight : 0
                      const isMuted = hasHighlight && !isStacked && !item.highlighted
                      return (
                        <Box
                          key={segment.label}
                          sx={{
                            height: `${total > 0 ? (segment.value / total) * 100 : 0}%`,
                            minHeight: "2px",
                            backgroundColor: isMuted ? `color-mix(in srgb, ${segment.color} 35%, ${surface})` : segment.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {segment.insideLabel && segmentHeight >= MIN_INSIDE_LABEL_HEIGHT ? (
                            <Typography
                              component="span"
                              sx={{
                                display: { xs: "none", md: "inline" },
                                fontSize: "12px",
                                fontWeight: 700,
                                color: fr.colors.decisions.text.inverted.grey.default,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {segment.insideLabel}
                            </Typography>
                          ) : null}
                        </Box>
                      )
                    })}
                </div>

                <Box
                  className="bar-tooltip"
                  sx={{
                    display: "none",
                    position: "absolute",
                    bottom: `calc(${heightPercent}% + 40px)`,
                    ...tooltipAlign,
                    zIndex: 2,
                    p: fr.spacing("2v"),
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    pointerEvents: "none",
                    backgroundColor: fr.colors.decisions.background.default.grey.default,
                    color: fr.colors.decisions.text.default.grey.default,
                    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                  aria-hidden="true"
                >
                  <Box sx={{ fontWeight: 700 }}>
                    {item.label} : {item.totalDisplay ?? total.toLocaleString("fr-FR")}
                  </Box>
                  {isStacked ? segmentLabels.map((label) => <Box key={label}>{label}</Box>) : null}
                </Box>

                <Typography
                  component="span"
                  sx={{
                    position: "absolute",
                    top: "100%",
                    mt: fr.spacing("1v"),
                    fontSize: shouldRotateLabels ? { xs: "9px", md: "11px" } : { xs: "10px", md: "12px" },
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("4v") }}>
          {legend.map((entry) => (
            <Box key={entry.label} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("2v") }}>
              <Box sx={{ width: "12px", height: "12px", backgroundColor: entry.color, borderRadius: "2px", flexShrink: 0 }} aria-hidden="true" />
              <Typography component="span" sx={{ fontSize: "13px", color: fr.colors.decisions.text.default.grey.default }}>
                {entry.label}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </ChartFrame>
  )
}
