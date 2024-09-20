import { gmail_v1, google } from 'googleapis'

import { GmailCollection, GmailDocument } from '@api/gmail/model'
import { KeyDocument } from '@api/keys/model'
import dayjs from '@services/dayjs'
import { urlB64Decode } from '@services/decode'

import { getClient } from '.'

export async function getEmails(key: KeyDocument): Promise<GmailDocument[]> {
    const client = await getClient(key.oauth)
    const gmail = google.gmail({
        auth: client,
        version: 'v1',
    })

    const res = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
    })

    const parsedEmails: GmailDocument[] = []

    for (const message of res.data.messages || []) {
        if (!message.id) {
            continue
        }

        const existing = await GmailCollection.findOne({ gmailId: message.id })
        if (existing) {
            parsedEmails.push(existing)
            continue
        }

        const mail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
        })

        let textPlain: string = ''
        let textHtml: string = ''

        if (mail.data.payload?.mimeType === 'text/html') {
            textHtml = urlB64Decode(mail.data.payload.body?.data as string)
        } else {
            textPlain =
                extractEmailContent(
                    mail.data.payload?.parts || [],
                    'text/plain',
                ) || ''
            textHtml =
                extractEmailContent(
                    mail.data.payload?.parts || [],
                    'text/html',
                ) || ''
        }

        const ts = parseInt(mail.data.internalDate as string, 10) as number
        const date = dayjs(ts || dayjs().unix() * 1000).toDate()

        const from =
            mail.data.payload?.headers?.find((h) => h.name === 'From')?.value ||
            ''
        const to =
            mail.data.payload?.headers?.find((h) => h.name === 'To')?.value ||
            ''
        const subject =
            mail.data.payload?.headers?.find((h) => h.name === 'Subject')
                ?.value || ''

        const { insertedId } = await GmailCollection.insertOne({
            gmailId: mail.data.id!,
            gmailThreadId: mail.data.threadId || undefined,
            chatId: key.chatId,
            date,
            from,
            to,
            subject,
            textHtml,
            textPlain,
            gmailLabels: mail.data.labelIds || [],
            rawResponse: mail.data,
        })

        parsedEmails.push((await GmailCollection.findOne({ _id: insertedId }))!)
    }

    return parsedEmails
}

function extractEmailContent(
    parts: gmail_v1.Schema$MessagePart[],
    mimeType: string,
): string | null {
    const found = parts.find((p) => p.mimeType === mimeType)
    if (found) {
        return urlB64Decode(found.body?.data || '')
    } else {
        for (const part of parts) {
            const drill = extractEmailContent(part.parts || [], mimeType)
            if (drill !== null) {
                return drill
            }
        }
    }
    return null
}
