import React, { useState, useEffect } from "react";
import { useFormikContext } from "formik";
import { useCombobox } from "downshift";
import { debounce } from "lodash";
import onInputValueChangeService from "./onInputValueChangeService";
import highlightItem from "services/hightlightItem";
import ReactHtmlParser from "react-html-parser";
import { Spinner } from "reactstrap";

let debouncedOnInputValueChange = null;

// Permet de sélectionner un élément dans la liste d'items correspondant à un texte entré au clavier
export const compareAutoCompleteValues = (items, value) => {
  return items.findIndex((element) => (element?.label ? element.label.toLowerCase() === value.toLowerCase() : false));
};

// indique l'attribut de l'objet contenant le texte de l'item sélectionné à afficher
export const autoCompleteToStringFunction = (item) => {
  return item?.label?.toString() ?? "";
};

export const AutoCompleteField = ({
  kind,
  itemToStringFunction,
  onInputValueChangeFunction,
  onSelectedItemChangeFunction,
  compareItemFunction,
  initialItem,
  items,
  initialIsOpen,
  scrollParentId,
  previouslySelectedItem,
  illustration,
  searchPlaceholder,
  ...props
}) => {
  useEffect(() => {
    if (!initialized && previouslySelectedItem) {
      setInitialized(true);
      onInputValueChangeService({
        inputValue,
        inputItems,
        items,
        setInputItems,
        selectItem,
        setLoadingState,
        onInputValueChangeFunction,
        compareItemFunction,
        onSelectedItemChangeFunction,
        previouslySelectedItem,
        setFieldValue,
      });
    }
  }, []);

  const { setFieldValue } = useFormikContext();

  const [inputItems, setInputItems] = useState(items);
  const [initialized, setInitialized] = useState(false);
  const [loadingState, setLoadingState] = useState("loading");

  const itemToString = (item) => {
    if (itemToStringFunction) return item ? itemToStringFunction(item) : "";
    else return item;
  };

  // hack pour scroller un champ autocomplete dont les valeurs pourraient être cachées par le clavier du mobile
  const onFocusTriggered = (e) => {
    let ancestor = e.currentTarget.closest(`#${scrollParentId}`);
    if (ancestor) {
      setTimeout(() => {
        if (typeof window !== "undefined") {
          if (window.innerHeight < 650) ancestor.scrollTop = ancestor.scrollTop + 150;
        }
      }, 350);
    }
  };

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    selectItem,
    openMenu,
    inputValue,
  } = useCombobox({
    id: "lang-switcher",
    items: inputItems,
    itemToString,
    defaultHighlightedIndex: 0,
    initialSelectedItem: previouslySelectedItem,
    initialIsOpen,
    onSelectedItemChange: ({ selectedItem }) => {
      // modifie les valeurs sélectionnées du formulaire en fonction de l'item sélectionné
      if (onSelectedItemChangeFunction) {
        onSelectedItemChangeFunction(selectedItem, setFieldValue);
      }
    },
    onInputValueChange: async ({ inputValue }) => {
      if (loadingState === "done") {
        setLoadingState("loading");
      }
      if (!debouncedOnInputValueChange) {
        debouncedOnInputValueChange = debounce(onInputValueChangeService, 300);
      }
      debouncedOnInputValueChange({
        inputValue,
        inputItems,
        items,
        setInputItems,
        setLoadingState,
        selectItem,
        onInputValueChangeFunction,
        compareItemFunction,
      });
    },
  });

  const classesOfContainer = props?.isHome ? "" : "c-logobar-formgroup";
  const classesOfInsider = props?.isHome ? "form-control-lg w-100 c-input-work" : "c-logobar-field";

  return (
    <div className="">
      <div className={`c-input-work-container ${classesOfContainer}`} {...getComboboxProps()}>
        <label className="c-logobar-label">{kind}</label>
        <input
          {...getInputProps({
            onFocus: (e) => {
              if (!isOpen) {
                openMenu();
              }
              onFocusTriggered(e);
            },
          })}
          className={`${classesOfInsider} ${
            inputValue && inputValue.length > 20 ? "is-text-too-long" : "is-text-not-too-long"
          }`}
          placeholder={props.placeholder}
          name={props.name}
          aria-describedby="name"
        />
        {illustration && <img className="c-input-work-img" src={illustration} alt="" />}
      </div>

      <ul {...getMenuProps()} className={`c-autocomplete__menu is-open-${isOpen}`}>
        {(() => {
          if (isOpen) {
            if (inputValue.length === 0) {
              return <li className="c-autocomplete-neutral">{searchPlaceholder}</li>;
            } else if (loadingState === "loading") {
              return (
                <li className="c-autocomplete-neutral">
                  <Spinner color="primary" />
                  &nbsp;Veuillez patienter
                </li>
              );
            } else if (inputValue.length > 0 && inputItems?.length === 0) {
              return <li className="c-autocomplete-neutral">Pas de résultat, veuillez modifier votre recherche</li>;
            } else {
              return (
                <>
                  <li className="c-autocomplete-minititle">Résultats de votre recherche</li>
                  {inputItems
                    .filter((item) => !!item?.label)
                    .map((item, index) => (
                      <li
                        className={highlightedIndex === index ? "c-autocomplete__option--highlighted" : ""}
                        key={`${index}`}
                        {...getItemProps({ item: item.label, index })}
                      >
                        {ReactHtmlParser(highlightItem(item.label, inputValue))}
                      </li>
                    ))}
                </>
              );
            }
          }
        })()}
      </ul>
    </div>
  );
};

export default AutoCompleteField;
