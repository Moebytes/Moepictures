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

export default defineConfig({
    tools: {
        rspack(config) {
            config.module = config.module || {}
            config.module.rules = config.module.rules || []

            config.module.rules.push({
                test: /\.svg$/,
                type: "javascript/auto",
                use: [{
                    loader: "@svgr/webpack", 
                    options: {
                        svgoConfig: {
                            plugins: [
                                {name: "preset-default", params: {overrides: {removeViewBox: false}}}
                            ]
                        }
                    }
                }]
            })

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
    server: {
        port: 8082,
        middlewareMode: true
    },
    dev: {
        writeToDisk: true
    },
    source: {
        entry: {index: "./index.tsx"}
    },
    html: {
        template: "./index.html",
        favicon: "./assets/icons/favicon.png"
    },
    output: {
        target: "web",
        minify: minimize,
        dataUriLimit: 0,
        filenameHash: false,
        sourceMap: false,
        legalComments: "none",
        distPath: {root: "./dist/client"},
        copy: [
            {from: "assets/audio worklet/bitcrusher.js", to: "[name][ext]"},
            {from: "assets/audio worklet/soundtouch.js", to: "[name][ext]"},
            {from: "assets/wasm/webpxmux.wasm", to: "[name][ext]"},
            {from: "assets/wasm/avif_enc.wasm", to: "[name][ext]"},
            {from: "assets/wasm/jxl_enc.wasm", to: "[name][ext]"},
            {from: "assets/wasm/jxl_dec.wasm", to: "[name][ext]"},
            {from: "assets/live2d/live2dcubismcore.min.js", to: "[name][ext]"},
        ]
    }
})