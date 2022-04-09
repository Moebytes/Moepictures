import {Express, NextFunction, Request, Response} from "express"
import functions from "../structures/Functions"
import sql from "../structures/SQLQuery"

const SearchRoutes = (app: Express) => {
    app.get("/api/search", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            const type = req.query.type as string
            const restrict = req.query.restrict as string
            const style = req.query.style as string
            const sort = req.query.sort as string
            if (!functions.validType(type, true)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict, true)) return res.status(400).send("Invalid restrict")
            if (!functions.validStyle(style, true)) return res.status(400).send("Invalid style")
            if (!functions.validSort(sort)) return res.status(400).send("Invalid sort")
            const tags = query.trim().split(/ +/g).filter(Boolean)
            let result = await sql.search(tags, type, restrict, style, sort)
            result = result.map((p: any) => {
                if (p.images.length > 1) {
                    p.images = p.images.sort((a: any, b: any) => a.order - b.order)
                }
                return p 
            })
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.query.id as string
            if (Number.isNaN(Number(id))) return res.status(400).send("Invalid id")
            let result = await sql.post(Number(id))
            if (result.images.length > 1) {
                result.images = result.images.sort((a: any, b: any) => a.order - b.order)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tags/count", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tags = req.query.tags as string[]
            if (!tags?.[0]) return res.status(400).send("Invalid tags")
            let result = await sql.tagCounts(tags)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
}

export default SearchRoutes