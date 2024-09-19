import bodyParser from 'body-parser'
import express from 'express'

import { PORT } from '@constants'
import d, { ITALY } from '@services/dayjs'
import { scheduleJobs } from '@services/jobs'
import { startTelegramLoop } from '@services/telegram/loop'

import api from './api'
import pages from './pages'

startTelegramLoop()
scheduleJobs()

console.log(d().format('Standard DD/MM/YYYY HH:mm'))
console.log(d().tz(ITALY).format('Italy DD/MM/YYYY HH:mm'))

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
