import {defineConfig} from "@rsbuild/core"
import {pluginReact} from "@rsbuild/plugin-react"
import {pluginNodePolyfill} from "@rsbuild/plugin-node-polyfill"
import {pluginLess} from "@rsbuild/plugin-less"
import {pluginTypeCheck} from "@rsbuild/plugin-type-check"
import nodeExternals from "webpack-node-externals"
import dotenv from "dotenv"

const env = dotenv.config().parsed!

let minimize = env.TESTING === "no"
let typecheck = env.TYPECHECK === "yes"

export default defineConfig({
    tools: {
        rspack(config) {
            config.module = config.module || {}
            config.module.rules = config.module.rules || []
            
            config.module.rules.push({
                test: /\.svg$/i,
                type: "asset/inline",
            })

            config.module.rules.push({
                test: /\.(sql|txt)$/,
                type: "asset/source",
            })

            config.externals = [nodeExternals()]

            return config
        }
    },
    plugins: [
        pluginReact(),
        pluginLess(),
        pluginNodePolyfill(),
        pluginTypeCheck({enable: typecheck})
    ],
    source: {
        entry: {server: "./server.tsx"}
    },
    output: {
        target: "node",
        minify: minimize,
        dataUriLimit: 0,
        filenameHash: false,
        distPath: {root: "./dist/server"},
        copy: [
            {from: "index.html", to: "[name][ext]"}
        ]
    }
})