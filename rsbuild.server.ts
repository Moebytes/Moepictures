import {defineConfig} from "@rsbuild/core"
import {pluginReact} from "@rsbuild/plugin-react"
import {pluginNodePolyfill} from "@rsbuild/plugin-node-polyfill"
import {pluginLess} from "@rsbuild/plugin-less"
import {pluginTypeCheck} from "@rsbuild/plugin-type-check"
import nodeExternals from "webpack-node-externals"
import WebpackObfuscator from "webpack-obfuscator"
import dotenv from "dotenv"

const env = dotenv.config().parsed!

let minimize = env.TESTING === "no"
let obfuscator = env.OBFUSCATE === "yes"
let typecheck = env.TYPECHECK === "yes"
let hashes = env.TESTING === "no"
let hmr = env.TESTING === "yes"

export default defineConfig({
    dev: {
        hmr
    },
    tools: {
        rspack(config) {
            config.module = config.module || {}
            config.module.rules = config.module.rules || []

            config.module.rules.push({
                test: /\.(sql|txt)$/,
                type: "asset/source",
            })

            config.externals = [nodeExternals()]

            if (obfuscator) {
                config.plugins = config.plugins || []
                config.plugins.push(new WebpackObfuscator())
            }

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
        filenameHash: hashes,
        distPath: {root: "./dist2/server"},
        copy: [
            {from: "index.html", to: "[name][ext]"}
        ]
    }
})