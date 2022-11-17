import findExactItemRank from "./findExactItemRank"

export default async function onInputValueChangeService({
  inputValue,
  inputItems = [],
  items = [],
  setInputItems = () => {},
  setLoadingState = () => {},
  selectItem = () => {},
  setInputTextValue = () => {},
  onInputValueChangeFunction = null,
  compareItemFunction = null,
  onSelectedItemChangeFunction = null,
  initialSelectedItem = null,
  setFieldValue = null,
}) {
  if (inputValue) {
    // fixe la liste d'items en fonction de la valeur courante du champ input. S'il y a appel à une API c'est ici
    if (onInputValueChangeFunction) {
      const newItems = await onInputValueChangeFunction(inputValue, setLoadingState)
      setInputItems(newItems)

      // impacté uniquement via un useEffect pour fixer de force la valeur de l'input text à l'initialisation du formulaire
      // cf. test sur setInputTextValue qui est présent exclusivement dans ce cas
      if (setInputTextValue) {
        setInputTextValue(inputValue)
        const rank = findExactItemRank({ value: inputValue, items: newItems })
        setFieldValue(newItems[rank])
        selectItem(newItems[rank])
      }

      if (initialSelectedItem) {
        // uniquement appelé lors d'une réinitialisation de l'input après navigation
        setTimeout(() => {
          onSelectedItemChangeFunction(initialSelectedItem, setFieldValue)
        }, 0) // hack timeout pour passer après le changement de valeurs suite au fetch
      }
    } else {
      setInputItems(items.filter((item) => item.label.toLowerCase().startsWith(inputValue.toLowerCase())))
    }

    // sélectionne ou désélectionne l'objet en fonction des modifications au clavier de l'utilisateur
    // pas appelé lors de l'initialisation (cf. test sur setInputTextValue)
    if (compareItemFunction && !setInputTextValue) {
      const itemIndex = compareItemFunction(inputItems, inputValue)
      if (itemIndex >= 0) {
        selectItem(inputItems[itemIndex])
      } else {
        selectItem(null)
      }
    }
  } else {
    // reset des valeurs lorsqu'il n'y a pas de valeur dans le champs.
    setInputItems([])
    selectItem(null)
  }
}
