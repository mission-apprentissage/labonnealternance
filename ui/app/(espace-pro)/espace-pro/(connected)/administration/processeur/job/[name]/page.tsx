"use client"
import { Box, Typography } from "@mui/material"
import { ProcessorStatusJobComponent } from "job-processor/dist/react"
import { use } from "react"

import { ProcessorStatusProvider } from "@/app/(espace-pro)/espace-pro/(connected)/administration/processeur/components/ProcessorStatusProvider"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

export default function JobTypePage({ params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = use(params)
  const name = decodeURIComponent(rawName)
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.adminProcessor, PAGES.dynamic.adminProcessorJob(name)]} />
      <Typography variant="h2" gutterBottom>
        {PAGES.dynamic.adminProcessorJob(name).title}
      </Typography>
      <ProcessorStatusProvider>
        {(status) => <ProcessorStatusJobComponent name={name} status={status} baseUrl={new URL(PAGES.static.adminProcessor.getPath(), publicConfig.baseUrl).href} />}
      </ProcessorStatusProvider>
    </Box>
  )
}
