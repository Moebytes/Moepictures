import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"

const favoriteLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 2000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const FavoriteRoutes = (app: Express) => {
    app.post("/api/favorite/update", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, favorited} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (favorited == null || !req.session.username) return res.status(400).send("Bad request")
            const favorite = await sql.favorite(Number(postID), req.session.username)
            if (favorited) {
                if (!favorite) await sql.insertFavorite(Number(postID), req.session.username)
            } else {
                if (favorite) await sql.deleteFavorite(favorite.favoriteID)
            }
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/favorite", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const favorite = await sql.favorite(Number(postID), req.session.username)
            res.status(200).send(favorite)
        } catch {
            res.status(400).send("Bad request") 
        }
    })
}

export default FavoriteRoutes