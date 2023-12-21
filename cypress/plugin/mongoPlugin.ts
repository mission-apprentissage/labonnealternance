import mongodb from "mongodb"

const { MongoClient } = mongodb

// Replace the placeholder with your Atlas connection string

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

export const executeMongoDb =
  (config) =>
  async ({ commandName, args, collection }) => {
    const uri = config.env("MONGODB_URI")
    const database = config.env("MONGODB_DATABASE")
    if (!uri || !database) {
      throw new Error("uri and database are required")
    }
    const client = new MongoClient(uri, {})
    try {
      // Connect the client to the server (optional starting in v4.7)
      await client.connect()
      const result = await client
        .db(database)
        .collection(collection)
        [commandName](...args)
      return result
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close()
    }
  }
