"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useState } from "react"

import { FRANCE_REGIONS, FRANCE_VIEWBOX, type FranceRegionName } from "../_data/france-regions"
import { ChartFrame } from "./ChartFrame"

export type RegionValue = { name: FranceRegionName; share: number; displayValue: string }

// Mêmes classes pour toutes les cartes, pour que deux cartes restent comparables entre elles.
const CLASSES = [
  { min: 20, label: "20 % et plus", fill: fr.colors.options.blueFrance.sun113_625.default, text: fr.colors.decisions.text.inverted.grey.default },
  { min: 8, label: "De 8 à 20 %", fill: fr.colors.options.blueFrance.main525.default, text: fr.colors.decisions.text.inverted.grey.default },
  { min: 5, label: "De 5 à 8 %", fill: fr.colors.options.blueFrance._850_200.default, text: fr.colors.decisions.text.title.grey.default },
  { min: 0, label: "Moins de 1 %", fill: fr.colors.options.blueFrance._925_125.default, text: fr.colors.decisions.text.title.grey.default },
]
const OTHER_FILL = fr.colors.decisions.border.default.grey.default

const OVERSEAS_LABELS: Partial<Record<FranceRegionName, { x: number; label: string }>> = {
  Guadeloupe: { x: 17, label: "Guad" },
  Martinique: { x: 82, label: "Mart" },
  Guyane: { x: 147, label: "Guyane" },
  "La Réunion": { x: 212, label: "Réunion" },
  Mayotte: { x: 280, label: "Mayotte" },
}

const getClass = (share: number) => CLASSES.find((entry) => share >= entry.min) ?? CLASSES[CLASSES.length - 1]

function RankedList({ title, regions, active, onActive }: { title: string; regions: RegionValue[]; active: string | null; onActive: (name: string | null) => void }) {
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
            <Box sx={{ width: "10px", height: "10px", borderRadius: "2px", flexShrink: 0, backgroundColor: getClass(region.share).fill }} aria-hidden="true" />
            <Typography component="dt" sx={{ p: 0, flex: 1, minWidth: 0, fontSize: "14px", lineHeight: 1.3, color: fr.colors.decisions.text.default.grey.default }}>
              {region.name}
            </Typography>
            <Typography
              component="dd"
              sx={{
                m: 0,
                p: 0,
                fontSize: "14px",
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
  top,
  flop,
  otherLabel,
}: {
  title: string
  caption?: string
  /** Résumé textuel de la carte pour les lecteurs d'écran. */
  mapLabel: string
  top: RegionValue[]
  flop: RegionValue[]
  otherLabel: string
}) {
  const [active, setActive] = useState<string | null>(null)
  const values = new Map([...top, ...flop].map((region) => [region.name as string, region]))
  const topNames = new Set<string>(top.map((region) => region.name))
  const activeRegion = FRANCE_REGIONS.find((region) => region.name === active)
  const activeValue = active ? values.get(active) : undefined

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
                  fill={value ? getClass(value.share).fill : OTHER_FILL}
                  stroke={active === region.name ? fr.colors.decisions.text.title.grey.default : fr.colors.decisions.background.default.grey.default}
                  strokeWidth={active === region.name ? 2 : 1.5}
                  strokeLinejoin="round"
                  onPointerEnter={() => setActive(region.name)}
                  onPointerLeave={() => setActive(null)}
                />
              )
            })}
            {FRANCE_REGIONS.filter((region) => topNames.has(region.name)).map((region) => {
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
                  fill={getClass(value.share).text}
                  pointerEvents="none"
                  aria-hidden="true"
                >
                  {value.share.toLocaleString("fr-FR")} %
                </text>
              )
            })}
            {Object.values(OVERSEAS_LABELS).map(({ x, label }) => (
              <text key={label} x={x} y={FRANCE_VIEWBOX.height - 2} textAnchor="middle" fontSize={15} fill={fr.colors.decisions.text.mention.grey.default} aria-hidden="true">
                {label}
              </text>
            ))}
          </svg>
          {activeRegion ? (
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
              <Box sx={{ fontWeight: 700 }}>{activeRegion.name}</Box>
              {activeValue?.displayValue ?? otherLabel}
            </Box>
          ) : null}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
          <RankedList title="Les 5 premières régions" regions={top} active={active} onActive={setActive} />
          <RankedList title="Les 5 dernières régions" regions={flop} active={active} onActive={setActive} />
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), rowGap: fr.spacing("1v"), mt: fr.spacing("4v") }}>
        {CLASSES.map((entry) => (
          <Box key={entry.label} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
            <Box sx={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: entry.fill }} aria-hidden="true" />
            <Typography component="span" sx={{ fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
              {entry.label}
            </Typography>
          </Box>
        ))}
        <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
          <Box sx={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: OTHER_FILL }} aria-hidden="true" />
          <Typography component="span" sx={{ fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
            {otherLabel}
          </Typography>
        </Box>
      </Box>
    </ChartFrame>
  )
}
