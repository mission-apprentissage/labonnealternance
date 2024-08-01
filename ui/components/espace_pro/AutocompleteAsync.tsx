import { Box, Spinner, Text } from "@chakra-ui/react"
import { useCombobox } from "downshift"
import { useMemo, useState } from "react"

import { debounce } from "@/common/utils/debounce"

import CustomInput from "./CustomInput"

export default function AutocompleteAsync<T>({
  onSelectItem,
  handleSearch,
  initInputValue: value,
  placeholder,
  name,
  dataTestId,
  renderItem = (item, highlighted) => (highlighted ? "highlighted " : "") + JSON.stringify(item),
  itemToString = (item) => JSON.stringify(item),
  debounceDelayInMs = 300,
  onInputFieldChange,
  renderError,
  onError,
  renderNoResult = (
    <Text padding="8px 16px" fontSize="12px" lineHeight="20px" color="#666666">
      Pas de résultats pour votre recherche
    </Text>
  ),
  renderLoading = (
    <Box padding="8px 16px">
      <Spinner thickness="4px" speed="0.7s" emptyColor="white" color="#CFCFCF" size="lg" />
    </Box>
  ),
  allowHealFromError,
}: {
  name: string
  placeholder?: string
  handleSearch: (input: string) => Promise<T[]>
  onSelectItem: (item: T | null) => void
  initInputValue?: string
  dataTestId?: string
  itemToString?: (item: T) => string
  renderItem?: (item: T, highlighted: boolean, index: number) => React.ReactNode
  debounceDelayInMs?: number
  onInputFieldChange?: (inputValue: string, hasError: boolean) => void
  onError: (error: any, inputValue: string) => void
  renderError: (error: any) => React.ReactNode
  renderNoResult?: React.ReactNode
  renderLoading?: React.ReactNode
  allowHealFromError: boolean
}) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [inputItems, setInputJobItems] = useState([])
  const debouncedSearch = useMemo(() => {
    return debounce(handleSearch, debounceDelayInMs)
  }, [handleSearch, debounceDelayInMs])

  const { isOpen, getMenuProps, getInputProps, getComboboxProps, getItemProps, highlightedIndex } = useCombobox<T>({
    itemToString,
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue || (error && !allowHealFromError)) {
        setInputJobItems([])
        return
      }
      setLoading(true)
      debouncedSearch(inputValue)
        .then((data) => {
          setInputJobItems(data)
          setError(null)
        })
        .catch((error) => {
          setError(error)
          onError(error, inputValue)
        })
        .finally(() => setLoading(false))
    },
    onStateChange(changes) {
      if ("inputValue" in changes) {
        onInputFieldChange?.(changes.inputValue, Boolean(error))
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      setTimeout(() => {
        onSelectItem(selectedItem)
      })
    },
    items: inputItems,
    initialInputValue: value ?? "",
  })

  const shouldRenderError = Boolean(error && renderError(error))
  const shouldRenderEmptyResult = !error && !loading && !inputItems.length
  const shouldRenderLoading = !error && loading && !inputItems.length
  const shouldRenderItems = Boolean(!error && inputItems.length)

  const shouldRenderDropdown = shouldRenderError || shouldRenderEmptyResult || shouldRenderLoading || shouldRenderItems

  return (
    <Box data-testid={dataTestId} sx={{ width: "100%", position: "relative" }}>
      <Box
        {...getComboboxProps()}
        sx={{
          display: "block",
          boxSizing: "border-box",
        }}
      >
        <CustomInput pb="0" required={false} name={name} placeholder={placeholder} {...{ ...getInputProps(), ref: undefined }} />
      </Box>
      <Box
        sx={{
          width: "100%",
          margin: 0,
          marginTop: "6px",
          zIndex: 1,
          position: "absolute",
          listStyle: "none",
          background: "#fff",
          overflow: "auto",
          boxShadow: "0px 1px 8px rgba(8, 67, 85, 0.24)",
          borderRadius: "6px",
          maxH: "50vh",
        }}
        {...getMenuProps()}
      >
        {isOpen && shouldRenderDropdown && (
          <Box padding="8px 0px">
            {shouldRenderItems && (
              <Box>
                {inputItems.map((item, index) => (
                  <li key={index} {...getItemProps({ item, index })}>
                    {renderItem(item, index === highlightedIndex, index)}
                  </li>
                ))}
              </Box>
            )}
            {shouldRenderError && renderError(error)}
            {shouldRenderEmptyResult && renderNoResult}
            {shouldRenderLoading && renderLoading}
          </Box>
        )}
      </Box>
    </Box>
  )
}
