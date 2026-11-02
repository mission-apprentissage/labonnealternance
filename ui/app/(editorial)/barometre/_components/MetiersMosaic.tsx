import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { ChartFrame } from "./ChartFrame"

type MosaicItem = { label: string; value: number; displayValue: string }

const NAVY = "#000091"
const ROW_HEIGHT = 420

// Découpage en lignes : chaque tuile a une surface proportionnelle à sa valeur.
const ROWS = [3, 3, 4]

export function MetiersMosaic({ title, caption, items }: { title: string; caption?: string; items: MosaicItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const rows: MosaicItem[][] = []
  let start = 0
  for (const size of ROWS) {
    rows.push(items.slice(start, start + size))
    start += size
  }

  return (
    <ChartFrame title={title} caption={caption}>
      <Box component="ol" sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", gap: "3px", listStyle: "none", m: 0, p: 0 }}>
        {rows.map((row) => {
          const rowTotal = row.reduce((sum, item) => sum + item.value, 0)
          return (
            <Box key={row[0].label} sx={{ display: "flex", gap: "3px", height: `${(rowTotal / total) * ROW_HEIGHT}px` }}>
              {row.map((item) => {
                const strength = Math.round(35 + (item.value / items[0].value) * 65)
                return (
                  <Box
                    component="li"
                    key={item.label}
                    sx={{
                      flex: item.value,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      "&&": { p: fr.spacing("3v") },
                      backgroundColor: `color-mix(in srgb, ${NAVY} ${strength}%, #fff)`,
                      color: "#fff",
                      overflow: "hidden",
                    }}
                  >
                    <Box component="span" sx={{ fontSize: "14px", lineHeight: "18px" }}>
                      {item.label}
                    </Box>
                    <Box component="span" sx={{ fontWeight: 700, fontSize: `${Math.round(16 + (item.value / items[0].value) * 12)}px`, lineHeight: 1.1 }}>
                      {item.displayValue}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )
        })}
      </Box>

      <Box component="ol" sx={{ display: { xs: "block", md: "none" }, m: 0, p: 0, pl: fr.spacing("5v") }}>
        {items.map((item) => (
          <li key={item.label}>
            <Typography component="span" sx={{ fontSize: "15px" }}>
              {item.label}&nbsp;:{" "}
            </Typography>
            <Typography component="span" sx={{ fontSize: "15px", fontWeight: 700 }}>
              {item.displayValue}
            </Typography>
          </li>
        ))}
      </Box>
    </ChartFrame>
  )
}
