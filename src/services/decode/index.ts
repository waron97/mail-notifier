const b64Decode = require('base-64').decode

export function urlB64Decode(string: string) {
    return string
        ? decodeURIComponent(
              escape(b64Decode(string.replace(/\-/g, '+').replace(/\_/g, '/'))),
          )
        : ''
}
