//import assert from "assert"

import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { createApplicationTest, createRecruteurLbaTest } from "@tests/utils/user.test.utils"
import { describe, expect, it } from "vitest"

describe("/lbacompany/:siret/contactInfo", () => {
  const httpClient = useServer()

  let adminBearerToken: { Cookie: string } | null = null
  let cfaBearerToken: { Cookie: string } | null = null

  const mockData = async () => {
    await createApplicationTest({ company_siret: "34843069553553", company_email: "application_company_email@test.com", company_name: "fake_company_name" })
    await createRecruteurLbaTest({ email: "recruteur_lba@test.com", phone: "0610101010", siret: "58006820882692", enseigne: "fake_company_name" })
  }

  useMongo(mockData, "beforeAll")

  it("Vérifie qu'on peut accéder à la ressource en tant qu'administrateur", async () => {
    adminBearerToken = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    console.log("ADMIN : ", adminBearerToken)
    const response = await httpClient().inject({ method: "GET", path: "/api/lbacompany/58006820882692/contactInfo", headers: adminBearerToken })
    expect(response.statusCode).toBe(200)
  })
  it.skip("Vérifie qu'on ne peut pas accéder à la ressource en tant que CFA", async () => {
    cfaBearerToken = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const response = await httpClient().inject({ method: "GET", path: "/api/lbacompany/58006820882692/contactInfo", headers: cfaBearerToken })
    expect(response.statusCode).toBe(200)
  })

  // it("Vérifie que la route retourne ")
})

/*
Liste des tests envisagés

  récupération société issue de l'algo exisante
  -> retour active: true, email = fixture, phone = fixture, enseigne ...

  récupération société issue de l'algo pas existante mais présente dans applications
  -> retoune active: false, email = "", phone ="" ; enseigne = fixture

  récupération ni soc ni app
  -> retourne 404

  enregistremen modifs société issue de l'algo suppression email et suppression phone
  -> génération de deux events delete
  -> société issue de l'algo a pour email et phone ""

  enregistrement modifs suppression société inexistante dans lbarecruteur et application
  -> il ne se passe rien

  enregistrement modifs suppression société inexistante dans lbarecruteur mais dispo dans application
  -> il ne se passe rien

  enregistrement modifs valeurs société présente dans lbarecruteur 
  -> data modifiés dans lbarecruteur
  -> events update enregistrés

  enregistrement modifs valeurs dans application
  -> ajout des events update
  
  enregistrement modifs valeurs 



*/
