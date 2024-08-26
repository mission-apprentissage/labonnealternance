//import assert from "assert"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { createApplicationTest, createRecruteurLbaTest } from "@tests/utils/user.test.utils"
import { describe, expect, it } from "vitest"

import { getCompanyContactInfo } from "./recruteurLba.service"

describe("/lbacompany/:siret/contactInfo", () => {
  const mockData = async () => {
    await createApplicationTest({ company_siret: "34843069553553", company_email: "application_company_email@test.com", company_name: "fake_company_name" })
    await createRecruteurLbaTest({ email: "recruteur_lba@test.com", phone: "0610101010", siret: "58006820882692", enseigne: "fake_company_name" })
  }

  useMongo(mockData, "beforeAll")

  it("La société issue de l'algo recruteurLba existe", async () => {
    const result = await getCompanyContactInfo({ siret: "58006820882692" })

    expect.soft(result).toStrictEqual({
      active: true,
      siret: "58006820882692",
      enseigne: "fake_company_name",
      phone: "0610101010",
      email: "recruteur_lba@test.com",
    })
  })
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
