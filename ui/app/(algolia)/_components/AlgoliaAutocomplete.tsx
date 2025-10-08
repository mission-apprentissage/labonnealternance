/**
 * COPY OF ui/components/espace_pro/AutocompleteAsync.tsx without Formik in CustomInput
 * TODO : unify components and remove this copy when Formik is not used any more in this rep
 */

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Input, Typography, CircularProgress } from "@mui/material"
import { useCombobox } from "downshift"
import { useMemo, useState } from "react"

import { debounce } from "@/common/utils/debounce"

export default function AlgoliaAutocompleteAsync<T>({
  onSelectItem,
  handleSearch,
  initInputValue: value,
  placeholder,
  name,
  renderItem = (item, highlighted) => (highlighted ? "highlighted " : "") + JSON.stringify(item),
  itemToString = (item) => JSON.stringify(item),
  debounceDelayInMs = 300,
  onInputFieldChange,
  renderError,
  onError,
  renderNoResult = <Typography sx={{ padding: "8px 16px", fontSize: "12px", color: "#666" }}>Pas de résultats pour votre recherche</Typography>,
  renderLoading = (
    <Box sx={{ px: fr.spacing("2w") }}>
      <CircularProgress />
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
  }, [debounceDelayInMs, handleSearch])

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
    <Box sx={{ position: "relative", mt: "16px" }}>
      <Box
        {...getComboboxProps()}
        sx={{
          display: "block",
          boxSizing: "border-box",
        }}
      >
        <Input className={fr.cx("fr-input")} required={false} name={name} placeholder={placeholder} {...getInputProps()} ref={undefined} />
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
