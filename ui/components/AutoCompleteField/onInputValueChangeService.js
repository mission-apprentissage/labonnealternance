import { noop } from "lodash/noop";

export default async function onInputValueChangeService({
  inputValue,
  inputItems = [],
  items = [],
  setInputItems = noop,
  setLoadingState = noop,
  selectItem = noop,
  onInputValueChangeFunction = null,
  compareItemFunction = null,
  onSelectedItemChangeFunction = null,
  previouslySelectedItem = null,
  setFieldValue = null,
}) {
  // fixe la liste d'items en fonction de la valeur courante du champ input. S'il y a appel à une API c'est ici
  if (onInputValueChangeFunction) {
    const newItems = await onInputValueChangeFunction(inputValue, setLoadingState);
    setInputItems(newItems);

    if (previouslySelectedItem) { // uniquement appelé lors d'une réinitialisation de l'input après navigation
      setTimeout(() => {
        onSelectedItemChangeFunction(previouslySelectedItem, setFieldValue);
      }, 0); // hack timeout pour passer après le changement de valeurs suite au fetch
    }
  } else {
    setInputItems(items.filter((item) => item.label.toLowerCase().startsWith(inputValue.toLowerCase())));
  }

  // sélectionne ou désélectionne l'objet en fonction des modifications au clavier de l'utilisateur
  if (compareItemFunction) {
    const itemIndex = compareItemFunction(inputItems, inputValue);
    if (itemIndex >= 0) {
      selectItem(inputItems[itemIndex]);
    } else {
      selectItem(null);
    }
  }
}
