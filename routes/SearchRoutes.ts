import {Express, NextFunction, Request, Response} from "express"
import functions from "../structures/Functions"
import sql from "../structures/SQLQuery"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"

const SearchRoutes = (app: Express) => {
    app.get("/api/search/posts", async (req: Request, res: Response, next: NextFunction) => {
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
            for (let i = 0; i < tags.length; i++) {
                const tag = await sql.tag(tags[i])
                if (!tag) {
                    const alias = await sql.alias(tags[i])
                    if (alias) tags[i] = alias.tag
                }
            }
            let result = null as any
            if (sort === "favorites" || sort === "reverse favorites") {
                if (!req.session.username) return res.status(400).send("Bad request")
                const favorites = await sql.searchFavorites(req.session.username, tags, type, restrict, style, sort)
                result = favorites.map((f: any) => f.post)
            } else {
                result = await sql.search(tags, type, restrict, style, sort)
            }
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

    app.get("/api/search/random", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const type = req.query.type as string
            const restrict = req.query.restrict as string
            const style = req.query.style as string
            if (!functions.validType(type, true)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict, true)) return res.status(400).send("Invalid restrict")
            if (!functions.validStyle(style, true)) return res.status(400).send("Invalid style")
            let result = await sql.random(type, restrict, style)
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

    app.post("/api/search/similar", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const buffer = Buffer.from(Object.values(req.body))
            const hash = await phash(buffer)
            let images = await sql.run(`SELECT * FROM "images"`)
            let postIDs = new Set<number>()
            for (let i = 0; i < images.length; i++) {
                const imgHash = functions.hexToBinary(images[i].hash)
                if (dist(imgHash, hash) < 10) postIDs.add(images[i].postID)
            }
            let result = await sql.posts(Array.from(postIDs))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/artists", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.tagCategory("artists", sort, search)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/characters", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.tagCategory("characters", sort, search)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/series", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.tagCategory("series", sort, search)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/tags", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            if (!functions.validTagSort(sort)) return res.status(400).send("Invalid sort")
            let search = query?.trim().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = await sql.tagSearch(search, sort)
            res.status(200).json(result)
        } catch {
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/comments", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            if (!functions.validCommentSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            let parts = search.split(/ +/g)
            let usernames = [] as any 
            let parsedSearch = ""
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].includes("user:")) {
                    const username = parts[i].split("user:")[1]
                    usernames.push(username)
                } else {
                    parsedSearch += `${parts[i]} `
                }
            }
            let result = [] as any
            if (usernames.length) {
                result = await sql.searchCommentsByUsername(usernames, parsedSearch.trim(), sort)
            } else {
                result = await sql.searchComments(parsedSearch.trim(), sort)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/suggestions", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            const type = req.query.type as string
            let search = query?.trim().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = await sql.tagSearch(search, "posts", type).then((r) => r.slice(0, 10))
            if (!result?.[0]) return res.status(200).json([])
            const tags = await sql.tagCounts(result.map((r: any) => r.tag))
            res.status(200).json(tags.slice(0, 10))
        } catch {
            return res.status(400).send("Bad request")
        }
    })
}

export default SearchRoutes