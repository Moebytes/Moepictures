import {Express, NextFunction, Request, Response} from "express"
import sql from "../structures/SQLQuery"
import bcrypt from "bcrypt"
import fs from "fs"
import path from "path"

const SessionRoutes = (app: Express) => {
    app.post("/api/register", async (req: Request, res: Response) => {
        try {
            
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/login", async (req: Request, res: Response) => {
        try {
            
        } catch {
            res.status(400).send("Bad request")
        }
    })
}

export default SessionRoutes