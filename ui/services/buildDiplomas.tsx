import React from "react"

const diplomaMap = {
  "3 (CAP...)": "Cap, autres formations niveau 3",
  "4 (BAC...)": "Bac, autres formations niveau 4",
  "5 (BTS, DEUST...)": "BTS, DEUST, autres formations niveaux 5 (Bac+2)",
  "6 (Licence...)": "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveaux 7 ou 8 (Bac+5)",
}

export default function buildDiplomas() {
  return (
    <>
      <option value="">Indifférent</option>
      {Object.keys(diplomaMap).map((key) => {
        return (
          <option key={key} value={key}>
            {diplomaMap[key]}
          </option>
        )
      })}
    </>
  )
}
