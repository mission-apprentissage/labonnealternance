import { Select } from "@chakra-ui/react"
import { OPCOS_LABEL } from "shared/constants/index"

export const OpcoSelect = ({ name, onChange, value }) => {
  return (
    <Select variant="outline" size="md" name={name} mr={3} onChange={(e) => onChange?.(e.target.value)} value={value}>
      <option value={OPCOS_LABEL.UNKNOWN_OPCO} hidden>
        Sélectionnez un OPCO
      </option>
      <option value={OPCOS_LABEL.AFDAS}>AFDAS</option>
      <option value={OPCOS_LABEL.AKTO}>AKTO</option>
      <option value={OPCOS_LABEL.ATLAS}>ATLAS</option>
      <option value={OPCOS_LABEL.CONSTRUCTYS}>Constructys</option>
      <option value={OPCOS_LABEL.OPCOMMERCE}>L'Opcommerce</option>
      <option value={OPCOS_LABEL.OCAPIAT}>OCAPIAT</option>
      <option value={OPCOS_LABEL.OPCO2I}>Opco 2i</option>
      <option value={OPCOS_LABEL.EP}>Opco EP</option>
      <option value={OPCOS_LABEL.MOBILITE}>Opco Mobilités</option>
      <option value={OPCOS_LABEL.SANTE}>Opco Santé</option>
      <option value={OPCOS_LABEL.UNIFORMATION}>Uniformation</option>
      <option value={OPCOS_LABEL.UNKNOWN_OPCO}>Je ne sais pas</option>
    </Select>
  )
}
