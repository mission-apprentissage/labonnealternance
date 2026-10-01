import { Box, CircularProgress, Typography } from "@mui/material"
import { useCombobox } from "downshift"
import { useMemo, useState } from "react"

import CustomInput from "@/app/_components/CustomInput"
import { LiveStatus } from "@/app/_components/LiveStatus"
import { debounce } from "@/utils/debounce"
import { pluralize } from "@/utils/strutils"

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
  renderNoResult = <Typography sx={{ padding: "8px 16px", fontSize: "12px", lineHeight: "20px", color: "#666666" }}>Pas de résultats pour votre recherche</Typography>,
  renderLoading = (
    <Box sx={{ padding: "8px 16px" }}>
      <CircularProgress size={30} sx={{ fontWeight: "bold", color: "#CFCFCF" }} />
    </Box>
  ),
  noResultText = "Aucun résultat",
  errorText = "",
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
  /** Équivalent textuel de renderNoResult, annoncé aux lecteurs d'écran. */
  noResultText?: string
  /** Équivalent textuel de renderError, annoncé en role="alert". */
  errorText?: string
  allowHealFromError: boolean
}) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [inputItems, setInputJobItems] = useState([])
  const debouncedSearch = useMemo(() => {
    return debounce(handleSearch, debounceDelayInMs)
  }, [])

  const { isOpen, inputValue, getMenuProps, getInputProps, getItemProps, highlightedIndex, openMenu } = useCombobox<T>({
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

  // Annonce hors listbox, sans getA11yStatusMessage de downshift : ses dépendances n'incluent pas
  // les items, le message partirait avant l'arrivée des résultats asynchrones.
  const statusMessage =
    !isOpen || loading
      ? ""
      : shouldRenderItems
        ? `${pluralize(inputItems.length, "résultat")}, utilisez les flèches pour naviguer`
        : shouldRenderEmptyResult && inputValue
          ? noResultText
          : ""

  return (
    <Box data-testid={dataTestId} sx={{ width: "100%", position: "relative" }}>
      <CustomInput
        pb="0"
        required={false}
        name={name}
        placeholder={placeholder}
        {...{
          ...getInputProps({
            onFocus() {
              openMenu()
            },
          }),
          ref: undefined,
        }}
      />
      {/* getMenuProps() pose role="listbox" : la cible doit être un <ul>, et ses enfants des <li>.
          Les <li> vivaient dans des <div> intermédiaires — document invalide (RGAA 8.2) et nombre
          d'éléments non restitué. Le padding vertical, porté avant par un div interne, est appliqué
          ici et seulement quand la liste a du contenu, pour ne pas laisser une bande blanche vide. */}
      <Box
        component="ul"
        sx={{
          width: "100%",
          margin: 0,
          marginTop: "6px",
          padding: 0,
          paddingY: isOpen && shouldRenderDropdown ? "8px" : 0,
          zIndex: 2000,
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
          <>
            {shouldRenderItems &&
              inputItems.map((item, index) => (
                <li key={index} {...getItemProps({ item, index })}>
                  {renderItem(item, index === highlightedIndex, index)}
                </li>
              ))}
            {shouldRenderError && <li role="presentation">{renderError(error)}</li>}
            {shouldRenderEmptyResult && <li role="presentation">{renderNoResult}</li>}
            {shouldRenderLoading && <li role="presentation">{renderLoading}</li>}
          </>
        )}
      </Box>
      <LiveStatus message={statusMessage} />
      <LiveStatus role="alert" message={isOpen && shouldRenderError ? errorText : ""} />
    </Box>
  )
}
