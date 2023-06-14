export interface ISuggestionMetiersDavenir {
  suggestionsMetiersDavenir?: IMetierDavenir[]
  error?: string
}

export interface IMetierDavenir {
  codeROME: string
  title: string
}
