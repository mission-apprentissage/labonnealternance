import { Box } from "@chakra-ui/react"
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

const buttonProperties = {
  border: "1px solid",
  borderColor: "grey.400",
  marginTop: "2px",
  width: "fit-content",
  borderRadius: "40px",
  cursor: "pointer",
  marginRight: ["0.6rem", "0.2rem"],
  padding: ["0.1rem 0.5rem", "0.3rem 1rem"],
  fontSize: ["12px", "16px"],
  lineHeight: ["16px", "24px"],
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
          <Box
            key={indx}
            value={diplomaValue(key)}
            {...buttonProperties}
            color={localDiploma === key ? "white" : "grey.750"}
            background={localDiploma === key ? "blue" : "white"}
            onClick={(evt) => {
              evt.currentTarget.value = diplomaValue(key)
              onClickCallback(evt, key)
            }}
          >
            {diplomaMap[key] || defaultDiploma}
          </Box>
        )
      })}
    </>
  )
}
