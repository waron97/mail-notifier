import { gmail_v1 } from 'googleapis'
import { ObjectId } from 'mongodb'

import db from '@services/mongo'

export type Gmail = {
    gmailId: string
    gmailThreadId?: string
    chatId: number
    rawResponse: gmail_v1.Schema$Message
    from: string
    to: string
    date: Date
    textPlain: string
    textHtml: string
    subject: string
    aiSummary?: string
}

export type GmailDocument = Gmail & {
    _id: ObjectId
}

export const gmailCollectionName = 'gmail'

export const GmailCollection = db.collection<Gmail>(gmailCollectionName)

export const viewGmail = (key: GmailDocument | ObjectId) => {
    if (key instanceof ObjectId) {
        return { id: key.toHexString() }
    } else {
        const { _id } = key
        return {
            id: _id.toHexString(),
        }
    }
}
