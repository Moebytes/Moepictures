import enLocale from "../assets/locales/en.json"

export default class DateFunctions {
    public static formatSeconds = (duration: number) => {
        let seconds = Math.floor(duration % 60)
        let minutes = Math.floor((duration / 60) % 60)
        let hours = Math.floor((duration / (60 * 60)) % 24)
        if (Number.isNaN(seconds) || seconds < 0) seconds = 0
        if (Number.isNaN(minutes) || minutes < 0) minutes = 0
        if (Number.isNaN(hours) || hours < 0) hours = 0

        const hoursStr = (hours === 0) ? "" : ((hours < 10) ? "0" + hours + ":" : hours + ":")
        const minutesStr = hours && (minutes < 10) ? "0" + minutes : minutes
        const secondsStr = (seconds < 10) ? "0" + seconds : seconds
        return `${hoursStr}${minutesStr}:${secondsStr}`
    }

    public static formatDate(date: Date, yearFirst?: boolean) {
        if (!date) return ""
        let year = date.getFullYear()
        let month = (1 + date.getMonth()).toString()
        let day = date.getDate().toString()
        if (yearFirst) return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        return `${month}-${day}-${year}`
    }

    public static prettyDate = (inputDate: Date | string | null, i18n: typeof enLocale, noDay?: boolean) => {
        const monthNames = [
            i18n.time.january, i18n.time.february, i18n.time.march,
            i18n.time.april, i18n.time.may, i18n.time.june, i18n.time.july,
            i18n.time.august, i18n.time.september, i18n.time.october,
            i18n.time.november, i18n.time.december
        ]
        const date = new Date(inputDate || "")
        const day = `${date.getDate()}` + i18n.time.dayAppend
        const month = `${monthNames[date.getMonth()]}`
        const year = `${date.getFullYear()}` + i18n.time.yearAppend

        if (noDay) {
            if (i18n.time.comma) {
                return `${month} ${year}`
            } else {
                return `${year}${month}`
            }
        }

        if (i18n.time.comma) {
            return `${month} ${day}, ${year}`
        } else {
            return `${year}${month}${day}`
        }
    }
    
    public static timeAgo = (input: string, i18n: typeof enLocale) => {
        if (!input) return "?"
        const date = new Date(input.replace(/ +/g, "T"))
        const seconds = Math.floor(((new Date().getTime() / 1000) - (date.getTime() / 1000)))
    
    
        const parseTime = (value: number, unit: string) => {
            return i18n.time.plural ? `${value} ${unit}${value === 1 ? "" : i18n.time.plural} ${i18n.time.ago}` : `${value}${unit}${i18n.time.ago}`
        }
    
        const years = seconds / 31536000
        if (years >= 1) return parseTime(Math.floor(years), i18n.time.year)
    
        const months = seconds / 2592000
        if (months >= 1) return parseTime(Math.floor(months), i18n.time.month)
    
        const days = seconds / 86400
        if (days >= 1) return parseTime(Math.floor(days), i18n.time.day)
    
        const hours = seconds / 3600
        if (hours >= 1) return parseTime(Math.floor(hours), i18n.time.hour)
    
        const minutes = seconds / 60
        if (minutes >= 1) return parseTime(Math.floor(minutes), i18n.time.minute)
    
        return parseTime(seconds, i18n.time.second)
    }

    public static timeUntil = (input: string | null, i18n: typeof enLocale) => {
        if (!input) return "?"
        const date = new Date(input.replace(/ +/g, "T"))
        const now = new Date().getTime()
        const seconds = Math.floor((date.getTime() - now) / 1000)
    
        const parseTime = (value: number, unit: string) => {
            return i18n.time.plural ? `${value} ${unit}${value === 1 ? "" : i18n.time.plural}` : `${value}${unit}`
        }
    
        const years = seconds / 31536000
        if (years >= 1) return parseTime(Math.floor(years), i18n.time.year)
    
        const months = seconds / 2592000
        if (months >= 1) return parseTime(Math.floor(months), i18n.time.month)
    
        const days = seconds / 86400
        if (days >= 1) return parseTime(Math.floor(days), i18n.time.day)
    
        const hours = seconds / 3600
        if (hours >= 1) return parseTime(Math.floor(hours), i18n.time.hour)
    
        const minutes = seconds / 60
        if (minutes >= 1) return parseTime(Math.floor(minutes), i18n.time.minute)
    
        return parseTime(seconds, i18n.time.second)
    }
}