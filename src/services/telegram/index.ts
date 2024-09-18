import { BOT_TOKEN } from '@constants'

export const baseUrl = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function sendMessage(chatId: number, message: string) {
    return fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    })
        .then((res) => res.json())
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err)
        })
}
