const rayonMap = {
  10: "10km",
  30: "30km",
  60: "60km",
  100: "100km",
}

export function buildRayonsOptions() {
  return (
    <>
      {Object.keys(rayonMap).map((key) => {
        return (
          <option key={key} value={key}>
            {rayonMap[key]}
          </option>
        )
      })}
    </>
  )
}

export function buildRayonsButtons(locationRadius, onClickCallback) {
  return (
    <div className="c-rayons-buttons">
      {Object.keys(rayonMap).map((key) => {
        return (
          <div
            key={key}
            value={key}
            className={`c-rayons-button ${locationRadius?.toString() === key ? "is-selected" : ""}`}
            onClick={(evt) => {
              evt.currentTarget.value = key
              onClickCallback(evt, key)
            }}
          >
            {`${key} km`}
          </div>
        )
      })}
    </div>
  )
}
