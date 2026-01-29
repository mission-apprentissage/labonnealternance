"use client"
import { Box, Typography } from "@mui/material"
import { ProcessorStatusTaskComponent } from "job-processor/dist/react"
import { use } from "react"

import { ProcessorStatusProvider } from "@/app/(espace-pro)/espace-pro/(connected)/administration/processeur/components/ProcessorStatusProvider"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

export default function JobInstancePage({ params }: { params: Promise<{ name: string; id: string }> }) {
  const { name: rawName, id: rawId } = use(params)
  const name = decodeURIComponent(rawName)
  const id = decodeURIComponent(rawId)

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.adminProcessor, PAGES.dynamic.adminProcessorJob(name), PAGES.dynamic.adminProcessorJobInstance({ name, id })]} />
      <Typography variant="h2" gutterBottom>
        {PAGES.dynamic.adminProcessorJobInstance({ name, id }).title}
      </Typography>
      <ProcessorStatusProvider>
        {(status) => (
          <ProcessorStatusTaskComponent name={name} status={status} baseUrl={new URL(PAGES.static.adminProcessor.getPath(), publicConfig.baseUrl).href} id={id} type="job" />
        )}
      </ProcessorStatusProvider>
    </Box>
  )
}
