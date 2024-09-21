import { OAuth2Client } from 'google-auth-library'
import { GetTokenResponse } from 'google-auth-library/build/src/auth/oauth2client'
import { google } from 'googleapis'

import {
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URI,
} from '@constants'

export const getRedirectUri = (chatId: number) => {
    const oAuth2Client = new OAuth2Client(
        OAUTH_CLIENT_ID,
        OAUTH_CLIENT_SECRET,
        OAUTH_REDIRECT_URI,
    )
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
        prompt: 'consent',
        redirect_uri: `${OAUTH_REDIRECT_URI}`,
        state: `${chatId}`,
    })
    return authorizeUrl
}

export async function getTokens(code: string) {
    const client = new OAuth2Client(
        OAUTH_CLIENT_ID,
        OAUTH_CLIENT_SECRET,
        OAUTH_REDIRECT_URI,
    )
    const t = await client.getToken(code)
    return t.tokens
}

export async function getClient(tokens: GetTokenResponse['tokens']) {
    const client = new OAuth2Client(
        OAUTH_CLIENT_ID,
        OAUTH_CLIENT_SECRET,
        OAUTH_REDIRECT_URI,
    )
    client.setCredentials(tokens)
    return client
}

export const getUserInfo = async (
    client?: OAuth2Client,
    tokens?: GetTokenResponse['tokens'],
) => {
    if (!client) {
        if (!tokens) {
            throw new Error('No client and no tokens!')
        }
        client = await getClient(tokens)
    }

    const info = await google.oauth2('v2').userinfo.v2.me.get({ auth: client })
    return info.data
}
