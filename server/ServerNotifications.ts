/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Response} from "express"

let connections = [] as {sessionID: string, username: string, res: Response}[]

export default class ServerNotifications {
    public static pushNotification = (username: string) => {
        const userConnections = connections.filter((c) => c.username === username)
        for (const connection of userConnections) {
            connection.res.write(`event: message\n`)
            connection.res.write(`data: new message!\n\n`)
        }
    }

    public static pushMessage = (username: string, message: string) => {
        const userConnections = connections.filter((c) => c.username === username)
        for (const connection of userConnections) {
            connection.res.write(`event: message\n`)
            connection.res.write(`data: ${message}\n\n`)
        }
    }

    public static addConnection = (sessionID: string, username: string, res: Response) => {
        const index = connections.findIndex((c) => c.sessionID === sessionID)
        if (index !== -1) {
            connections[index].res = res
        } else {
            connections.push({sessionID, username, res})
        }
    }

    public static removeConnection = (sessionID?: string) => {
        connections = connections.filter((c) => c.sessionID !== sessionID)
    }
}