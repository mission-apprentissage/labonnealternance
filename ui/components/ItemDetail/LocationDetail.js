import { round } from "lodash"
import React from "react"
import gotoIcon from "../../public/images/icons/goto.svg"
import { capitalizeFirstLetter, endsWithNumber } from "../../utils/strutils"
import { getCompanyPathLink, getPathLink } from "../../utils/tools"
import { string_wrapper as with_str } from "../../utils/wrapper_utils"
import ExternalLink from "../externalLink"

const LocationDetail = ({ item, isCfa }) => {
  const kind = item?.ideaType

  const getGoogleSearchParameters = () => {
    return encodeURIComponent(`${item.company.name} ${item.place.address}`)
  }

  let companySize = item?.company?.size?.toLowerCase()
  if (!companySize) {
    companySize = "non renseigné"
  } else if (companySize.startsWith("0")) {
    companySize = "0 à 9 salariés"
  }
  if (endsWithNumber(companySize)) {
    companySize += " salariés"
  }

  const getTitle = (oneItem) => {
    const oneKind = oneItem?.ideaType
    const isMandataire = item?.company?.mandataire
    let res = "Quelques informations sur l'entreprise"
    if (oneKind === "formation") {
      res = "Quelques informations sur le centre de formation"
    } else if (oneKind === "matcha" && !isMandataire) {
      res = "Quelques informations sur l'établissement"
    } else if (oneKind === "matcha" && isMandataire) {
      res = "Contactez le CFA pour avoir plus d'informations"
    }
    return res
  }

  const shouldDisplayEmail = (oneItem) => {
    let res = false
    const oneKind = oneItem?.ideaType
    if (oneKind === "matcha") {
      res = !!item?.company?.mandataire
    } else if (oneKind === "lbb" || oneKind === "lba") {
      res = false
    } else if (oneKind === "peJob") {
      res = false
    } else {
      res = !!item?.contact?.email && !item?.prdvUrl
    }
    if (res) {
      // au cas où : on n'affiche l'email que si il n'est pas chiffré
      res = with_str("@").in(item?.contact?.email)
    }
    return res
  }

  return (
    <>
      {kind === "matcha" && item?.company?.mandataire ? (
        <div className="c-detail-body c-locationdetail mt-4">
          <h2 className="c-locationdetail-title mt-2">{getTitle({})}</h2>

          <div className="c-locationdetail-line mt-1">
            <span className="c-detail-sizetext">
              <strong>Taille de l&apos;entreprise :&nbsp;</strong> {companySize}
            </span>
          </div>
          <div className="c-locationdetail-line mt-1">
            <span className="c-detail-sizetext">
              <strong>Secteur d&apos;activité :&nbsp;</strong> {item?.nafs[0]?.label}
            </span>
          </div>
          {item?.company?.creationDate && !isNaN(new Date(item.company.creationDate)) ? (
            <div className="c-locationdetail-line mt-1">
              <span className="c-detail-sizetext">
                <strong>Année de création de l&apos;entreprise :&nbsp;</strong> {new Date(item.company.creationDate).getFullYear()}
              </span>
            </div>
          ) : (
            ""
          )}
          <div className="c-locationdetail-address mt-2">{item?.company?.place?.city}</div>
          {item?.place?.distance ? <div className="c-locationdetail-distance">{`${round(item.place.distance, 1)} km(s) du lieu de recherche`}</div> : ""}
          <div className="c-locationdetail-line mt-3">
            <span className="c-locationdetail-imgcontainer">
              <img className="" src="/images/icons/small_map_point.svg" alt="Adresse" />
            </span>
            <span className="c-detail-sizetext">
              <ExternalLink
                className={`c-nice-link font-weight-normal gtm${capitalizeFirstLetter(kind)} gtmPathLink`}
                url={getCompanyPathLink(item)}
                title="Obtenir l'itinéraire"
                withPic={<img className="mt-n1 ml-1" src="/images/square_link.svg" alt="Ouverture dans un nouvel onglet" />}
              />
            </span>
          </div>
        </div>
      ) : (
        ""
      )}

      <div className="c-detail-body c-locationdetail mt-4">
        <h2 className="c-locationdetail-title mt-2">{getTitle(item)}</h2>

        {item?.company?.mandataire ? (
          <div className="c-locationdetail-address mt-4">Le centre de formation peut vous renseigner sur cette offre d’emploi ainsi que les formations qu’il propose.</div>
        ) : (
          ""
        )}

        <div className="c-locationdetail-address mt-4">{item?.place?.fullAddress}</div>

        {item?.place?.distance && !item?.company?.mandataire ? (
          <div className="c-locationdetail-distance">{`${round(item.place.distance, 1)} km(s) du lieu de recherche`}</div>
        ) : (
          ""
        )}

        <div className="c-locationdetail-line mt-3">
          <span className="c-locationdetail-imgcontainer">
            <img className="" src="/images/icons/small_map_point.svg" alt="Adresse" />
          </span>
          <span className="c-detail-sizetext">
            <ExternalLink
              className={`c-nice-link font-weight-normal gtm${capitalizeFirstLetter(kind)} gtmPathLink`}
              url={getPathLink(item)}
              title="Obtenir l'itinéraire"
              withPic={<img className="mt-n1 ml-1" src="/images/square_link.svg" alt="Ouverture dans un nouvel onglet" />}
            />
          </span>
        </div>

        {item?.company?.url ? (
          <>
            <div className="c-locationdetail-line mt-1">
              <span className="c-locationdetail-imgcontainer">
                <img className="" src="/images/icons/small_info.svg" alt="A noter" />
              </span>
              <span className="c-detail-sizetext">
                <span className="">En savoir plus sur &nbsp;</span>
                <ExternalLink className="c-nice-link gtmTrainingLink" url={item.company.url} title={item.company.url} />
              </span>
            </div>
          </>
        ) : (
          ""
        )}

        {shouldDisplayEmail(item) ? (
          <div className="c-locationdetail-line mt-1">
            <span className="c-locationdetail-imgcontainer">
              <img className="" src="/images/icons/small_email.svg" alt="Email" />
            </span>
            <span className="c-detail-sizetext">{item.contact.email}</span>
          </div>
        ) : (
          ""
        )}

        {item?.contact?.phone ? (
          <>
            <div className="c-locationdetail-line mt-1 mb-3">
              <span className="c-locationdetail-imgcontainer c-locationdetail-imgcontainer--smallphone">
                <img className="" src="/images/icons/small_phone.svg" alt="Téléphone" />
              </span>
              <ExternalLink
                className="c-nice-link"
                url={`tel:${item.contact.phone}`}
                title={item.contact.phone}
                withPic={<img src={gotoIcon} alt={`Lien cliquable vers le numéro ${item.contact.phone}`} />}
              />
            </div>
          </>
        ) : (
          ""
        )}

        {isCfa ? (
          <>
            <div className="pb-3">
              <div className="c-detail-newadvice">
                <div className="pt-1 mb-2">
                  <img src="/images/info.svg" alt="Information pratique" width="24" height="24" />
                  <span className="c-detail-newadvice-title ml-2">Cet établissement est un CFA d&apos;entreprise</span>
                </div>
                <p>
                  La particularité ? Il s&apos;agit d&apos;une formule complète <strong>Emploi + Formation</strong> ! Cette formation vous intéresse ? La marche à suivre diffère
                  selon le CFA d&apos;entreprise concerné :
                </p>
                <ul>
                  <li>Commencez par vous inscrire à la formation pour accéder ensuite au contrat,</li>
                  <li>Ou commencez par postuler à une offre d&apos;emploi pour être ensuite inscrit en formation.</li>
                </ul>
                <p>Prenez contact avec cet établissement ou consultez son site web pour en savoir + !</p>
                <p>
                  Vous vous posez des questions sur votre orientation ou votre recherche d’emploi ?
                  <span className="ml-1">
                    <ExternalLink
                      className="c-nice-link"
                      url="https://dinum-beta.didask.com/courses/demonstration/60abc18c075edf000065c987"
                      title="Préparez votre premier contact avec un CFA"
                      withPic={<img src={gotoIcon} alt="Ouverture dans un nouvel onglet" />}
                    />
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : (
          <></>
        )}

        {kind === "matcha" || kind === "lbb" || kind === "lba" ? (
          <>
            <div className="c-locationdetail-line mt-1">
              <span className="c-locationdetail-imgcontainer">
                <img className="" src="/images/info.svg" alt="A noter" />
              </span>
              <span className="c-detail-sizetext mb-0">
                En savoir plus sur&nbsp;
                <ExternalLink
                  className="c-nice-link gtmGoogleLink"
                  url={`https://www.google.fr/search?q=${getGoogleSearchParameters()}`}
                  title={item.company.name}
                  withPic={<img className="mt-n1 ml-1" src="/images/square_link.svg" alt="Ouverture dans un nouvel onglet" />}
                />
              </span>
            </div>
            <div className="c-locationdetail-line mt-1 mb-1">
              <span className="c-locationdetail-imgcontainer"></span>
              <span className="c-detail-sizetext c-locationdetail-hint">Renseignez-vous sur l&apos;établissement pour préparer votre candidature</span>
            </div>
            {!item?.company?.mandataire ? (
              <div className="c-locationdetail-line mb-1">
                <span className="c-locationdetail-imgcontainer"></span>
                <span className="c-detail-sizetext">
                  <strong>Taille de l&apos;entreprise :&nbsp;</strong> {companySize}
                </span>
              </div>
            ) : (
              ""
            )}
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  )
}

export default LocationDetail
