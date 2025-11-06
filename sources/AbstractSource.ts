import functions from "../functions/Functions"

export abstract class AbstractSource {
    public constructor(public url: string) {}

    public get headers(): {[key: string]: string} {
        return {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.5",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0"
        }
    }

    public abstract matches(url: string): boolean

    public abstract extractImages(url: string): Promise<Buffer[]>

    public fetchBuffer = async (url: string) => {
        return functions.http.getBuffer(url, this.headers).then((b) => Buffer.from(b))
    }

    public fetchJSON = async (url: string) => {
        return functions.http.getJSON(url, this.headers)
    }

    public fetchText = async (url: string) => {
        return fetch(url, {headers: this.headers}).then((r) => r.text())
    }
}