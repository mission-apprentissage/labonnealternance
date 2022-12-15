import React, { useState, useEffect } from "react"
import { useFormikContext } from "formik"
import { useCombobox } from "downshift" //https://github.com/downshift-js/downshift/tree/master/src/hooks/useCombobox
import { debounce } from "lodash"
import onInputValueChangeService from "./onInputValueChangeService"
import highlightItem from "../../services/hightlightItem"
import ReactHtmlParser from "react-html-parser"
import findExactItemRank from "./findExactItemRank"
import { Box, Container, Flex, Input, Spinner, Text, VStack } from "@chakra-ui/react"

let debouncedOnInputValueChange = null

// Permet de sélectionner un élément dans la liste d'items correspondant à un texte entré au clavier
export const compareAutoCompleteValues = (items, value) => {
  return items.findIndex((element) => (element?.label ? element.label.toLowerCase() === value.toLowerCase() : false))
}

// indique l'attribut de l'objet contenant le texte de l'item sélectionné à afficher
export const autoCompleteToStringFunction = (item) => {
  return item?.label?.toString() ?? ""
}

const neutralItemProps = {
  padding: "0.4rem 0.8rem 0.4rem 0.8rem",
  width: "100%",
  color: "grey.500",
  marginTop: "0",
  fontSize: "14px",
}

const itemProps = {
  padding: "0.4rem 0.8rem 0.4rem 2rem",
  width: "100%",
  fontSize: "14px",
  lineHeight: "19.6px",
  fontWeight: 400,
  marginTop: "0",
  color: "#383838",
  _hover: {
    backgroundColor: "grey.200",
    cursor: "pointer",
  },
}

const titleItemProps = {
  padding: "0.4rem 0.8rem 0.4rem 0.8rem",
  width: "100%",
  color: "bluesoft.500",
  marginTop: "0",
  fontSize: "14px",
  fontWeight: 700,
  textTransform: "uppercase",
}

const borderedTitleItemProps = {
  ...titleItemProps,
  borderTop: "1px solid",
  borderColor: "grey.400",
  paddingTop: "0.5rem !important",
  marginTop: "1rem !important",
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
        const titleProps = currentTitleCnt > 1 ? borderedTitleItemProps : titleItemProps
        res = (
          <Box key={`autocomplete_title_${currentTitleCnt - 1}`} {...titleProps}>
            {splitItemsByTypes[currentTitleCnt - 1].typeLabel}
          </Box>
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
            <Box key={index} {...itemProps} bg={highlightedIndex === index ? "#aaa" : ""} {...getItemProps({ item: item.label, index })}>
              {ReactHtmlParser(highlightItem(item.label, inputValue))}
            </Box>
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
      <Flex {...containerChakraProps} {...getComboboxProps()}>
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
          variant={inputVariant}
          name={props.name}
        />
      </Flex>

      <Container {...getMenuProps()} variant={menuVariant}>
        <VStack>
          {(() => {
            if (isOpen) {
              if (inputValue.length === 0) {
                return (
                  <Box key={`placeholder`} {...neutralItemProps}>
                    {searchPlaceholder}
                  </Box>
                )
              } else if (loadingState === "loading") {
                return (
                  <Flex alignItems="center" direction="row" key={`spinner`} {...neutralItemProps}>
                    <Spinner mr={3} width="1rem" height="1rem" />
                    <Text>Veuillez patienter</Text>
                  </Flex>
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
                  <Box key={`noresult`} {...neutralItemProps}>
                    {message}
                  </Box>
                )
              } else {
                return (
                  <>
                    <Box key={`result`} {...neutralItemProps}>
                      Résultats de votre recherche
                    </Box>
                    {buildInputItems()}
                  </>
                )
              }
            }
          })()}
        </VStack>
      </Container>
    </Box>
  )
}

export default AutoCompleteField
