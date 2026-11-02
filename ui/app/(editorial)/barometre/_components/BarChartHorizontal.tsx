"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"

import { ChartFrame } from "./ChartFrame"

export type BarChartHorizontalItem = {
  label: ReactNode
  detail?: string
  value: number
  displayValue?: string
}

type Tone = "info" | "success" | "contrast"

const toneToColor: Record<Tone, string> = {
  info: fr.colors.decisions.background.actionHigh.blueFrance.default,
  success: fr.colors.decisions.background.actionHigh.greenBourgeon.default,
  contrast: fr.colors.decisions.background.actionHigh.orangeTerreBattue.default,
}

export function BarChartHorizontal({
  title,
  caption,
  items,
  tone = "info",
  source,
  maxValue,
}: {
  title: ReactNode
  caption?: string
  items: BarChartHorizontalItem[]
  tone?: Tone
  source?: string
  /** Borne commune quand deux graphiques côte à côte doivent rester comparables. */
  maxValue?: number
}) {
  const max = maxValue ?? (items.length > 0 ? Math.max(...items.map((item) => item.value)) : 0)
  const color = toneToColor[tone]

  return (
    <ChartFrame title={title} caption={caption} source={source}>
      <Box component="dl" sx={{ m: 0, p: 0, display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
        {items.map((item, index) => {
          const percent = max > 0 ? (item.value / max) * 100 : 0
          return (
            <Box key={index} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gridTemplateRows: "auto auto", columnGap: fr.spacing("3v") }}>
              <Typography
                component="dt"
                sx={{ p: 0, gridColumn: 1, gridRow: 1, fontSize: "15px", lineHeight: 1.35, color: fr.colors.decisions.text.default.grey.default, fontWeight: 400 }}
              >
                {item.label}
                {item.detail ? (
                  <Typography component="span" sx={{ display: "block", fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default, fontWeight: 400 }}>
                    {item.detail}
                  </Typography>
                ) : null}
              </Typography>
              <Box component="dd" sx={{ gridColumn: "1 / -1", gridRow: "1 / -1", display: "grid", gridTemplateColumns: "subgrid", gridTemplateRows: "subgrid", m: 0, p: 0 }}>
                <Typography
                  component="span"
                  sx={{
                    gridColumn: 2,
                    gridRow: 1,
                    fontSize: "14px",
                    fontWeight: 700,
                    lineHeight: 1.35,
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                    color: fr.colors.decisions.text.title.grey.default,
                  }}
                >
                  {item.displayValue ?? item.value.toLocaleString("fr-FR")}
                </Typography>
                <Box sx={{ gridColumn: "1 / -1", gridRow: 2, mt: fr.spacing("1v"), height: "14px" }} aria-hidden="true">
                  <Box
                    sx={{
                      width: `${percent}%`,
                      height: "100%",
                      minWidth: "3px",
                      backgroundColor: index === 0 ? color : `color-mix(in srgb, ${color} 62%, ${fr.colors.decisions.background.default.grey.default})`,
                      borderRadius: "0 4px 4px 0",
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )
        })}
      </Box>
    </ChartFrame>
  )
}
