import { KeysCollection } from '@api/keys/model'
import { createReport } from '@api/reports/service'
import { getRedirectUri } from '@services/google'

import { baseUrl, sendMessage } from '.'

type Update = {
    update_id: number
    message: {
        message_id: number
        from: {
            id: number
            is_bot: boolean
            first_name: string
            last_name: string
            username: string
            language_code: string
        }
        chat: {
            id: number
            first_name: string
            last_name: string
            username: string
            type: string
        }
        entites: {
            offset: number
            length: number
            type: string
        }[]
        text: string
    }
}

export async function startTelegramLoop() {
    let maxId: number = 0
    while (true) {
        const updates = await getUpdates(maxId)

        const ids: number[] = updates.map((update) => update.update_id)
        maxId = Math.max(maxId, ...ids)
        for (const update of updates) {
            await processUpdate(update)
        }
    }
}

async function processUpdate(update: Update) {
    const { id: chatId } = update.message.chat
    const text = update.message.text

    if (text === '/start') {
        const redirectUri = getRedirectUri(chatId)
        const message =
            'Ciao! Clicca il seguente link per autorizzare il BOT ad accedere alla tua posta GMAIL: ' +
            redirectUri
        sendMessage(chatId, message)
    }

    if (text.startsWith('/intro')) {
        let [, content] = text.split('/intro')
        content = (content || '').trim()
        await KeysCollection.updateOne(
            { chatId },
            { $set: { introduction: content } },
        )
        sendMessage(chatId, 'Introduzione impostata con successo.')
    }
    if (text.startsWith('/report')) {
        const key = await KeysCollection.findOne({ chatId })
        if (key) {
            const summary = await createReport(key)
            if (summary) {
                sendMessage(key.chatId, summary.text)
            } else {
                sendMessage(key.chatId, 'Nessuna mail ricevuta')
            }
        }
    }
}

async function getUpdates(maxId: number): Promise<Update[]> {
    return fetch(`${baseUrl}/getUpdates`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            offset: maxId > 0 ? maxId + 1 : 0,
            timeout: 1,
            allowed_updates: ['message'],
        }),
    })
        .then((res) => {
            if (res.ok) {
                return res.json().then((r) => {
                    if (!r.ok) {
                        throw new Error(
                            `[getUpdates] error\n${JSON.stringify(r, null, 2)}`,
                        )
                    }
                    return r.result || []
                })
            } else {
                // eslint-disable-next-line no-console
                console.log(
                    `[getUpdates] ERROR ${res.status}: ` + res.statusText,
                )
            }
        })
        .catch(() => [])
}
