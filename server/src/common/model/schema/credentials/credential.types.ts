interface ICredential {
  _id: string
  nom: string
  prenom: string
  organisation: string
  scope: string
  email: string
  api_key: string
  actif: boolean
  createdAt: Date
  updatedAt: Date
}

export type { ICredential }
