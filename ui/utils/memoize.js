/* simple fonction de memoization utilisant tous les paramètres d'appels de la fonction sous jacente en clef
Note : la fonction memoize de lodash n'utilise que le premier argument comme clef de cache ce qui n'est pas suffisant ici
source : https://www.section.io/engineering-education/an-introduction-to-memoization-in-javascript/
 */

const memoize = (func) => {
  const results = {};
  return (...args) => {
    const argsKey = JSON.stringify(args);
    if (!results[argsKey]) {
      results[argsKey] = func(...args);
    }
    return results[argsKey];
  };
};

export default memoize;
