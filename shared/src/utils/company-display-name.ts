type WorkplaceNameFields = {
  workplace_name?: string | null
  workplace_brand?: string | null
  workplace_legal_name?: string | null
}

type JobCompanyNameFields = WorkplaceNameFields & {
  is_delegated?: boolean | null
  cfa_legal_name?: string | null
}

/**
 * Nom de l'entreprise tel qu'affiché sur l'offre, repris par les emails de candidature (#5944).
 * `||` et non `??` : workplace_name peut valoir "" (cf. formatTextFieldsJobsPartners).
 */
export function getWorkplaceDisplayName({ workplace_name, workplace_brand, workplace_legal_name }: WorkplaceNameFields): string | null {
  return workplace_name || workplace_brand || workplace_legal_name || null
}

/** Pour une offre déléguée, l'offre affiche le CFA mandataire (cf. getWorkplaceDisplayName). */
export function getJobCompanyDisplayName(job: JobCompanyNameFields): string | null {
  return job.is_delegated ? job.cfa_legal_name || null : getWorkplaceDisplayName(job)
}
