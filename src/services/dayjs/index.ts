import d from 'dayjs'
import it from 'dayjs/locale/it'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

d.locale(it)
d.extend(utc)
d.extend(timezone)
d.extend(customParseFormat)

export const ITALY = 'Europe/Rome'

export default d
