import { chunk, forEach, includes, reject } from "lodash"
import axios from "axios"
import csvToArray from "../../../utils/csvToArray.js"
import { randomWithin } from "../../../utils/arrayutils"

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
  return `<div style="margin-left: 25px; margin-right: 25px;margin-top: 25px; margin-bottom: 25px; text-align: left;">
            <div style="display: flex">
              <div style="width: 60px;min-width:40px;margin-right:4px">
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
                    <span style="margin-top: 6px;display: block;">${!!link ? getHTMLLink(link) : ""}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>`
}

function getHTMLLink(link) {
  return `<a href="${link}" target="_blank" rel="noopener noreferrer" style="display: flex;">
            <span aria-label="Accéder au détail de l'astuce">En savoir plus</span>
            <img style="margin-left: 5px" src="/images/square_link.svg" alt="Ouverture dans un nouvel onglet" />
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
