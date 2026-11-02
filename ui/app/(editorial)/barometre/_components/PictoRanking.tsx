import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { ChartFrame } from "./ChartFrame"

type PictoItem = { label: string; detail: string; value: number; displayValue: string }
type PictoGroup = { title: string; color: string; items: PictoItem[] }

const CELLS = 20

function Cells({ value, color }: { value: number; color: string }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${CELLS}, minmax(0, 1fr))`, gap: "3px" }} aria-hidden="true">
      {Array.from({ length: CELLS }, (_, index) => {
        const fill = Math.min(Math.max(value - index, 0), 1)
        return (
          <Box
            key={index}
            sx={{ aspectRatio: "1", maxHeight: "24px", borderRadius: "2px", backgroundColor: fr.colors.decisions.background.contrast.grey.default, overflow: "hidden" }}
          >
            <Box sx={{ width: `${fill * 100}%`, height: "100%", backgroundColor: color }} />
          </Box>
        )
      })}
    </Box>
  )
}

export function PictoRanking({ title, caption, groups }: { title: string; caption?: string; groups: PictoGroup[] }) {
  return (
    <ChartFrame title={title} caption={caption}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("8v") }}>
        {groups.map((group) => (
          <Box key={group.title}>
            <Typography component="p" sx={{ fontWeight: 700, mb: fr.spacing("3v"), color: fr.colors.decisions.text.title.grey.default }}>
              {group.title}
            </Typography>
            <Box component="dl" sx={{ m: 0, p: 0, display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
              {group.items.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 5fr) minmax(0, 7fr)" },
                    columnGap: fr.spacing("6v"),
                    rowGap: fr.spacing("1v"),
                    alignItems: "center",
                  }}
                >
                  <Typography component="dt" sx={{ p: 0, fontSize: "15px", lineHeight: 1.3, fontWeight: 400, color: fr.colors.decisions.text.default.grey.default }}>
                    {item.label}
                    <Typography component="span" sx={{ display: "block", fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
                      {item.detail}
                    </Typography>
                  </Typography>
                  <Box component="dd" sx={{ m: 0, p: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 3.2em", alignItems: "center", columnGap: fr.spacing("2v") }}>
                    <Cells value={item.value} color={group.color} />
                    <Typography
                      component="span"
                      sx={{ fontWeight: 700, fontSize: "18px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: fr.colors.decisions.text.title.grey.default }}
                    >
                      {item.displayValue}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </ChartFrame>
  )
}
