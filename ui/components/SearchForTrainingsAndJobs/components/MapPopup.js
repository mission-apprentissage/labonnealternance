import React, { useEffect } from "react"

import { getJobAddress } from "../../../utils/jobs"
import { logError } from "../../../utils/tools"
import { ErrorMessage } from "../.."
import { capitalizeFirstLetter } from "../../../utils/strutils"
import { setSelectedMarker } from "../../../utils/mapTools"
import bookIcon from "../../../public/images/icons/book.svg"
import jobIcon from "../../../public/images/icons/job.svg"
import { Flex, Image, Text } from "@chakra-ui/react"

const MapPopup = ({ type, item, handleSelectItem, setSelectedItem, setSelectedMapPopupItem }) => {
  const openItemDetail = (item) => {
    setSelectedItem(item)
    setSelectedMarker(item)
    handleSelectItem(item)
  }

  useEffect(() => {
    setSelectedMapPopupItem(item)
  }, [])

  const getContent = () => {
    try {
      const list = item.items

      if (type === "job") {
        return (
          <div className="c-mapbox-container">
            <Flex ml="16px" my="16px" alignItems="center" direction="row">
              <Image mr="8px" width="24px" src={jobIcon} alt="" />
              <Text as="span" fontSize="16px" fontWeight={700} color="black">
                {`Opportunité${list.length > 1 ? "s" : ""} d'emploi`}
              </Text>
            </Flex>
            <div className="c-mapbox-address mx-3 my-2 mb-3">{getJobAddress(list[0])}</div>
            <div className="c-mapbox-bg">
              <div className="ml-3">
                <ul className="c-mapbox-list">
                  {list.map((job, idx) => (
                    <li className={`c-mapbox-list-item ${idx === list.length - 1 ? "is-last" : ""} ${idx === 0 ? "is-first" : ""}`} key={idx}>
                      <button
                        className={`c-mapboxpopup--link gtmSavoirPlus gtm${capitalizeFirstLetter(job.ideaType)} gtmMap`}
                        aria-label="Accéder au détail de l'opportunité"
                        onClick={() => openItemDetail(job)}
                      >
                        {job.title}
                      </button>
                      {job.ideaType === "peJob" && job?.company?.name ? <span className="c-mapbox-companyname">- {job.company.name}</span> : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="mapboxPopupFormation">
            <Flex ml="16px" my="16px" alignItems="center" direction="row">
              <Image mr="8px" width="24px" src={bookIcon} alt="" />
              <Text as="span" fontSize="16px" fontWeight={700} color="black">
                Formations :
              </Text>
            </Flex>
            <div className="mapboxPopupPlace mx-3 my-2">{list[0].company.name}</div>
            <div className="mapboxPopupAddress mx-3 my-2 mb-3">{list[0].place.fullAddress}</div>
            <div className="mapboxPopupBg">
              <div className="">
                <div className="ml-2">
                  <ul className="mapboxPopupDescr">{getTrainings(list)}</ul>
                </div>
              </div>
            </div>
          </div>
        )
      }
    } catch (err) {
      logError(`Popup error ${type}`, err)
      console.log("Erreur de format des éléments emplois : ", type, item)
      return (
        <ErrorMessage
          message={
            <div className="popupError">
              Le format de l&apos;élément sélectionné est erroné.
              <br />
              <br />
              Veuillez accepter nos excuses.
              <br />
              L&apos;équipe Labonnealternance.
            </div>
          }
        />
      )
    }
  }

  const getTrainings = (list) => {
    let result = (
      <>
        {list.map((training, idx) => (
          <li key={idx} className="c-mapboxpopup-li">
            <span>
              <button className={`c-mapboxpopup--link gtmSavoirPlus gtmFormation gtmMap`} aria-label="Accéder au détail de la formation" onClick={() => openItemDetail(training)}>
                {training.title ? training.title : training.longTitle}
              </button>
            </span>
          </li>
        ))}
      </>
    )
    return result
  }

  return getContent()
}

export default MapPopup
