import { GmailCollection } from '@api/gmail/model'
import { KeyDocument } from '@api/keys/model'
import { generateReport } from '@services/ai'
import dayjs from '@services/dayjs'

import { ReportsCollection } from './model'

export const createReport = async (key: KeyDocument) => {
    const threshold = dayjs().subtract(1, 'day').hour(20).startOf('hour')
    const emails = await GmailCollection.find({
        chatId: key.chatId,
        date: {
            $gte: threshold.toDate(),
        },
    })
        .sort({ date: -1 })
        .toArray()

    if (emails.length === 0) {
        return null
    }

    const latestReport = (
        await ReportsCollection.find({})
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray()
    )[0]

    if (latestReport) {
        const { latestEmailId } = latestReport
        if (latestEmailId === emails[0]?.gmailId) {
            return latestReport
        }
    }

    const reportText = await generateReport(emails, key.introduction)
    const now = dayjs().toDate()
    const { insertedId } = await ReportsCollection.insertOne({
        chatId: key.chatId,
        createdAt: now,
        text: reportText,
        latestEmailId: emails[0].gmailId,
    })
    return await ReportsCollection.findOne({ _id: insertedId })!
}
