"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useState } from "react"

import { FRANCE_REGIONS, FRANCE_VIEWBOX, type FranceRegionName } from "../_data/france-regions"
import { ChartFrame } from "./ChartFrame"

export type RegionValue = { name: FranceRegionName; value: number; displayValue: string; detail?: string }
type RegionClass = { min: number; label: string }

// Rampe d'une seule teinte, du plus foncé (valeurs hautes) au plus clair.
const FILLS = [
  { fill: fr.colors.options.blueFrance.sun113_625.default, text: fr.colors.decisions.text.inverted.grey.default },
  { fill: fr.colors.options.blueFrance.main525.default, text: "#fff" },
  { fill: fr.colors.options.blueFrance._850_200.default, text: fr.colors.decisions.text.title.grey.default },
  { fill: fr.colors.options.blueFrance._925_125.default, text: fr.colors.decisions.text.title.grey.default },
  { fill: fr.colors.options.blueFrance._950_100.default, text: fr.colors.decisions.text.title.grey.default },
]
const MISSING_FILL = fr.colors.decisions.border.default.grey.default

const OVERSEAS_LABELS: Partial<Record<FranceRegionName, { x: number; label: string }>> = {
  Guadeloupe: { x: 17, label: "Guad" },
  Martinique: { x: 82, label: "Mart" },
  Guyane: { x: 147, label: "Guyane" },
  "La Réunion": { x: 212, label: "Réunion" },
  Mayotte: { x: 280, label: "Mayotte" },
}

function RankedList({
  title,
  regions,
  active,
  onActive,
  styleOf,
}: {
  title: string
  regions: RegionValue[]
  active: string | null
  onActive: (name: string | null) => void
  styleOf: (value: number) => { fill: string }
}) {
  return (
    <Box>
      <Typography component="p" sx={{ fontSize: "13px", fontWeight: 700, color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("1v") }}>
        {title}
      </Typography>
      <Box component="dl" sx={{ m: 0, p: 0 }}>
        {regions.map((region) => (
          <Box
            key={region.name}
            onPointerEnter={() => onActive(region.name)}
            onPointerLeave={() => onActive(null)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: fr.spacing("2v"),
              py: "5px",
              borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
              backgroundColor: active === region.name ? fr.colors.decisions.background.contrast.grey.default : "transparent",
            }}
          >
            <Box sx={{ width: "10px", height: "10px", borderRadius: "2px", flexShrink: 0, backgroundColor: styleOf(region.value).fill }} aria-hidden="true" />
            <Typography component="dt" sx={{ p: 0, flex: 1, minWidth: 0, fontSize: "14px", lineHeight: 1.3, color: fr.colors.decisions.text.default.grey.default }}>
              {region.name}
              {region.detail ? (
                <Typography component="span" sx={{ display: "block", fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
                  {region.detail}
                </Typography>
              ) : null}
            </Typography>
            <Typography
              component="dd"
              sx={{
                m: 0,
                p: 0,
                fontSize: "15px",
                lineHeight: 1.3,
                fontWeight: 700,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                color: fr.colors.decisions.text.title.grey.default,
              }}
            >
              {region.displayValue}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export function RegionsMap({
  title,
  caption,
  mapLabel,
  regions,
  classes,
  topTitle,
  flopTitle,
  note,
}: {
  title: string
  caption?: string
  /** Résumé textuel de la carte pour les lecteurs d'écran. */
  mapLabel: string
  regions: RegionValue[]
  /** Classes triées par seuil décroissant, cinq au plus. */
  classes: RegionClass[]
  topTitle: string
  flopTitle: string
  note?: string
}) {
  const [active, setActive] = useState<string | null>(null)
  const values = new Map(regions.map((region) => [region.name as string, region]))
  const sorted = [...regions].sort((a, b) => b.value - a.value)
  const styleOf = (value: number) =>
    FILLS[
      Math.max(
        classes.findIndex((entry) => value >= entry.min),
        0
      )
    ] ?? FILLS[FILLS.length - 1]
  const activeRegion = FRANCE_REGIONS.find((region) => region.name === active)
  const activeValue = active ? values.get(active) : undefined
  const isOverseas = (name: string) => name in OVERSEAS_LABELS

  return (
    <ChartFrame title={title} caption={caption}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.45fr) minmax(0, 1fr)" }, gap: fr.spacing("6v"), alignItems: "start" }}>
        <Box sx={{ position: "relative", maxWidth: "540px", width: "100%", mx: "auto" }}>
          <svg viewBox={`0 0 ${FRANCE_VIEWBOX.width} ${FRANCE_VIEWBOX.height}`} role="img" aria-label={mapLabel} style={{ display: "block", width: "100%", height: "auto" }}>
            {FRANCE_REGIONS.map((region) => {
              const value = values.get(region.name)
              return (
                <path
                  key={region.name}
                  d={region.d}
                  fill={value ? styleOf(value.value).fill : MISSING_FILL}
                  stroke={active === region.name ? fr.colors.decisions.text.title.grey.default : fr.colors.options.blueFrance._850_200.default}
                  strokeWidth={active === region.name ? 2 : 1}
                  strokeLinejoin="round"
                  onPointerEnter={() => setActive(region.name)}
                  onPointerLeave={() => setActive(null)}
                />
              )
            })}
            {FRANCE_REGIONS.filter((region) => !isOverseas(region.name) && region.name !== "Corse").map((region) => {
              const value = values.get(region.name)
              if (!value) return null
              return (
                <text
                  key={region.name}
                  x={region.labelX}
                  y={region.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={19}
                  fontWeight={700}
                  fill={styleOf(value.value).text}
                  pointerEvents="none"
                  aria-hidden="true"
                >
                  {value.displayValue}
                </text>
              )
            })}
            {Object.values(OVERSEAS_LABELS).map(({ x, label }) => (
              <text key={label} x={x} y={FRANCE_VIEWBOX.height - 2} textAnchor="middle" fontSize={15} fill={fr.colors.decisions.text.mention.grey.default} aria-hidden="true">
                {label}
              </text>
            ))}
          </svg>
          {activeRegion && activeValue ? (
            <Box
              sx={{
                position: "absolute",
                left: `${(activeRegion.labelX / FRANCE_VIEWBOX.width) * 100}%`,
                top: `${(activeRegion.labelY / FRANCE_VIEWBOX.height) * 100}%`,
                transform: activeRegion.labelX > FRANCE_VIEWBOX.width / 2 ? "translate(-100%, -130%)" : "translate(0, -130%)",
                p: fr.spacing("2v"),
                borderRadius: "4px",
                fontSize: "12px",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                backgroundColor: fr.colors.decisions.background.default.grey.default,
                color: fr.colors.decisions.text.default.grey.default,
                border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
              aria-hidden="true"
            >
              <Box sx={{ fontWeight: 700 }}>
                {activeRegion.name} : {activeValue.displayValue}
              </Box>
              {activeValue.detail}
            </Box>
          ) : null}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
          <RankedList title={topTitle} regions={sorted.slice(0, 5)} active={active} onActive={setActive} styleOf={styleOf} />
          <RankedList title={flopTitle} regions={sorted.slice(-5).reverse()} active={active} onActive={setActive} styleOf={styleOf} />
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), rowGap: fr.spacing("1v"), mt: fr.spacing("4v") }}>
        {classes.map((entry, index) => (
          <Box key={entry.label} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
            <Box sx={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: FILLS[index]?.fill }} aria-hidden="true" />
            <Typography component="span" sx={{ fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
              {entry.label}
            </Typography>
          </Box>
        ))}
      </Box>
      {note ? (
        <Typography component="p" sx={{ mt: fr.spacing("3v"), mb: 0, fontSize: "13px", color: fr.colors.decisions.text.mention.grey.default }}>
          {note}
        </Typography>
      ) : null}
    </ChartFrame>
  )
}
