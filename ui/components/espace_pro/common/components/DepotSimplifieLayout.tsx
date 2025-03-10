import { Box } from "@chakra-ui/react"
import React from "react"

import Layout from "../../Layout"

export const DepotSimplifieLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout header={false} displayNavigationMenu={false}>
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Layout>
  )
}

export const DepotSimplifieStyling = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      p: {
        fontSize: ["12px", "12px", "12px", "16px"],
        lineHeight: ["20px", "20px", "20px", "24px"],
      },
      "p.big": {
        fontSize: ["12px", "12px", "12px", "20px"],
        lineHeight: ["20px", "20px", "20px", "32px"],
      },
      h2: {
        fontSize: ["16px", "16px", "16px", "24px"],
        lineHeight: ["24px", "24px", "24px", "32px"],
      },
      "h2.big": {
        fontSize: ["18px", "20px", "20px", "32px"],
        lineHeight: ["28px", "32px", "32px", "40px"],
      },
      ul: {
        mx: 0,
        li: {
          fontSize: ["12px", "12px", "12px", "16px"],
          lineHeight: ["20px", "20px", "20px", "24px"],
          mx: 10,
          mb: 5,
        },
      },
    }}
  >
    {children}
  </Box>
)
