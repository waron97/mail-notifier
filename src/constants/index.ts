function requireProcessEnv(field: string): string {
    if (process.env[field]) {
        return process.env[field] as string
    } else {
        throw new Error(`Process env field "${field}" missing!`)
    }
}

export const PORT = parseInt(requireProcessEnv('PORT'), 10)
export const OAUTH_CLIENT_ID = requireProcessEnv('OAUTH_CLIENT_ID')
export const OAUTH_CLIENT_SECRET = requireProcessEnv('OAUTH_CLIENT_SECRET')
export const OAUTH_AUTH_URL = requireProcessEnv('OAUTH_AUTH_URL')
export const OAUTH_REDIRECT_URI = 'https://notify.aronwinkler.com/redirect'
export const BOT_TOKEN = requireProcessEnv('BOT_TOKEN')
export const OPENAI_KEY = requireProcessEnv('OPENAI_KEY')

export const mongoUrl = requireProcessEnv('MONGO_URL')
export const mongDbName = requireProcessEnv('DB_NAME')
export const mongoUser = requireProcessEnv('MONGO_USER')
export const mongoPassword = requireProcessEnv('MONGO_PASSWORD')
export const nodeEnv = requireProcessEnv('NODE_ENV')
