import { MongoClient } from "mongodb"

// Replace the placeholder with your Atlas connection string
const { uri, database } = Cypress.env("mongodb")

if (!uri || !database) {
  throw new Error("uri and database are required")
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {})

export async function executeMongoDb({ commandName, args, collection }) {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect()
    await client
      .db(database)
      .collection(collection)
      [commandName](...args)
    console.log("Pinged your deployment. You successfully connected to MongoDB!")
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
  }
}
