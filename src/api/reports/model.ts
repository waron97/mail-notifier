import { ObjectId } from 'mongodb'

import db from '@services/mongo'

export type Report = {
    text: string
    latestEmailId: string
    chatId: number
    createdAt: date
}

export type ReportDocument = Report & {
    _id: ObjectId
}

export const reportsCollectionName = 'reports'

export const ReportsCollection = db.collection<Report>(reportsCollectionName)

export const viewReport = (key: ReportDocument | ObjectId) => {
    if (key instanceof ObjectId) {
        return { id: key.toHexString() }
    } else {
        const { _id } = key
        return {
            id: _id.toHexString(),
        }
    }
}
