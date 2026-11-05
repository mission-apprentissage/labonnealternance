"use client"

import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import type { UseComboboxState } from "downshift"
import { useCombobox } from "downshift"
import { useField } from "formik"
import { useState } from "react"

import { LiveStatus } from "@/app/_components/LiveStatus"
import { pluralize } from "@/utils/strutils"

const neutralItemProps = {
  padding: "0.4rem 0.8rem 0.4rem 0.8rem",
  width: "100%",
  color: "grey.500",
  marginTop: "0",
  fontSize: "14px",
}

export default function DropdownCombobox(props) {
  const [inputItems, setInputJobItems] = useState([])
  const [searching, setSearching] = useState(false)

  const { saveSelectedItem, handleSearch, value, placeholder, name, label } = props
  const [field, meta, helpers] = useField(props.name)
  const errorMessage = meta.touched && meta.error ? meta.error : undefined

  const itemToString = (item) => (item ? item.appellation : "")
  const onInputValueChange = ({ inputValue, type }) => {
    // Toute saisie invalide le métier retenu, sinon le formulaire garde un métier que le champ n'affiche plus.
    // Le test porte sur la valeur Formik et non sur selectedItem, absent quand le métier vient d'une offre éditée.
    if ((type === useCombobox.stateChangeTypes.InputChange || type === useCombobox.stateChangeTypes.InputKeyDownEscape) && field.value) {
      saveSelectedItem(null, reset)
    }
    setSearching(true)
    // handleSearch est débouncé : seule la dernière promesse aboutit.
    handleSearch(inputValue)
      ?.then((data) => setInputJobItems(data))
      .finally(() => setSearching(false))
  }

  const onSelectedItemChange = (changes: Partial<UseComboboxState<any>>) => {
    // La désélection (Échap menu fermé) passe par onInputValueChange
    if (changes.selectedItem) {
      saveSelectedItem(changes.selectedItem, reset)
    }
  }

  // Downshift n'émet InputBlur que si le menu est ouvert et hors mousedown : après un clic à la souris dans
  // le champ (focus ouvre le menu, puis l'événement click le referme via InputClick), la sortie du champ
  // n'émet rien. Le marquage "touched" se fait donc sur le vrai onBlur, ci-dessous.
  const stateReducer = (_, actions) => {
    const { type, changes } = actions
    switch (type) {
      case useCombobox.stateChangeTypes.InputKeyDownEscape:
        helpers.setTouched(true)
        return changes
      default:
        return changes
    }
  }

  const { isOpen, inputValue, getLabelProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, reset, openMenu } = useCombobox({
    itemToString,
    onInputValueChange,
    onSelectedItemChange,
    stateReducer,
    items: inputItems,
    initialInputValue: value ?? [],
  })

  const inputProps = getInputProps({
    onFocus() {
      openMenu()
    },
    onBlur() {
      helpers.setTouched(true)
    },
  })

  const statusMessage =
    !isOpen || !inputValue || searching
      ? ""
      : inputItems.length === 0
        ? "Aucun métier trouvé, veuillez reformuler votre recherche"
        : `${pluralize(inputItems.length, "métier proposé", "métiers proposés")}, utilisez les flèches pour naviguer`

  return (
    <Box data-testid={props.dataTestId} sx={{ position: "relative" }}>
      {/* Le DSFR ajoute une marge basse à tout .fr-input-group qui n'est pas le dernier enfant de son parent :
          le conteneur l'isole de la liste et de la zone de statut. */}
      <div>
        <Input
          label={label}
          hintText="Sélectionnez un métier pour référencer l'offre"
          state={errorMessage ? "error" : "default"}
          stateRelatedMessage={errorMessage}
          nativeLabelProps={getLabelProps()}
          nativeInputProps={{
            ...inputProps,
            // downshift vide aria-activedescendant sans option active : un id vide ne désigne aucun élément
            "aria-activedescendant": inputProps["aria-activedescendant"] || undefined,
            name,
            placeholder: placeholder || "sélectionner un métier",
            // Obligatoire sans astérisque : le formulaire porte la mention "Tous les champs sont obligatoires"
            required: true,
            // aria-invalid : cf. HandiEngagementSelect
            "aria-invalid": Boolean(errorMessage),
          }}
        />
      </div>
      {/* getMenuProps() pose role="listbox" : la cible doit être un <ul> et ses enfants des <li>
          (RGAA 8.2). Les marges et le listStyle sont déjà neutralisés ici ; la mise en forme des
          listes de DepotSimplifieStyling exclut explicitement les [role="listbox"]. */}
      <Box
        component="ul"
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
        {...getMenuProps({ "aria-label": label })}
      >
        {isOpen &&
          inputItems.map((item, index) => (
            <li
              style={highlightedIndex === index ? { backgroundColor: "lightGrey", width: "100%", padding: "0.5rem" } : { width: "100%", padding: "0.5rem" }}
              key={`${item}${index}`}
              data-testid={item.appellation}
              {...getItemProps({ item, index })}
            >
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: "700",
                }}
              >
                {item.appellation}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#666666",
                }}
              >
                {item.intitule}
              </Typography>
            </li>
          ))}
        {isOpen && inputItems.length === 0 && (
          <Box component="li" role="presentation" key="nomatch" {...neutralItemProps}>
            <Typography>Nous ne parvenons pas à identifier le métier que vous cherchez, veuillez reformuler votre recherche</Typography>
          </Box>
        )}
      </Box>
      <LiveStatus message={statusMessage} />
    </Box>
  )
}
