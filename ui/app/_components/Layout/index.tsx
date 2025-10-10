import { Box } from "@mui/material"

import { Footer } from "@/app/_components/Footer"

export default async function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ height: "100vh" }}>
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
        {children}
        <Footer isWidget={true} />
      </Box>
    </Box>
  )
}
