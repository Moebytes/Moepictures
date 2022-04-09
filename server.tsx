import path from "path"
import cors from "cors"
import mime from "mime"
import fs from "fs"
import express from "express"
import webpack from "webpack"
import middleware from "webpack-dev-middleware"
import hot from "webpack-hot-middleware"
import config from "./webpack.config"
import dotenv from "dotenv"
import React from "react"
import App from "./App"
import {renderToString} from "react-dom/server"
import {StaticRouter as Router} from "react-router-dom"
import sql from "./structures/SQLQuery"
import MiscRoutes from "./routes/MiscRoutes"
import CreateRoutes from "./routes/CreateRoutes"
import SessionRoutes from "./routes/SessionRoutes"
import SearchRoutes from "./routes/SearchRoutes"
const __dirname = path.resolve()

dotenv.config()
const app = express()
let compiler = webpack(config as any)
app.use(express.urlencoded({extended: true, limit: "1gb", parameterLimit: 50000}))
app.use(express.json({limit: "1gb"}))
app.use(cors())
app.disable("x-powered-by")
app.set("trust proxy", true)

MiscRoutes(app)
CreateRoutes(app)
SessionRoutes(app)
SearchRoutes(app)

if (process.env.TESTING === "yes") {
  app.use(middleware(compiler, {
    index: false,
    serverSideRender: false,
    writeToDisk: false,
  }))
  app.use(hot(compiler))
}

app.use(express.static(path.join(__dirname, "./public")))
app.use(express.static(path.join(__dirname, "./dist"), {index: false}))
app.use("/assets", express.static(path.join(__dirname, "./assets")))

if (!fs.existsSync("./media/images")) fs.mkdirSync("./media/images", {recursive: true})
if (!fs.existsSync("./media/animations")) fs.mkdirSync("./media/animations", {recursive: true})
if (!fs.existsSync("./media/videos")) fs.mkdirSync("./media/videos", {recursive: true})
if (!fs.existsSync("./media/comics")) fs.mkdirSync("./media/comics", {recursive: true})
if (!fs.existsSync("./media/artists")) fs.mkdirSync("./media/artists", {recursive: true})
if (!fs.existsSync("./media/characters")) fs.mkdirSync("./media/characters", {recursive: true})
if (!fs.existsSync("./media/series")) fs.mkdirSync("./media/series", {recursive: true})
if (!fs.existsSync("./media/tags")) fs.mkdirSync("./media/tags", {recursive: true})
app.use("/images", express.static(path.join(__dirname, "./media/images")))
app.use("/animations", express.static(path.join(__dirname, "./media/animations")))
app.use("/videos", express.static(path.join(__dirname, "./media/videos")))
app.use("/comics", express.static(path.join(__dirname, "./media/comics")))
app.use("/artists", express.static(path.join(__dirname, "./media/artists")))
app.use("/characters", express.static(path.join(__dirname, "./media/characters")))
app.use("/series", express.static(path.join(__dirname, "./media/series")))
app.use("/tags", express.static(path.join(__dirname, "./media/tags")))

app.get("/*", function(req, res) {
  res.setHeader("Content-Type", mime.getType(req.path) ?? "")
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
  const document = fs.readFileSync(path.join(__dirname, "./dist/index.html"), {encoding: "utf-8"})
  const html = renderToString(<Router location={req.url}><App/></Router>)
  res.send(document.replace(`<div id="root"></div>`, `<div id="root">${html}</div>`))
  res.send(document)
})

const run = async () => {
  await sql.createDB()
  
  app.listen(process.env.PORT || 8080, () => console.log("Started the website server!"))
}

run()