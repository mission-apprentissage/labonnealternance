import { Select } from "@chakra-ui/react"

export const OpcoSelect = ({ name, onChange, value }) => {
  return (
    <Select variant="outline" size="md" name={name} mr={3} onChange={(e) => onChange?.(e.target.value)} value={value}>
      <option hidden>Sélectionnez un OPCO</option>
      <option value="AFDAS">AFDAS</option>
      <option value="AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre">AKTO</option>
      <option value="ATLAS">ATLAS</option>
      <option value="Constructys">Constructys</option>
      <option value="L'Opcommerce">L'Opcommerce</option>
      <option value="OCAPIAT">OCAPIAT</option>
      <option value="OPCO 2i">Opco 2i</option>
      <option value="Opco entreprises de proximité">Opco EP</option>
      <option value="Opco Mobilités">Opco Mobilités</option>
      <option value="Opco Santé">Opco Santé</option>
      <option value="Uniformation, l'Opco de la Cohésion sociale">Uniformation</option>
      <option value="inconnu">Je ne sais pas</option>
    </Select>
  )
}
