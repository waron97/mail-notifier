import { GetTokenResponse } from 'google-auth-library/build/src/auth/oauth2client'
import { ObjectId } from 'mongodb'

import db from '@services/mongo'

export type Key = {
    oauth: GetTokenResponse['tokens']
    chatId: number
    introduction?: string
}

export type KeyDocument = Key & {
    _id: ObjectId
}

export const keysCollectionName = 'keys'

export const KeysCollection = db.collection<Key>(keysCollectionName)

export const viewKey = (key: KeyDocument | ObjectId) => {
    if (key instanceof ObjectId) {
        return { id: key.toHexString() }
    } else {
        const { _id } = key
        return {
            id: _id.toHexString(),
        }
    }
}