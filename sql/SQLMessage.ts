import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLMessage {
    /** Insert DM message. */
    public static insertMessage = async (creator: string, recipient: string, title: string, content: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO messages ("creator", "createDate", "updatedDate", "recipient", "title", "content") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "messageID"`,
        values: [creator, now, now, recipient, title, content]
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }
}