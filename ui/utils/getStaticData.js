
export const getStaticMetiers = (path, fs, txtDirectory) => {
  const uniq = require("lodash").uniq;
  const kebabCase = require("lodash").kebabCase;
  
  const fileJobPath = path.join(txtDirectory, 'metiers.txt')
  const lineJobString = fs.readFileSync(fileJobPath, 'utf8')
  const arrayOfJobLines = lineJobString.match(/[^\r\n]+/g);

  const dataJobs = arrayOfJobLines.map(function (singleLine) {
    const splitted = singleLine.split(' [')
    const actualName = splitted[0].trim()
    const romes = uniq(splitted[1].split(',').slice(0, -1))
    return {
      name: actualName,
      slug: kebabCase(actualName),
      romes: romes
    };
  })

  return dataJobs;
};

export const getStaticVilles = (path, fs, txtDirectory) => {
  const kebabCase = require("lodash").kebabCase;

  const fileTownPath = path.join(txtDirectory, 'villes.txt')
  const lineTownString = fs.readFileSync(fileTownPath, 'utf8')
  const arrayOfTownLines = lineTownString.match(/[^\r\n]+/g);

  const dataTowns = arrayOfTownLines.map(function (singleLine) {
    const splitted = singleLine.split('/')
    const townName = splitted[0].trim()
    const lon = splitted[4].trim()
    const lat = splitted[5].trim()
    const insee = splitted[2].trim()
    const zip = splitted[1].split('-')[0].trim()
    return {
      slug: kebabCase(townName),
      name: townName,
      lon: lon,
      lat: lat,
      insee: insee,
      zip: zip,
    };
  })

  return dataTowns;
};
