interface ISiretDiffusibleStatus {
  siret: string
  status_diffusion: "diffusible" | "partiellement_diffusible" | "non_diffusible" | "not_found" | "unavailable"
  created_at: Date
  last_update_at: Date
}

export type { ISiretDiffusibleStatus }
