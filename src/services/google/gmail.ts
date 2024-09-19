import dayjs from 'dayjs'
import { google } from 'googleapis'

import { GmailCollection, GmailDocument } from '@api/gmail/model'
import { KeyDocument } from '@api/keys/model'
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

        if (
            mail.data.payload?.mimeType === 'multipart/alternative' ||
            mail.data.payload?.mimeType === 'multipart/related'
        ) {
            const textPart = mail.data.payload?.parts?.find(
                (part) => part.mimeType === 'text/plain',
            )
            const htmlPart = mail.data.payload?.parts?.find(
                (part) => part.mimeType === 'text/html',
            )
            textPlain =
                typeof textPart?.body?.data === 'string'
                    ? urlB64Decode(textPart.body.data)
                    : ''
            textHtml =
                typeof htmlPart?.body?.data === 'string'
                    ? urlB64Decode(htmlPart?.body.data)
                    : ''
        } else if (mail.data.payload?.mimeType === 'multipart/mixed') {
            const parts = mail.data.payload?.parts ?? []
            const innerParts = parts.find(
                (p) => p.mimeType === 'multipart/alternative',
            )?.parts

            const textPart =
                parts?.find((part) => part.mimeType === 'text/plain') ||
                innerParts?.find((part) => part.mimeType === 'text/plain')
            const htmlPart =
                parts?.find((part) => part.mimeType === 'text/html') ||
                innerParts?.find((part) => part.mimeType === 'text/html')
            textPlain =
                typeof textPart?.body?.data === 'string'
                    ? urlB64Decode(textPart.body.data)
                    : ''
            textHtml =
                typeof htmlPart?.body?.data === 'string'
                    ? urlB64Decode(htmlPart?.body.data)
                    : ''
        } else if (mail.data.payload?.mimeType === 'text/html') {
            textHtml = urlB64Decode(mail.data.payload.body?.data as string)
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
