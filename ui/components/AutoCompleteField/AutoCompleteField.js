import React, { useState, useEffect } from "react"
import { useFormikContext } from "formik"
import { useCombobox } from "downshift" //https://github.com/downshift-js/downshift/tree/master/src/hooks/useCombobox
import { debounce } from "lodash"
import onInputValueChangeService from "./onInputValueChangeService"
import highlightItem from "../../services/hightlightItem"
import ReactHtmlParser from "react-html-parser"
import { Spinner } from "reactstrap"
import findExactItemRank from "./findExactItemRank"
import { Box, Flex, Input, Text } from "@chakra-ui/react"

let debouncedOnInputValueChange = null

// Permet de sélectionner un élément dans la liste d'items correspondant à un texte entré au clavier
export const compareAutoCompleteValues = (items, value) => {
  return items.findIndex((element) => (element?.label ? element.label.toLowerCase() === value.toLowerCase() : false))
}

// indique l'attribut de l'objet contenant le texte de l'item sélectionné à afficher
export const autoCompleteToStringFunction = (item) => {
  return item?.label?.toString() ?? ""
}

export const AutoCompleteField = ({
  kind,
  name,
  itemToStringFunction,
  onInputValueChangeFunction,
  onSelectedItemChangeFunction,
  compareItemFunction,
  initialSelectedItem,
  items,
  hasError,
  initialIsOpen,
  scrollParentId,
  searchPlaceholder,
  splitItemsByTypes = null,
  isDisabled = false,
  menuVariant = "defaultAutocomplete",
  inputVariant = "defaultAutocomplete",
  labelVariant = "defaultAutocomplete",
  ...props
}) => {
  useEffect(() => {
    if (!initialized && initialSelectedItem) {
      setInitialized(true)

      // provoque un appel pour charger la liste des valeurs en fonction de la value de l'input text
      onInputValueChangeService({
        inputValue: initialSelectedItem.label,
        inputItems,
        items,
        setInputItems,
        selectItem,
        setLoadingState,
        onInputValueChangeFunction,
        compareItemFunction,
        onSelectedItemChangeFunction,
        initialSelectedItem,
        setFieldValue,
        setInputTextValue,
      })
    }
  }, [initialSelectedItem?.label])

  const { setFieldValue } = useFormikContext()

  const [inputTextValue, setInputTextValue] = useState("")
  const [inputItems, setInputItems] = useState(items)
  const [initialized, setInitialized] = useState(false)
  const [loadingState, setLoadingState] = useState("loading")

  const itemToString = (item) => {
    if (itemToStringFunction) return item ? itemToStringFunction(item) : ""
    else return item
  }

  const buildInputItems = () => {
    /* le bloc ci-dessous n'est valable que si le paramètre splitItemByTypes est renseigné, il permet de construire des titres de catégories d'items */
    let currentTitleCnt = 0
    let currentType = ""
    const returnTitleLi = (item) => {
      let res = ""
      if (splitItemsByTypes && item.type !== currentType && currentTitleCnt < splitItemsByTypes.length) {
        while (item.type !== currentType && currentTitleCnt < splitItemsByTypes.length) {
          currentType = splitItemsByTypes[currentTitleCnt].type
          currentTitleCnt++
        }
        res = (
          <li key={`autocomplete_title_${currentTitleCnt - 1}`} className={`c-autocomplete-title ${currentTitleCnt > 1 ? "c-autocomplete-title_bordered" : ""} `}>
            {splitItemsByTypes[currentTitleCnt - 1].typeLabel}
          </li>
        )
      }

      return res
    }
    /*fin*/

    return inputItems
      .filter((item) => !!item?.label)
      .map((item, index) => {
        return (
          <React.Fragment key={index}>
            {returnTitleLi(item)}
            <li
              key={index}
              className={`c-autocomplete_option${highlightedIndex === index ? " c-autocomplete__option--highlighted" : ""}`}
              {...getItemProps({ item: item.label, index })}
            >
              {ReactHtmlParser(highlightItem(item.label, inputValue))}
            </li>
          </React.Fragment>
        )
      })
  }

  // hack pour scroller un champ autocomplete dont les valeurs pourraient être cachées par le clavier du mobile
  const onFocusTriggered = (e) => {
    if (typeof window !== "undefined") {
      if (window.innerHeight < 750) {
        let target = e.currentTarget
        setTimeout(() => {
          if (scrollParentId) {
            let ancestor = target.closest(`#${scrollParentId}`)

            if (ancestor) {
              ancestor.scrollTop = ancestor.scrollTop + 150
            }
          } else {
            const closest = target.closest(".containerIdentity")
            const y = closest.getBoundingClientRect().top + window.pageYOffset - 20
            window.scrollTo({ top: y, behavior: "smooth" })
          }
        }, 350)
      }
    }
  }

  const { isOpen, getMenuProps, getInputProps, getComboboxProps, highlightedIndex, getItemProps, selectItem, openMenu, inputValue } = useCombobox({
    id: "lang-switcher",
    items: inputItems,
    itemToString,
    defaultHighlightedIndex: findExactItemRank({ value: inputTextValue, items: inputItems }),
    initialSelectedItem,
    initialIsOpen,
    inputValue: inputTextValue,
    onSelectedItemChange: ({ selectedItem }) => {
      // modifie les valeurs sélectionnées du formulaire en fonction de l'item sélectionné
      if (onSelectedItemChangeFunction) {
        onSelectedItemChangeFunction(selectedItem, setFieldValue)
      }
    },
    onInputValueChange: async ({ inputValue }) => {
      if (loadingState === "done") {
        setLoadingState("loading")
      }
      if (!debouncedOnInputValueChange) {
        debouncedOnInputValueChange = debounce(onInputValueChangeService, 300)
      }
      setInputTextValue(inputValue)
      debouncedOnInputValueChange({
        inputValue,
        inputItems,
        items,
        setInputItems,
        setLoadingState,
        selectItem,
        onInputValueChangeFunction,
        compareItemFunction,
        setFieldValue,
      })
    },
  })

  let containerChakraProps = {
    position: "relative",
    width: { lg: "232px" },
    direction: "column",
    borderRadius: "10px",
    padding: "0.1rem",
    sx: { borderColor: `${hasError ? "warning" : "grey.300"} !important`, border: "1px solid" },
    className: "containerIdentity",
  }

  return (
    <Box>
      <Flex variant={componentVariant} {...containerChakraProps} {...getComboboxProps()}>
        <Text variant={labelVariant} as="label">
          {kind}
        </Text>

        <Input
          {...getInputProps({
            onFocus: (e) => {
              if (!isOpen) {
                openMenu()
              }
              onFocusTriggered(e)
            },
          })}
          disabled={isDisabled}
          placeholder={props.placeholder}
          fontSize="14px"
          fontWeight={600}
          background="white"
          px="0.5"
          py="1px"
          mb="1px"
          sx={{ height: "32px", border: "none !important", width: "95%", marginLeft: "5px" }}
          _placeholder={{ color: "grey.500", lineHeight: "17px", letterSpacing: "0px", fontWeight: "400", fontSize: "14px" }}
          name={props.name}
        />
      </Flex>

      <ul {...getMenuProps()} className={`c-autocomplete__menu is-open-${isOpen}`}>
        {(() => {
          if (isOpen) {
            if (inputValue.length === 0) {
              return (
                <li key={`placeholder`} className="c-autocomplete-neutral">
                  {searchPlaceholder}
                </li>
              )
            } else if (loadingState === "loading") {
              return (
                <li key={`spinner`} className="c-autocomplete-neutral">
                  <Spinner color="primary" className="c-spinner" />
                  &nbsp;Veuillez patienter
                </li>
              )
            } else if (inputValue.length > 0 && inputItems?.length === 0) {
              let message = "Pas de résultat, veuillez modifier votre recherche"
              if (name === "jobField") {
                message = "Nous ne parvenons pas à identifier le métier que vous cherchez, veuillez reformuler votre recherche"
              }
              if (name === "placeField") {
                message = "Nous ne parvenons pas à identifier le lieu que vous cherchez, veuillez reformuler votre recherche"
              }
              return (
                <li key={`noresult`} className="c-autocomplete-neutral">
                  {message}
                </li>
              )
            } else {
              return (
                <>
                  <li key={`result`} className="c-autocomplete-minititle">
                    Résultats de votre recherche
                  </li>
                  {buildInputItems()}
                </>
              )
            }
          }
        })()}
      </ul>
    </Box>
  )
}

export default AutoCompleteField
