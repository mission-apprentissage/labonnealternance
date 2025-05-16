"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, CircularProgress } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import type { ProcessorStatusJson } from "job-processor/dist/react"

import { apiGet } from "@/utils/api.utils"

type ProcessorStatusProviderProps = {
  children: (status: ProcessorStatusJson) => React.ReactNode
}

export function ProcessorStatusProvider(props: ProcessorStatusProviderProps): React.ReactNode {
  const result = useQuery({
    queryKey: ["/_private/admin/processor"],
    queryFn: async () => {
      const data = await apiGet("/_private/admin/processor", {})

      return data
    },
  })

  if (result.isError) {
    throw result.error
  }

  if (result.isPending) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          my: fr.spacing("8w"),
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return props.children(result.data)
}
