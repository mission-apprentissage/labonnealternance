import { includes, random } from "lodash";

// L'inverse de "includes". S'appui sur lodash pour plus de compatibilité.
const amongst = (item, collection) => {
  return includes(collection, item);
};

const randomWithin = (collection, limitation) => {
  let searchLimit = collection.length - 1
  if (limitation && limitation < collection.length - 1) {
    searchLimit = limitation
  }
  let randomIndex = random(0, searchLimit)
  return collection[randomIndex]
}

export { amongst, randomWithin }
