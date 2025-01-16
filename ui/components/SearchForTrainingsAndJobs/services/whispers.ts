import { chunk, forEach, includes, reject } from "lodash-es"

import { astuces } from "../../../config/astuces"

const randomWithin = (collection, limitation = undefined) => {
  let searchLimit = collection.length - 1

  if (limitation !== undefined && limitation < collection.length - 1) {
    searchLimit = limitation
  }

  const randomIndex = Math.floor(Math.random() * (searchLimit + 1))
  return collection[randomIndex]
}

export { randomWithin }

function anyMessageAmongst(messages, alreadyShownMessages = []) {
  if (alreadyShownMessages.length > 0 && alreadyShownMessages.length <= messages.length) {
    const filteredMessages = reject(messages, (m) => {
      return includes(alreadyShownMessages, m.message)
    })
    return randomWithin(filteredMessages)
  } else {
    return randomWithin(messages)
  }
}

export async function insertWhisper(document, isLoadingData) {
  if (isLoadingData) {
    return "loading data : no change"
  }

  const resultCards = document.getElementsByClassName("resultCard")

  document.querySelectorAll(".whisper").forEach((element) => {
    element.remove()
  })

  if (resultCards.length === 0) {
    return "no resultCard found"
  }

  const resultCardsBlocks = chunk(resultCards, 20)
  const alreadyShownMessages = []
  forEach(resultCardsBlocks, async (resultCardsBlock, indx) => {
    const msg = anyMessageAmongst(astuces, alreadyShownMessages)
    alreadyShownMessages.push(msg)
    const randomlyChosenResultCard = randomWithin(resultCardsBlock, 10)
    domInsertion(document, randomlyChosenResultCard, msg, indx)
  })

  return "whisper randomly inserted"
}

function domInsertion(document, randomlyChosenResultCard, msg, indx = 0) {
  const whisperNode = document.createElement("div")
  whisperNode.classList.add("whisper")
  whisperNode.setAttribute("data-testid", `whisper${indx}`)
  whisperNode.innerHTML = getHTML(msg.message, msg.lien)
  insertAfter(randomlyChosenResultCard, whisperNode)
}

function getHTML(text, link) {
  return `<div style="margin-left: 25px; margin-right: 25px;margin-top: 25px; margin-bottom: 25px; text-align: left;">
            <div style="display: flex">
              <div style="min-width:40px;margin-right:4px">
                <img src="/images/whisper.svg" alt="" />
              </div>
              <div>
                <div>
                  <div style="font-size:20px; font-weight: 700;color:#3a3a3a;">
                    Psst, nous avons une <span style="color:#0c0cd0">info pour vous !</span>
                  </div>
                </div>
                <div>
                  <div style="color:#4a4a4a; font-size:14px; font-weight: 500;line-height:24px;margin-top: 6px;padding-right:16px;">
                    ${text}
                    ${getHTMLLink(link)}
                  </div>
                </div>
              </div>
            </div>
          </div>`
}

function getHTMLLink(link) {
  return (
    link &&
    `<span style="margin-top: 6px;display: block;">
                  <a href="${link}" target="_blank" rel="noopener noreferrer" style="display: flex;" title="en savoir plus - nouvelle fenêtre">
                    <span aria-label="Accéder au détail de l'astuce" style="color: #000091;">En savoir plus</span>
                    <img style="margin-left: 5px" src="/images/square_link_blue.svg" alt=""/>
                  </a>
                </span>`
  )
}

function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
}
