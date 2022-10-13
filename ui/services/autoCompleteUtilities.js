// indique l'attribut de l'objet contenant le texte de l'item sélectionné à afficher
const autoCompleteToStringFunction = (item) => {
  return item ? item.label : "";
};

// Permet de sélectionner un élément dans la liste d'items correspondant à un texte entré au clavier
const compareAutoCompleteValues = (items, value) => {
  return items.findIndex((element) => element.label.toLowerCase() === value.toLowerCase());
};

export { autoCompleteToStringFunction, compareAutoCompleteValues }
