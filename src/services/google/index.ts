import { OAuth2Client } from 'google-auth-library'
import { GetTokenResponse } from 'google-auth-library/build/src/auth/oauth2client'

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
