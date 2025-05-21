"use client"
import { Box, Typography } from "@mui/material"
import { ProcessorStatusIndexComponent } from "job-processor/dist/react"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

import { ProcessorStatusProvider } from "./components/ProcessorStatusProvider"

export default function AdminProcessorPage() {
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.adminProcessor]} />
      <Typography variant="h2" gutterBottom>
        {PAGES.static.adminProcessor.title}
      </Typography>
      <ProcessorStatusProvider>
        {(status) => <ProcessorStatusIndexComponent status={status} baseUrl={new URL(PAGES.static.adminProcessor.getPath(), publicConfig.baseUrl).href} />}
      </ProcessorStatusProvider>
    </Box>
  )
}
