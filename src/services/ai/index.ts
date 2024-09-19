import OpenAI from 'openai'

import { GmailDocument } from '@api/gmail/model'
import { OPENAI_KEY } from '@constants'
import dayjs, { ITALY } from '@services/dayjs'

const client = new OpenAI({
    apiKey: OPENAI_KEY,
})

const defaultIntro =
    'I am a teacher in an Italian school. Emails coming from the school system and those coming from real people are very important to me.'

export async function getEmailSummary(
    email: string,
    sender: string,
    introduction?: string,
) {
    const completion = await client.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: 'You are a helpful assistant for managing emails.',
            },
            {
                role: 'user',
                content: introduction || defaultIntro,
            },
            {
                role: 'user',
                content: [
                    `Sender: ${sender}`,
                    '',
                    email,
                    '',
                    '',
                    [
                        'Give a summary of 1 or 2 sentences for the email or thread above.',
                        'For email threads, the more recent emails come first, so focus on those.',
                        'If it\'s marketing or an ad, or an automatic notification of purchases, logins, or similar, just write "Automated email"',
                        'If it\'s a personal email or it contains information that\'s important to me, start the summary with "Important!"',
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
            `Sender: ${email.from}`,
            `Date: ${dayjs(email.date).tz(ITALY).format('D MMM YY, HH:mm')}`,
            `Content: ${email.aiSummary || 'Summary not available'}`,
        ].join('\n')
    }

    const completion = await client.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: 'You are a helpful assistant for managing emails.',
            },
            {
                role: 'user',
                content: introduction || defaultIntro,
            },
            {
                role: 'user',
                content: [
                    'These are the emails I received in the past hours:',
                    '',
                    '',
                    ...emails.map(getEmailLines),
                    '',
                    '',
                    'You can ignore marketing or system messages, such as login stuff, purchases, and so on.',
                    'Write a brief summary (1 or 2 paragraphs) of these messages.',
                ].join('\n'),
            },
        ],
        model: 'gpt-4o-mini',
    })

    return completion.choices[0].message.content || ''
}
