"use client"

import { Box, Text } from "@chakra-ui/react"
import { useCombobox, UseComboboxState } from "downshift"
import { useField } from "formik"
import { useState } from "react"

import CustomInput from "@/app/_components/CustomInput"

const neutralItemProps = {
  padding: "0.4rem 0.8rem 0.4rem 0.8rem",
  width: "100%",
  color: "grey.500",
  marginTop: "0",
  fontSize: "14px",
}

export default function DropdownCombobox(props) {
  const [inputItems, setInputJobItems] = useState([])

  const { saveSelectedItem, handleSearch, value, placeholder, name } = props
  const [, , helpers] = useField(props.name)

  const itemToString = (item) => (item ? item.appellation : "")
  const onInputValueChange = ({ inputValue }) => handleSearch(inputValue)?.then((data) => setInputJobItems(data))

  const onSelectedItemChange = (changes: Partial<UseComboboxState<any>>) => {
    if ("selectedItem" in changes) {
      saveSelectedItem(changes.selectedItem, reset)
    }
  }

  const stateReducer = (_, actions) => {
    const { type, changes } = actions
    switch (type) {
      case useCombobox.stateChangeTypes.InputBlur:
      case useCombobox.stateChangeTypes.InputKeyDownEscape:
        helpers.setTouched(true)
        return changes
      default:
        return changes
    }
  }

  const { isOpen, getMenuProps, getInputProps, getComboboxProps, highlightedIndex, getItemProps, reset } = useCombobox({
    itemToString,
    onInputValueChange: ({ inputValue }) => onInputValueChange({ inputValue }),
    onSelectedItemChange,
    stateReducer,
    items: inputItems,
    initialInputValue: value ?? [],
  })

  return (
    <div data-testid={props.dataTestId}>
      <div {...getComboboxProps()}>
        <CustomInput pb="0" required={false} name={name} placeholder={placeholder || "sélectionner un métier"} {...getInputProps()} />
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
          maxH: "50vh",
        }}
        {...getMenuProps()}
      >
        {isOpen &&
          inputItems.map((item, index) => (
            <li
              style={highlightedIndex === index ? { backgroundColor: "lightGrey", width: "100%", padding: "0.5rem" } : { width: "100%", padding: "0.5rem" }}
              key={`${item}${index}`}
              data-testid={item.appellation}
              {...getItemProps({ item, index })}
            >
              <Text fontSize="16px" fontWeight="700">
                {item.appellation}
              </Text>
              <Text fontSize="12px" color="#666666">
                {item.intitule}
              </Text>
            </li>
          ))}
        {isOpen && inputItems.length === 0 && (
          <Box key="nomatch" {...neutralItemProps}>
            Nous ne parvenons pas à identifier le métier que vous cherchez, veuillez reformuler votre recherche
          </Box>
        )}
      </Box>
    </div>
  )
}
