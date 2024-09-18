import { MongoClient } from 'mongodb'

import { mongDbName, mongoPassword, mongoUrl, mongoUser } from '@constants'

const connUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoUrl}?authSource=admin`

export const client = new MongoClient(connUrl)
const db = client.db(mongDbName)

export default db
