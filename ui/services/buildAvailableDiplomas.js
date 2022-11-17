import React from "react"

const diplomaMap = {
  "3 (CAP...)": "Cap, autres formations niveau 3",
  "4 (BAC...)": "Bac, autres formations niveau 4",
  "5 (BTS, DEUST...)": "BTS, DEUST, autres formations niveaux 5 (Bac+2)",
  "6 (Licence, BUT...)": "Licence, autres formations niveaux 6 (bac+3)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveaux 7 ou 8 (bac+5)",
}

const defaultDiploma = "Indifférent"

export function buildAvailableDiplomasOptions(diplomas) {
  return (
    <>
      <option value="">{defaultDiploma}</option>
      {diplomas.length
        ? diplomas.sort().map((diploma) => {
            return (
              <option key={diploma} value={diploma}>
                {diplomaMap[diploma]}
              </option>
            )
          })
        : Object.keys(diplomaMap).map((key) => {
            return (
              <option key={key} value={key}>
                {diplomaMap[key]}
              </option>
            )
          })}
    </>
  )
}

function diplomaValue(diplomaValue) {
  return diplomaValue === defaultDiploma ? "" : diplomaValue
}

function copyDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function buildAvailableDiplomasButtons(currentDiploma, diplomas, onClickCallback) {
  let localDiploma = ""

  if (currentDiploma) {
    localDiploma = currentDiploma
  } else {
    localDiploma = defaultDiploma
  }

  // le copyDeep est indispensable pour éviter de "salir" les arrays d'entrée
  let allDiplomas = diplomas?.length ? copyDeep(diplomas.sort()) : copyDeep(Object.keys(diplomaMap))

  // On s'assure qu'il y a toujours l'option "indifférent" en premier
  if (allDiplomas.indexOf(defaultDiploma) < 0) {
    allDiplomas.unshift(defaultDiploma)
  }

  return (
    <>
      {allDiplomas.map(function (key, indx) {
        return (
          <div
            key={indx}
            value={diplomaValue(key)}
            className={`c-diplomas-button ${localDiploma === key ? "is-selected" : ""}`}
            onClick={(evt) => {
              evt.currentTarget.value = diplomaValue(key)
              onClickCallback(evt, key)
            }}
          >
            {diplomaMap[key] || defaultDiploma}
          </div>
        )
      })}
    </>
  )
}
