import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { ChartFrame } from "./ChartFrame"

export type CompositionSeries = { key: string; label: string; color: string; textColor: string }
export type CompositionRow = { label: string; total: string; segments: Record<string, number> }

const MIN_LABELLED_SHARE = 8

export function CompositionBars({ title, caption, series, rows, note }: { title: string; caption?: string; series: CompositionSeries[]; rows: CompositionRow[]; note?: string }) {
  return (
    <ChartFrame title={title} caption={caption}>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), rowGap: fr.spacing("1v"), mb: fr.spacing("5v") }}>
        {series.map((entry) => (
          <Box key={entry.key} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("2v") }}>
            <Box sx={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} aria-hidden="true" />
            <Typography component="span" sx={{ fontSize: "13px", color: fr.colors.decisions.text.default.grey.default }}>
              {entry.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box component="dl" sx={{ m: 0, p: 0, display: "flex", flexDirection: "column", gap: fr.spacing("5v") }}>
        {rows.map((row) => {
          const visible = series.filter((entry) => (row.segments[entry.key] ?? 0) > 0)
          return (
            <Box key={row.label}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: fr.spacing("3v"), flexWrap: "wrap", mb: fr.spacing("1v") }}>
                <Typography component="dt" sx={{ p: 0, fontWeight: 700, fontSize: "15px", color: fr.colors.decisions.text.title.grey.default }}>
                  {row.label}
                </Typography>
                <Typography component="span" sx={{ fontSize: "13px", color: fr.colors.decisions.text.mention.grey.default, fontVariantNumeric: "tabular-nums" }}>
                  {row.total}
                </Typography>
              </Box>
              <Box component="dd" sx={{ m: 0, p: 0 }}>
                <Box component="span" sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                  {visible.map((entry) => `${entry.label} : ${row.segments[entry.key]} %`).join(", ")}
                </Box>
                <Box sx={{ display: "flex", gap: "2px", height: "32px" }} aria-hidden="true">
                  {visible.map((entry) => {
                    const share = row.segments[entry.key]
                    return (
                      <Box
                        key={entry.key}
                        sx={{
                          flex: share,
                          minWidth: "3px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: entry.color,
                          color: entry.textColor,
                          fontSize: "13px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        }}
                      >
                        {share >= MIN_LABELLED_SHARE ? `${share} %` : null}
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>
          )
        })}
      </Box>

      {note ? (
        <Typography component="p" sx={{ mt: fr.spacing("4v"), mb: 0, fontSize: "13px", color: fr.colors.decisions.text.mention.grey.default }}>
          {note}
        </Typography>
      ) : null}
    </ChartFrame>
  )
}
