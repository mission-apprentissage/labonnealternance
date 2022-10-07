import { isNonEmptyString, countInstances } from "./strutils";

/*
 * Permet de ne retenir QUE l'adresse postale,
 * sans le nom du destinataire.
 *
 * Exemple : Service Ressource Humaine, 2 rue Truc, 32300 Mouches
 * Devient : 2 rue Truc, 32300 Mouches
 */
const rawPostalAddress = (address) => {
  let result = "";
  const SEPARATOR = ", ";
  if (isNonEmptyString(address)) {
    if (countInstances(address, SEPARATOR) > 1) {
      let elements = address.split(SEPARATOR);
      elements.shift(); // Retire le premier élément : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
      result = elements.join(SEPARATOR);
    } else {
      result = address;
    }
  }
  return result;
};

export { rawPostalAddress };
