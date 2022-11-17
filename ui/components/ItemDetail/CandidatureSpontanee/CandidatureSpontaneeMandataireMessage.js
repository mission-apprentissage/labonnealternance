import React from "react"

const CandidatureSpontaneeMandataireMessage = ({ item }) => {
  return item?.company?.mandataire ? (
    <div className="c-candidature-terms">
      <table>
        <tbody>
          <tr>
            <td className="align-top pr-2">
              <img src="/images/info.svg" alt="information" />
            </td>
            <td>
              Votre candidature sera envoyée au centre de formation en charge du recrutement pour le compte de l’entreprise.
              <br />
              <strong>Vous pouvez candidater à l’offre même si vous avez déjà trouvé votre formation par ailleurs.</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ) : (
    ""
  )
}

export default CandidatureSpontaneeMandataireMessage
