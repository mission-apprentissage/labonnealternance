import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { ChartFrame } from "./ChartFrame"

type ShareItem = { label: string; detail: string; value: number; share: string }

const NAVY = "#000091"

// Les niveaux sont ordonnés : la teinte s'assombrit du CAP au Bac+5.
export function ShareBar({ title, caption, items }: { title: string; caption?: string; items: ShareItem[] }) {
  return (
    <ChartFrame title={title} caption={caption}>
      <Box sx={{ display: "flex", gap: "3px", height: { xs: "56px", md: "96px" } }} aria-hidden="true">
        {items.map((item, index) => {
          const strength = 30 + (index / (items.length - 1)) * 70
          return (
            <Box
              key={item.label}
              sx={{
                flex: item.value,
                minWidth: 0,
                display: "flex",
                alignItems: "flex-end",
                p: { xs: "6px", md: fr.spacing("2v") },
                backgroundColor: `color-mix(in srgb, ${NAVY} ${strength}%, #fff)`,
                color: strength >= 60 ? "#fff" : "#161616",
                fontWeight: 700,
                fontSize: { xs: "13px", md: "22px" },
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {item.share}
            </Box>
          )
        })}
      </Box>
      <Box component="dl" sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: fr.spacing("2v"), md: "3px" }, m: 0, mt: fr.spacing("3v"), p: 0 }}>
        {items.map((item) => (
          <Box key={item.label} sx={{ flex: { md: item.value }, minWidth: 0, pr: { md: fr.spacing("1v") } }}>
            <Typography component="dt" sx={{ p: 0, fontWeight: 700, fontSize: "15px", color: fr.colors.decisions.text.title.grey.default }}>
              {item.label}
            </Typography>
            <Typography component="dd" sx={{ m: 0, p: 0, fontSize: "13px", lineHeight: "18px", color: fr.colors.decisions.text.mention.grey.default }}>
              {item.detail}
            </Typography>
          </Box>
        ))}
      </Box>
    </ChartFrame>
  )
}
