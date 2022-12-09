import React from "react"
import { findIndex } from "lodash"
import { useSwipeable } from "react-swipeable"

import ExternalLink from "../../externalLink"
import chevronLeft from "../../../public/images/chevronleft.svg"
import chevronRight from "../../../public/images/chevronright.svg"
import chevronClose from "../../../public/images/close.svg"
import { SendPlausibleEvent } from "../../../utils/plausible"

export const buttonJePostuleShouldBeDisplayed = (oneKind, oneItem) => {
  return oneKind === "peJob" && oneItem?.url
}

export const buttonPRDVShouldBeDisplayed = (oneItem) => {
  let res = !!oneItem?.prdvUrl
  return res
}

export const buildPrdvButton = (training) => {
  const onClickPrdv = () => {
    SendPlausibleEvent("Clic Prendre RDV - Fiche formation", { info_fiche: training.cleMinistereEducatif })
  }

  return (
    <div
      className="widget-prdv gtmPrdv"
      data-referrer="lba"
      data-id-cle-ministere-educatif={training.cleMinistereEducatif}
      data-id-rco-formation={training.idRcoFormation}
      onClick={onClickPrdv}
    >
      <ExternalLink className="gtmPrdv" url={training.prdvUrl} title="Je prends rendez-vous"/>
    </div>
  )
}

export const BuildSwipe = ({ currentList, handleSelectItem, selectedItem }) => {
  // See https://www.npmjs.com/package/react-swipeable
  const swipeHandlers = useSwipeable({
    onSwiped: (event_data) => {
      if (event_data.dir === "Right") {
        if (currentList.length > 1) {
          goPrev()
        }
      } else if (event_data.dir === "Left") {
        if (currentList.length > 1) {
          goNext()
        }
      }
    },
  })
  const goNext = () => {
    let currentIndex = findIndex(currentList, selectedItem)
    let nextIndex = currentIndex == currentList.length - 1 ? 0 : currentIndex + 1
    handleSelectItem(currentList[nextIndex])
  }
  const goPrev = () => {
    let currentIndex = findIndex(currentList, selectedItem)
    let prevIndex = currentIndex == 0 ? currentList.length - 1 : currentIndex - 1
    handleSelectItem(currentList[prevIndex])
  }
  return {
    swipeHandlers,
    goNext,
    goPrev,
  }
}

export const getNavigationButtons = ({ goPrev, goNext, setSeeInfo, handleClose }) => {
  return (
    <>
      <div>
        <button
          className="c-tiny-btn"
          onClick={() => {
            goPrev()
          }}
        >
          <img className="c-tiny-btn__image" src={chevronLeft} alt="Résultat précédent" />
        </button>
      </div>
      <div className="ml-2">
        <button
          className="c-tiny-btn"
          onClick={() => {
            goNext()
          }}
        >
          <img className="c-tiny-btn__image" src={chevronRight} alt="Résultat suivant" />
        </button>
      </div>
      <div className="ml-2">
        <button
          className="c-tiny-btn"
          onClick={() => {
            setSeeInfo(false)
            handleClose()
          }}
        >
          <img className="c-tiny-btn__image" src={chevronClose} alt="Fermer la fenêtre" />
        </button>
      </div>
    </>
  )
}
