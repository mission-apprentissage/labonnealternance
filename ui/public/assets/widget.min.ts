window.initPrdvWidget = function () {
  const promises = Object.values(document.getElementsByClassName("widget-prdv")).map(createWidgetPRDV)
  return Promise.all(promises)
}

function createWidgetPRDV(element) {
  element.innerHTML = ""
  return fetch("https://labonnealternance.apprentissage.beta.gouv.fr/api/appointment-request/context/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(element.dataset),
  })
    .then(function (response) {
      return response.json()
    })
    .then(function (data) {
      if (data && !data.error) {
        const a = document.createElement("a")
        const link = document.createTextNode("Prendre rendez-vous")
        a.appendChild(link)
        a.title = "Prendre rendez-vous"
        a.target = "_blank"
        a.href = data.form_url
        element.appendChild(a)
      }
      return data
    })
    ["catch"](console.error)
}
