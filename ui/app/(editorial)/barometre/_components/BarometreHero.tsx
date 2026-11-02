import { Box, Typography } from "@mui/material"

import DefaultContainer from "@/app/_components/Layout/DefaultContainer"

const NAVY = "#000091"
const WHITE = "#fff"
const PLOT_HEIGHT = { xs: 190, md: 300 }

export type HeroBar = { label: string; shortLabel: string; value: number; display: string; note?: string; highlighted?: boolean; showValue?: boolean }

// Le bandeau garde ses couleurs en thème sombre : c'est un aplat de marque, pas une surface de lecture.
export function BarometreHero({ title, published, bars, chartLabel }: { title: string; published: string; bars: HeroBar[]; chartLabel: string }) {
  const max = Math.max(...bars.map((bar) => bar.value))

  return (
    <Box sx={{ backgroundColor: NAVY, color: WHITE, overflow: "hidden" }}>
      <DefaultContainer>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 5fr) minmax(0, 7fr)" },
            columnGap: 8,
            rowGap: 5,
            alignItems: "end",
            pt: { xs: 5, md: 8 },
            pb: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ pb: { md: 6 }, alignSelf: "center" }}>
            <Typography component="p" sx={{ fontSize: "14px", color: WHITE, mb: 2 }}>
              {published}
            </Typography>
            <Typography component="h1" sx={{ color: WHITE, fontWeight: 700, fontSize: { xs: "32px", md: "44px" }, lineHeight: { xs: "40px", md: "52px" }, m: 0 }}>
              {title}
            </Typography>
          </Box>

          <Box
            role="img"
            aria-label={chartLabel}
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: { xs: "6px", md: "12px" },
              height: { xs: `${PLOT_HEIGHT.xs + 88}px`, md: `${PLOT_HEIGHT.md + 110}px` },
              "@keyframes barometreBarGrow": { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
            }}
          >
            {bars.map((bar, index) => (
              <Box key={bar.label} sx={{ flex: 1, minWidth: 0, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                {bar.highlighted || bar.showValue ? (
                  <Box
                    sx={{
                      position: "absolute",
                      right: 0,
                      bottom: { xs: `${(bar.value / max) * PLOT_HEIGHT.xs + 32}px`, md: `${(bar.value / max) * PLOT_HEIGHT.md + 34}px` },
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{ display: "block", color: WHITE, fontWeight: 700, lineHeight: 1.1, fontSize: bar.highlighted ? { xs: "26px", md: "40px" } : { xs: "13px", md: "16px" } }}
                    >
                      {bar.display}
                    </Typography>
                    {bar.note ? (
                      <Typography component="span" sx={{ display: "block", color: WHITE, fontSize: { xs: "13px", md: "15px" }, lineHeight: 1.3 }}>
                        {bar.note}
                      </Typography>
                    ) : null}
                  </Box>
                ) : null}
                <Box
                  sx={{
                    height: { xs: `${(bar.value / max) * PLOT_HEIGHT.xs}px`, md: `${(bar.value / max) * PLOT_HEIGHT.md}px` },
                    backgroundColor: bar.highlighted ? WHITE : "rgba(255, 255, 255, 0.32)",
                    borderRadius: "4px 4px 0 0",
                    transformOrigin: "bottom",
                    animation: `barometreBarGrow 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 60}ms both`,
                    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    borderTop: `1px solid ${WHITE}`,
                    pt: "6px",
                    color: WHITE,
                    textAlign: "center",
                    fontSize: { xs: "11px", md: "13px" },
                    lineHeight: "16px",
                    fontWeight: bar.highlighted ? 700 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                    {bar.label}
                  </Box>
                  <Box component="span" sx={{ display: { xs: "inline", md: "none" } }}>
                    {bar.shortLabel}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
