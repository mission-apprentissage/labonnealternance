import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { CSSProperties } from "react"

export const customTagColors = {
  pink: {
    backgroundColor: "#FEE7FC",
    color: "#6E445A",
  },
  darkBlue: {
    color: fr.colors.decisions.background.actionHigh.blueCumulus.default,
    background: fr.colors.decisions.background.contrast.blueCumulus.default,
  },
  green: {
    color: fr.colors.decisions.background.actionHigh.greenEmeraude.default,
    background: fr.colors.decisions.background.contrast.greenEmeraude.default,
  },
  yellow: {
    color: "#716043",
    background: "#FEECC2",
  },
} satisfies Record<string, CSSProperties>

export type CustomTagColor = keyof typeof customTagColors

export function CustomTag({ children, icon, color }: { children: React.ReactNode; icon?: React.ReactNode; color: CustomTagColor }) {
  return (
    <span
      style={{
        verticalAlign: "middle",
        display: "inline-block",
        fontSize: "12px",
        lineHeight: "20px",
        paddingRight: "6px",
        paddingLeft: icon ? "4px" : "6px",
        borderRadius: "4px",
        maxHeight: "20px",
        fontWeight: 700,
        ...customTagColors[color],
      }}
    >
      <Box sx={{ display: "flex", gap: "5px", alignItems: "center" }}>
        {icon}
        {children}
      </Box>
    </span>
  )
}
