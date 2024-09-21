import bodyParser from 'body-parser'
import express from 'express'

import { KeysCollection } from '@api/keys/model'
import { PORT } from '@constants'
import { getClient, getUserInfo } from '@services/google'
import { scheduleJobs } from '@services/jobs'
import { startTelegramLoop } from '@services/telegram/loop'

import api from './api'
import pages from './pages'

startTelegramLoop()
scheduleJobs()

for await (const key of KeysCollection.find({})) {
    const client = await getClient(key.oauth)
    const userInfo = await getUserInfo(client)
    await KeysCollection.updateOne(
        { _id: key._id },
        {
            $set: {
                userInfo,
            },
        },
    )
}

const app = express()
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())

app.use('/', pages)
app.use('/api', api)

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log('Server listening on port', PORT)
})
