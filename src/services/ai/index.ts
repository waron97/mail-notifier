import OpenAI from 'openai'

import { GmailDocument } from '@api/gmail/model'
import { OPENAI_KEY } from '@constants'
import dayjs from '@services/dayjs'

const client = new OpenAI({
    apiKey: OPENAI_KEY,
})

const defaultIntro = ''

export async function getEmailSummary(
    email: string,
    sender: string,
    introduction?: string,
) {
    const completion = await client.chat.completions.create({
        messages: [
            {
                role: 'system',
                content:
                    "Sei un'assistente per semplificare la gestione delle e-mail.",
            },
            {
                role: 'user',
                content: introduction || defaultIntro,
            },
            {
                role: 'user',
                content: [
                    `Mittente: ${sender}`,
                    '',
                    email,
                    '',
                    '',
                    [
                        'Riassumi il contenuto della mail sopra in massimo 2 o 3 frasi.',
                        'Se si tratta di una mail di marketing, dimmi solo "email di marketing".',
                        'Se si tratta di un messaggio di sistema, per esempio codici di verifica o notifiche di accesso, dimmi solo "messaggio di sistema".',
                        'Se è una mail personale, oppure contiene informazioni importanti, inizia il riassunto con "Importante!"',
                    ].join(' '),
                ].join('\n'),
            },
        ],
        model: 'gpt-4o-mini',
    })
    return completion.choices[0].message.content || ''
}

export async function generateReport(
    emails: GmailDocument[],
    introduction?: string,
): Promise<string> {
    const getEmailLines = (email: GmailDocument) => {
        return [
            `Mittente: ${email.from}`,
            `Data: ${dayjs(email.date).format('D MMM YY, HH:mm')}`,
            `Contenuto: ${email.aiSummary || email.textPlain} || ${email.textHtml}`,
        ].join('\n')
    }

    const completion = await client.chat.completions.create({
        messages: [
            {
                role: 'system',
                content:
                    "Sei un'assistente per semplificare la gestione delle e-mail.",
            },
            {
                role: 'user',
                content: introduction || defaultIntro,
            },
            {
                role: 'user',
                content: [
                    'Queste sono le mail che ho ricevuto nelle ultime ore:',
                    '',
                    '',
                    ...emails.map(getEmailLines),
                    '',
                    '',
                    'Scrivi un breve riassunto di 1 o 2 paragrafi delle mail sopra, evidenziando le comunicazioni importanti.',
                ].join('\n'),
            },
        ],
        model: 'gpt-4o-mini',
    })

    return completion.choices[0].message.content || ''
}
