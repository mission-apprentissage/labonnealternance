import { Box, Text } from "@chakra-ui/react"
import { useCombobox } from "downshift"
import { useField } from "formik"
import debounce from "lodash/debounce"
import CustomInput from "./CustomInput"

export default (props) => {
  let { saveSelectedItem, setInputItems, handleSearch, value, placeholder, inputItems, name } = props
  const [_, __, helpers] = useField(props.name)

  const itemToString = (item) => (item ? item.appellation : "")
  const onInputValueChange = async ({ inputValue }) => setInputItems(await handleSearch(inputValue))
  const onSelectedItemChange = ({ selectedItem }) => saveSelectedItem(selectedItem, reset)
  const stateReducer = (_, actions) => {
    let { type, changes } = actions
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
    onInputValueChange: debounce(onInputValueChange, 500),
    onSelectedItemChange,
    stateReducer,
    items: inputItems,
    initialInputValue: value ?? [],
  })

  return (
    <div>
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
      </Box>
    </div>
  )
}
