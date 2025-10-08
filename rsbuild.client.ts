import {defineConfig} from "@rsbuild/core"
import {pluginReact} from "@rsbuild/plugin-react"
import {pluginNodePolyfill} from "@rsbuild/plugin-node-polyfill"
import {pluginLess} from "@rsbuild/plugin-less"
import {pluginTypeCheck} from "@rsbuild/plugin-type-check"
import WebpackObfuscator from "webpack-obfuscator"
import dotenv from "dotenv"

const env = dotenv.config().parsed!

let minimize = env.TESTING === "no"
let obfuscator = env.OBFUSCATE === "yes"
let typecheck = env.TYPECHECK === "yes"
let hashes = env.TESTING === "no"
let hmr = env.TESTING === "yes"

export default defineConfig({
    tools: {
        rspack(config) {
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
        entry: {index: "./index.tsx"}
    },
    html: {
        template: "./index.html"
    },
    output: {
        target: "web",
        minify: minimize,
        filenameHash: hashes,
        sourceMap: false,
        legalComments: "none",
        distPath: {root: "./dist/client"},
        copy: [
            {from: "assets/misc/bitcrusher.js", to: "[name][ext]"},
            {from: "assets/misc/soundtouch.js", to: "[name][ext]"},
            {from: "assets/misc/webpxmux.wasm", to: "[name][ext]"},
            {from: "assets/misc/avif_enc.wasm", to: "[name][ext]"},
            {from: "assets/misc/jxl_enc.wasm", to: "[name][ext]"},
            {from: "assets/live2d/live2dcubismcore.min.js", to: "[name][ext]"},
        ]
    }
})