import { ObjectId } from 'mongodb'

import db from '@services/mongo'

export type Log = {
    message: string
    level: 'info' | 'warning' | 'error'
    date: Date
}

export type LogDocument = Log & {
    _id: ObjectId
}

export const logsCollectionName = 'logs'

export const LogsCollection = db.collection<Log>(logsCollectionName)

export const viewLog = (key: LogDocument | ObjectId) => {
    if (key instanceof ObjectId) {
        return { id: key.toHexString() }
    } else {
        const { _id } = key
        return {
            id: _id.toHexString(),
        }
    }
}
