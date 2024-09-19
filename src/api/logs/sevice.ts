import { nodeEnv } from '@constants'
import dayjs from '@services/dayjs'

import { LogsCollection } from './model'

export const logger = {
    log: (message: string) => {
        if (nodeEnv === 'development') {
            // eslint-disable-next-line
            console.log(message)
        } else {
            LogsCollection.insertOne({
                level: 'info',
                date: dayjs().toDate(),
                message,
            })
        }
    },
    warn: (message: string) => {
        if (nodeEnv === 'development') {
            // eslint-disable-next-line
            console.warn(message)
        } else {
            LogsCollection.insertOne({
                level: 'warning',
                date: dayjs().toDate(),
                message,
            })
        }
    },
    error: (message: string) => {
        if (nodeEnv === 'development') {
            // eslint-disable-next-line
            console.error(message)
        } else {
            LogsCollection.insertOne({
                level: 'error',
                date: dayjs().toDate(),
                message,
            })
        }
    },
}
