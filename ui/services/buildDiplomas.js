import React from "react";

const diplomaMap = {
  "3 (CAP...)": "Cap, autres formations niveau 3",
  "4 (Bac...)": "Bac, autres formations niveau 4",
  "5 (BTS, DUT...)": "BTS, DUT, autres formations niveaux 5 (Bac+2)",
  "6 (Licence...)": "Licence, autres formations niveaux 6 (bac+3)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveaux 7 ou 8 (bac+5)",
};

export default function buildDiplomas() {
  return (
    <>
      <option value="">Indifférent</option>
      {Object.keys(diplomaMap).map((key) => {
        return (
          <option key={key} value={key}>
            {diplomaMap[key]}
          </option>
        );
      })}
    </>
  );
}
