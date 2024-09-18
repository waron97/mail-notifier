import cron from 'node-cron'

import { GmailCollection } from '@api/gmail/model'
import { KeysCollection } from '@api/keys/model'
import { createReport } from '@api/reports/service'
import { getEmailSummary } from '@services/ai'
import dayjs from '@services/dayjs'
import { getEmails } from '@services/google/gmail'
import { sendMessage } from '@services/telegram'

export function scheduleJobs() {
    cron.schedule('*/10 * * * *', scanEmails, {
        timezone: 'Europe/Rome',
    })
    cron.schedule('0 20 * * *', sendReports, {
        timezone: 'Europe/Rome',
    })
}

export async function scanEmails() {
    const docs = KeysCollection.find({ oauth: { $exists: true } })
    for await (const doc of docs) {
        const emails = await getEmails(doc)
        const threshold = dayjs().subtract(1, 'day').hour(20).startOf('hour')
        const recentEmails = emails.filter((m) => {
            return dayjs(m.date).isAfter(threshold)
        })

        for (const email of recentEmails) {
            const { textPlain, textHtml, aiSummary, from } = email

            if (aiSummary) {
                continue
            }

            const summary = await getEmailSummary(textPlain || textHtml, from)
            await GmailCollection.updateOne(
                { gmailId: email.gmailId },
                {
                    $set: {
                        aiSummary: summary,
                    },
                },
            )

            if (summary.includes('Importante!')) {
                sendMessage(
                    doc.chatId,
                    [
                        'Hai ricevuto una mail che potrebbe essere importante',
                        '',
                        '',
                        `Mittente: ${email.from}`,
                        `Ora: ${dayjs(email.date).format('HH:mm')}`,
                        `${summary}`,
                    ].join('\n'),
                )
            }
        }
    }
}

export async function sendReports() {
    const docs = KeysCollection.find({ oauth: { $exists: true } })
    for await (const key of docs) {
        const summary = await createReport(key)
        if (summary) {
            sendMessage(key.chatId, summary.text)
        } else {
            sendMessage(key.chatId, 'Nessuna mail ricevuta')
        }
    }
}
