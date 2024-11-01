import cron from 'node-cron'

import { GmailCollection } from '@api/gmail/model'
import { KeysCollection } from '@api/keys/model'
import { logger } from '@api/logs/sevice'
import { createReport } from '@api/reports/service'
import { getEmailSummary } from '@services/ai'
import dayjs, { ITALY } from '@services/dayjs'
import { getEmails } from '@services/google/gmail'
import { sendMessage } from '@services/telegram'

export function scheduleJobs() {
    cron.schedule('*/3 * * * *', scanEmails, {
        timezone: 'Europe/Rome',
    })
    cron.schedule('0 20 * * *', sendReports, {
        timezone: 'Europe/Rome',
    })
}

export async function scanEmails() {
    // eslint-disable-next-line
    logger.log('[Job Start] scanEmails')

    const docs = KeysCollection.find({ oauth: { $exists: true } })
    for await (const doc of docs) {
        try {
            const emails = await getEmails(doc)

            const threshold = dayjs()
                .subtract(1, 'day')
                .hour(20)
                .startOf('hour')
            const recentEmails = emails.filter((m) => {
                return dayjs(m.date).isAfter(threshold)
            })

            const userEmail = doc.userInfo.email || ''

            for (const email of recentEmails) {
                const { textPlain, textHtml, aiSummary, from } = email

                if (aiSummary || from.includes(userEmail)) {
                    continue
                }

                const summary = await getEmailSummary(
                    textPlain || textHtml,
                    from,
                )
                await GmailCollection.updateOne(
                    { gmailId: email.gmailId },
                    {
                        $set: {
                            aiSummary: summary,
                        },
                    },
                )

                if (
                    summary.includes('Important!') &&
                    email.gmailLabels.includes('UNREAD')
                ) {
                    sendMessage(
                        doc.chatId,
                        [
                            `Mittente: ${email.from}`,
                            `Ora: ${dayjs(email.date).tz(ITALY).format('HH:mm')}`,
                            `${summary}`,
                        ].join('\n'),
                    )
                }
            }
            await KeysCollection.updateOne(
                { _id: doc._id },
                { $set: { lastScanState: 'success' } },
            )
        } catch (err) {
            if (err instanceof Error) {
                logger.error(
                    `[ERR @ scanEmails] ${err.message}\n\n${err.stack}`,
                )
                if (err.message.includes('invalid_grant')) {
                    await KeysCollection.updateOne(
                        { _id: doc._id },
                        { $set: { lastScanState: 'error' } },
                    )
                    if (doc.lastScanState !== 'error') {
                        sendMessage(
                            doc.chatId,
                            `Permesso scaduto per visualizzare le tue. Effettuare nuovamente l'autenticazione mandando il messaggio "/start".`,
                        )
                    }
                } else {
                    sendMessage(doc.chatId, `[ERR @ scanEmails] ${err}`)
                }
            }
        }
    }
}

export async function sendReports() {
    // eslint-disable-next-line
    logger.log('[Job Start] sendReports')
    const docs = KeysCollection.find({ oauth: { $exists: true } })
    for await (const key of docs) {
        try {
            const summary = await createReport(key)
            if (summary) {
                sendMessage(
                    key.chatId,
                    `Here's your daily recap:\n\n${summary.text}`,
                )
            } else {
                sendMessage(key.chatId, 'Nessuna mail ricevuta')
            }
        } catch (err) {
            sendMessage(key.chatId, `[ERR @ scanEmails] ${err}`)
        }
    }
}
