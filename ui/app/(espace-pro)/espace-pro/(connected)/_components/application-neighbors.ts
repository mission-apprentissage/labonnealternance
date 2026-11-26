/** Candidatures voisines dans la liste de l'offre, `null` quand la candidature n'y figure pas. */
export const getNeighborApplicationIds = (applications: { _id?: string }[], applicationId: string) => {
  const index = applications.findIndex(({ _id }) => _id === applicationId)
  if (index === -1) return null
  return { previous: applications[index - 1]?._id || null, next: applications[index + 1]?._id || null }
}
