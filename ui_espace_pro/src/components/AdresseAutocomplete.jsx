import { useState } from "react"
import { useCombobox } from "downshift"

import { Input, Box } from "@chakra-ui/react"

/**
 * @description Address autocomplete input.
 * @param {Object} props
 * @param {() => void} props.setFieldTouched
 * @param {({name: string; geo_coordonnees: string;}) => void} props.handleValues
 * @param {string} props.name
 * @param {string} props.defaultValue
 * @return {JSX.Element}
 */
export default (props) => {
  const [items, setItems] = useState([])
  const adresse = []

  const getAddress = async (value) => {
    const result = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${value}`)

    return result.json()
  }

  const handleSearch = async (search) => {
    if (search) {
      const data = await getAddress(search)
      data.features.forEach((feat) => {
        const name = `${feat.properties.label}`
        const coordinates = feat.geometry.coordinates.reverse().join(",")
        adresse.push({ name: name, geo_coordonnees: coordinates })
      })
      return adresse
    }
    return items
  }

  const itemToString = (item) => (item ? item.name : "")
  const onSelectedItemChange = ({ selectedItem }) => props.handleValues(selectedItem)
  const onInputValueChange = async ({ inputValue }) => {
    if (inputValue === "") {
      props.handleValues({ name: "", geo_coordonnees: "" })
      return
    }
    setItems(await handleSearch(inputValue))
  }

  const { isOpen, getMenuProps, getInputProps, getComboboxProps, highlightedIndex, getItemProps } = useCombobox({
    itemToString,
    onInputValueChange,
    onSelectedItemChange,
    items,
    initialInputValue: props.defaultValue,
  })

  return (
    <Box>
      <div {...getComboboxProps()}>
        <Input
          onFocus={() => {
            if (props.setFieldTouched) {
              setTimeout(() => props.setFieldTouched(props.name, true), 100)
            }
          }}
          placeholder="Rechercher une adresse"
          required={props.required ?? false}
          onPaste={(e) => e.preventDefault()}
          {...getInputProps()}
        />
      </div>
      <Box
        sx={{
          width: "100%",
          margin: 0,
          marginTop: "2px",
          padding: 0,
          zIndex: 1,
          position: "absolute",
          listStyle: "none",
          background: "#fff",
          overflow: "auto",
          boxShadow: "0px 1px 8px rgba(8, 67, 85, 0.24)",
        }}
        {...getMenuProps()}
      >
        {isOpen &&
          items.map((item, index) => (
            <li
              style={highlightedIndex === index ? { backgroundColor: "lightGrey", width: "100%", padding: "0.5rem" } : { width: "100%", padding: "0.5rem" }}
              key={`${item}${index}`}
              {...getItemProps({ item, index })}
            >
              {item.name}
            </li>
          ))}
      </Box>
    </Box>
  )
}
