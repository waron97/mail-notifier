import { Router } from 'express'
import { readFile } from 'fs/promises'
import Mustache from 'mustache'

import { KeysCollection } from '@api/keys/model'
import { getTokens, getUserInfo } from '@services/google'
import { sendMessage } from '@services/telegram'

const pages = Router()

pages.get('/', (req, res, next) => {
    readFile('src/pages/templates/index.mustache', { encoding: 'utf-8' })
        .then((value) => {
            const template = Mustache.render(value, {})
            res.setHeader('Content-Type', 'text/html')
            res.send(template).status(200)
        })
        .catch(next)
})

pages.get('/redirect', async (req, res, next) => {
    const tokens = await getTokens(req.query.code as string)
    const userInfo = await getUserInfo(undefined, tokens)
    const chatId = parseInt(req.query.state as string, 10)

    if (await KeysCollection.findOne({ chatId })) {
        KeysCollection.updateOne(
            { chatId },
            {
                $set: {
                    oauth: tokens,
                    userInfo,
                },
            },
        )
    } else {
        await KeysCollection.insertOne({
            oauth: tokens,
            chatId,
            userInfo,
        })
    }

    sendMessage(chatId, 'Accesso effettuato con successo')

    readFile('src/pages/templates/redirect.mustache', {
        encoding: 'utf-8',
    })
        .then((value) => {
            const template = Mustache.render(value, {})
            res.setHeader('Content-Type', 'text/html')
            res.send(template).status(200)
        })
        .catch(next)
})

export default pages
