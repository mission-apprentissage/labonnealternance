"use strict";

/**
 * @description Initializes widgets.
 * @returns {Promise<{siret: {String}, cfd: {String}: referrer: {String}, data: {Object} }[]>}
 */
window.initPrdvWidget = function () {
  var promises = Object.values(document.getElementsByClassName("widget-prdv")).map(createWidgetPRDV);
  return Promise.all(promises);
};
/**
 * @description Creates button if allowed.
 * @param {HTMLCollectionOf<Element>} element - DOM element
 * @returns {Promise<Object>}
 */


function createWidgetPRDV(element) {
  element.innerHTML = "";
  return fetch("".concat("https://rdv-cfa.apprentissage.beta.gouv.fr", "/api/appointment-request/context/create"), {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(element.dataset)
  }).then(function (response) {
    return response.json();
  }).then(function (data) {
    if (data && !data.error) {
      var a = document.createElement("a");
      var link = document.createTextNode("Prendre rendez-vous");
      a.appendChild(link);
      a.title = "Prendre rendez-vous";
      a.target = '_blank';
      a.href = data.form_url;
      element.appendChild(a);
    }

    return data;
  })["catch"](console.error);
}
