import {Express, NextFunction, Request, Response} from "express"
import functions from "../structures/Functions"
import sql from "../structures/SQLQuery"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"

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

    app.get("/api/random", async (req: Request, res: Response, next: NextFunction) => {
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

    app.get("/api/post", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            let result = await sql.post(Number(postID))
            if (result.images.length > 1) {
                result.images = result.images.sort((a: any, b: any) => a.order - b.order)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/user", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const username = req.query.username as string
            if (!username) return res.status(400).send("Invalid username")
            let user = await sql.user(username.trim())
            delete user.$2fa
            delete user.email
            delete user.password
            res.status(200).json(user)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tags/count", async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tagCounts(tags.filter(Boolean))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tags", async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tags(tags.filter(Boolean))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/similar", async (req: Request, res: Response, next: NextFunction) => {
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

    app.get("/api/artists", async (req: Request, res: Response, next: NextFunction) => {
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

    app.get("/api/characters", async (req: Request, res: Response, next: NextFunction) => {
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

    app.get("/api/series", async (req: Request, res: Response, next: NextFunction) => {
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

    app.get("/api/tagsearch", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            if (!functions.validTagSort(sort)) return res.status(400).send("Invalid sort")
            let search = query?.trim().split(/ +/g).filter(Boolean).join("-") ?? ""
            const aliases = await sql.aliasSearch(search)
            let result = await sql.tagSearch(search, sort)
            res.status(200).json(result)
        } catch {
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/commentsearch", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            if (!functions.validCommentSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            let result = await sql.searchComments(search, sort)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
}

export default SearchRoutes