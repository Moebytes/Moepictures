import path from "path"
import cors from "cors"
import mime from "mime"
import bodyParser from "body-parser"
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
import fs from "fs"
import * as routes from "./routes/index"
const __dirname = path.resolve()

dotenv.config()
const app = express()
let compiler = webpack(config as any)
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())
app.disable("x-powered-by")
app.set("trust proxy", true)

routes.sessionRoutes(app)

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

app.get("/*", function(req, res) {
  res.setHeader("Content-Type", mime.getType(req.path) ?? "")
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
  const document = fs.readFileSync(path.join(__dirname, "./dist/index.html"), {encoding: "utf-8"})
  const html = renderToString(<Router location={req.url}><App/></Router>)
  res.send(document.replace(`<div id="root"></div>`, `<div id="root">${html}</div>`))
  res.send(document)
})

app.listen(process.env.PORT || 8080, () => console.log("Started the website server!"))
