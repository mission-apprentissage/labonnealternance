import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"

import DefaultContainer from "@/app/_components/Layout/DefaultContainer"

const NAVY = "#000091"
const WHITE = "#fff"
const PLOT_HEIGHT = { xs: 120, md: 190 }

export type HeroMetric = { label: string; before: number; after: number; beforeDisplay: string; afterDisplay: string; change: string }

// Le bandeau garde ses couleurs en thème sombre : c'est un aplat de marque, pas une surface de lecture.
export function BarometreHero({
  title,
  published,
  children,
  metrics,
  periodLabels,
  chartTitle,
}: {
  title: string
  published: string
  children: ReactNode
  metrics: HeroMetric[]
  periodLabels: [string, string]
  chartTitle: string
}) {
  return (
    <Box sx={{ backgroundColor: NAVY, color: WHITE }}>
      <DefaultContainer>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 6fr) minmax(0, 6fr)" },
            columnGap: 10,
            rowGap: 6,
            alignItems: "center",
            py: { xs: 5, md: 8 },
            "& p, & a": { color: WHITE },
          }}
        >
          <Box>
            <Typography component="p" sx={{ fontSize: "14px", mb: 2 }}>
              {published}
            </Typography>
            <Typography component="h1" sx={{ color: WHITE, fontWeight: 700, fontSize: { xs: "30px", md: "40px" }, lineHeight: { xs: "38px", md: "48px" }, mb: 4 }}>
              {title}
            </Typography>
            <Box sx={{ "& p": { fontSize: "17px", lineHeight: "28px", mb: 2 } }}>{children}</Box>
          </Box>

          <Box component="figure" sx={{ m: 0 }}>
            <Typography component="figcaption" sx={{ fontWeight: 700, fontSize: "16px", mb: 1, color: WHITE }}>
              {chartTitle}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3, fontSize: "13px" }} aria-hidden="true">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "2px", backgroundColor: "rgba(255, 255, 255, 0.35)" }} />
                {periodLabels[0]}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "2px", backgroundColor: WHITE }} />
                {periodLabels[1]}
              </Box>
            </Box>
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: { xs: 2, md: 4 } }}>
              {metrics.map((metric) => (
                <Box component="li" key={metric.label} sx={{ "&&": { p: 0 } }}>
                  <Typography component="span" sx={{ display: "block", fontWeight: 700, fontSize: { xs: "20px", md: "30px" }, lineHeight: 1.1, color: WHITE }}>
                    {metric.change}
                  </Typography>
                  <Typography component="span" sx={{ display: "block", fontSize: "13px", mb: 2, color: WHITE }}>
                    {metric.label}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "6px",
                      height: { xs: `${PLOT_HEIGHT.xs}px`, md: `${PLOT_HEIGHT.md}px` },
                      borderBottom: `1px solid ${WHITE}`,
                      "@keyframes barometreBarGrow": { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
                    }}
                    aria-hidden="true"
                  >
                    {[
                      { value: metric.before, fill: "rgba(255, 255, 255, 0.35)" },
                      { value: metric.after, fill: WHITE },
                    ].map((bar, index) => (
                      <Box
                        key={index}
                        sx={{
                          flex: 1,
                          height: `${(bar.value / metric.after) * 100}%`,
                          backgroundColor: bar.fill,
                          borderRadius: "4px 4px 0 0",
                          transformOrigin: "bottom",
                          animation: `barometreBarGrow 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 120}ms both`,
                          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                        }}
                      />
                    ))}
                  </Box>
                  <Box
                    sx={{ display: "flex", gap: "6px", mt: 1, fontSize: { xs: "10px", md: "13px" }, lineHeight: 1.4, color: WHITE, textAlign: "center", whiteSpace: "nowrap" }}
                    aria-hidden="true"
                  >
                    <Box component="span" sx={{ flex: 1 }}>
                      {metric.beforeDisplay}
                    </Box>
                    <Box component="span" sx={{ flex: 1, fontWeight: 700 }}>
                      {metric.afterDisplay}
                    </Box>
                  </Box>
                  <Box component="span" sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    {`${metric.label} : ${metric.beforeDisplay} en ${periodLabels[0]}, ${metric.afterDisplay} en ${periodLabels[1]}, soit ${metric.change}.`}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
