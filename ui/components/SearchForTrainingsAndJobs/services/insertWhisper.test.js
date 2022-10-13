import whispers from "./whispers";
import { queryByTestId, queryAllByTestId, queryAllByRole } from '@testing-library/dom'
import { fireEvent, waitFor } from "@testing-library/react";

import nock from "nock";

describe('insertWhisper', () => {

  function setupNock() {
    nock('https://raw.githubusercontent.com/mission-apprentissage/labonnealternance/datasets')
      .get('/ui/config/astuces.csv')
      .reply(200,
        `;ID;Thème;Message;Lien externe;Astuces vague 1;Astuces vague 2 (contextualisables ou décalage politique)
            ;FOR_COMB;Formation;Combien de personnes qui préparaient le diplôme que vous visez ont interrompu leurs études avant la fin ? La réponse ici ! ;https://www.inserjeunes.education.gouv.fr/diffusion/accueil;oui;oui `)
  }

  beforeEach(() => {
    nock.disableNetConnect();
  });

  it('insertWhisper() : do not insert anything if data are loading', async () => {
    document.body.innerHTML =
      '<div>' +
      '  <span class="whisper">Im a whisper</span>' +
      '</div>';
    let res = await whispers.insertWhisper(document, true)
    expect(res).toEqual('loading data : no change')
  });

  it('insertWhisper() : do not insert anything if whisper already here', async () => {
    document.body.innerHTML =
      '<div>' +
      '  <span class="whisper">Im a whisper</span>' +
      '</div>';
    let res = await whispers.insertWhisper(document)
    expect(res).toEqual('whisper already exists : no change')
  });

  it('insertWhisper() : do not insert anything if there is no resultCard', async () => {
    document.body.innerHTML =
      '<div>' +
      '  Empty div, empty document' +
      '</div>';
    let res = await whispers.insertWhisper(document)
    expect(res).toEqual('no resultCard found : no change')
  });
  
  it('insertWhisper() : insert a whisper if more than 9 resultCard', async () => {

    setupNock()
    document.body.innerHTML =
    '<div id="app">' +
    '  <span class="resultCard">1</span>' +
    '  <span class="resultCard">2</span>' +
    '  <span class="resultCard">3</span>' +
    '  <span class="resultCard">4</span>' +
    '  <span class="resultCard">5</span>' +
    '  <span class="resultCard">6</span>' +
    '  <span class="resultCard">7</span>' +
    '  <span class="resultCard">8</span>' +
    '  <span class="resultCard">9</span>' +
    '  <span class="resultCard">10</span>' +
    '</div>';
    let res = await whispers.insertWhisper(document)
    const container = document.querySelector('#app')
    const whisper = queryByTestId(container, 'whisper0')
    expect(whisper).not.toBeNull();
    expect(res).toEqual('whisper randomly inserted')
  });

});
