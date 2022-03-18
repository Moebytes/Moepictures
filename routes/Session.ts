import {Express, NextFunction, Request, Response} from "express"
import sql from "../structures/SQLQuery"
import bcrypt from "bcrypt"
import fs from "fs"
import path from "path"

export const sessionRoutes = (app: Express) => {
    app.post("/register", async (req: Request, res: Response) => {
        try {
            await sql.insert("users", "username", req.body.username)
            const hash = await bcrypt.hash(req.body.password, 12)
            await sql.update("users", "password", hash, "username", req.body.username)
            await sql.update("users", "email", req.body.email, "username", req.body.username)
            res.status(200).send("done")
        } catch {
            res.status(400).send("username taken")
        }
    })

    app.post("/login", async (req: Request, res: Response) => {
        try {
            const password = await sql.fetch("users", "password", "username", req.body.username)
            if (await bcrypt.compare(req.body.password, String(password))) {
                res.status(200).send("correct password")
            } else {
                res.status(401).send("incorrect password")
            }
        } catch {
            res.status(400).send("user doesn't exist")
        }
    })
}
