import { chunk, forEach, includes, reject } from "lodash"
import axios from "axios"
import csvToArray from "../../../utils/csvToArray.js"
import { randomWithin } from "../../../utils/arrayutils"
import { SendTrackEvent } from "../../../utils/plausible"

function anyMessageAmongst(messages, alreadyShownMessages = []) {
  if (alreadyShownMessages.length > 0 && alreadyShownMessages.length <= messages.length) {
    const filteredMessages = reject(messages, (m) => {
      return includes(alreadyShownMessages, m.Message)
    })
    return randomWithin(filteredMessages)
  } else {
    return randomWithin(messages)
  }
}

async function getAllMessages() {
  const response = await axios.get("https://raw.githubusercontent.com/mission-apprentissage/labonnealternance/datasets/ui/config/astuces.csv")
  const csv = csvToArray(response.data)
  const cleanedCsv = csv
    .filter((e) => e.Message)
    .map((e) => {
      delete e[""]
      e.link = e["Lien externe"].split(" ")[0]
      delete e["Lien externe"]
      return e
    })
  return cleanedCsv
}

async function insertWhisper(document, isLoadingData) {
  if (isLoadingData) return "loading data : no change"

  const whisperSize = document.getElementsByClassName("whisper").length
  const resultCards = document.getElementsByClassName("resultCard")
  const resultCardSize = resultCards.length

  if (whisperSize > 0) return "whisper already exists : no change"
  if (resultCardSize === 0) return "no resultCard found : no change"

  const allMessages = await getAllMessages()

  const resultCardsBlocks = chunk(resultCards, 20)
  let alreadyShownMessages = []
  forEach(resultCardsBlocks, async (resultCardsBlock, indx) => {
    const msg = anyMessageAmongst(allMessages, alreadyShownMessages)
    alreadyShownMessages.push(msg)
    const randomlyChosenResultCard = randomWithin(resultCardsBlock, 10)
    domInsertion(document, randomlyChosenResultCard, msg, indx)
  })

  return "whisper randomly inserted"
}

function domInsertion(document, randomlyChosenResultCard, msg, indx = 0) {
  let whisperNode = document.createElement("div")
  whisperNode.classList.add("whisper")
  whisperNode.setAttribute("data-testid", `whisper${indx}`)
  whisperNode.innerHTML = getHTML(msg.Message, msg.link, msg["Thème"], msg["ID"])
  insertAfter(randomlyChosenResultCard, whisperNode)
}

function getHTML(text, link) {
  window["SendTrackEvent"] = SendTrackEvent

  return `<div class="resultCard gtmWhisper">
            <div class="c-media">
              <div class="c-media-figure">
                <img className="c-whisper-img" src="/images/whisper.svg" alt="" />
              </div>
              <div class="c-media-body">
                <div class="row no-gutters">
                  <div class="col-12 text-left">
                    <div class="whisper-title d-inline-block">Psst, nous avons une <span class="whisper-title-special">info pour vous !</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="cardText pt-2 whisper-text">
                    ${text}
                    <span class="d-block mt-2">${!!link ? getHTMLLink(link) : ""}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>`
}

function getHTMLLink(link) {
  return `<a href="${link}" target="_blank" class="gtmWhisperLink" rel="noopener noreferrer">
                  <img className="mt-n1 ml-1" src="/images/square_link.svg" alt="Ouverture dans un nouvel onglet" />
                  <span className="ml-1">En savoir plus</span>
                </a>`
}

function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
}

const exportFunctions = {
  insertWhisper,
  getAllMessages,
}

export default exportFunctions
