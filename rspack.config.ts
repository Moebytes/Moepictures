import HtmlWebpackPlugin from "html-webpack-plugin"
import {TsCheckerRspackPlugin} from "ts-checker-rspack-plugin"
import WebpackObfuscator from "webpack-obfuscator"
import nodeExternals from "webpack-node-externals"
import {rspack} from "@rspack/core"
import path from "path"
import Dotenv from "dotenv-webpack"
import dotenv from "dotenv"
import {fileURLToPath} from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let exclude = [/node_modules/, /dist/, /dist2/]
let webExclude = [...exclude, /server.tsx/, /routes/]
let nodeExclude = [...exclude]
const env = dotenv.config().parsed!

let minimize = env.TESTING === "no"
let obfuscator = env.OBFUSCATE === "yes" ? [new WebpackObfuscator()] : []
let typecheck = env.TESTING === "no" ? [new TsCheckerRspackPlugin({typescript: {memoryLimit: 8192}})] : []
let hmr = env.TESTING === "yes" ? [new rspack.HotModuleReplacementPlugin()] : []
let scriptName = env.TESTING === "yes" ? "script.js" : "script.[contenthash:8].js"
let styleName = env.TESTING === "yes" ? "styles.css" : "styles.[contenthash:8].css"

export default [
  {
    target: "web",
    entry: "./index",
    mode: env.TESTING === "yes" ? "development" : "production",
    node: {__dirname: false},
    devtool: env.TESTING === "yes" ? "eval-cheap-source-map" : false,
    output: {publicPath: "/", globalObject: "this", filename: scriptName, chunkFilename: "[id].js", path: path.resolve(__dirname, "./dist2/client")},
    resolve: {extensions: [".js", ".jsx", ".ts", ".tsx"], alias: {"react-dom$": "react-dom/profiling", "scheduler/tracing": "scheduler/tracing-profiling"}, 
    fallback: {fs: false, "process/browser": "process/browser.js", path: "path-browserify", vm: "vm-browserify", crypto: "crypto-browserify", stream: "stream-browserify", assert: "assert/", zlib: "browserify-zlib", url: "url/", os: "os/"}},
    performance: {hints: false},
    optimization: {minimize, minimizer: [new rspack.SwcJsMinimizerRspackPlugin({extractComments: false}), new rspack.LightningCssMinimizerRspackPlugin(), ...obfuscator], moduleIds: "named", splitChunks: {chunks() {return false}}},
    module: {
      rules: [
        {test: /\.(jpe?g|png|gif|webp|svg|mp3|wav|mp4|webm|glb|obj|fbx|ttf|otf|zip)$/, exclude: webExclude, type: "asset/resource", generator: {filename: "[path][name][ext]"}},
        {test: /\.(txt|sql)$/, exclude: webExclude, type: "asset/source", generator: {filename: "[path][name][ext]"}},
        {test: /\.html$/, exclude: webExclude, use: [{loader: "html-loader", options: {sources: false, minimize: false}}]},
        {test: /\.(css|less)$/, exclude: webExclude, use: [{loader: rspack.CssExtractRspackPlugin.loader}, {loader: "css-loader"}, {loader: "less-loader"}]},
        {test: /\.(tsx?|jsx?)$/, exclude: nodeExclude, use: [{loader: "builtin:swc-loader", options: {jsc: {parser: {syntax: "typescript", tsx: true}, transform: {react: {runtime: "automatic", development: !minimize}}, externalHelpers: true}}}]}
      ]
    },
    plugins: [
      ...typecheck,
      ...hmr,
      new Dotenv(),
      new rspack.CssExtractRspackPlugin({
        filename: styleName,
        chunkFilename: "[id].css"
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "./index.html"),
        minify: false
      }),
      new rspack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
      new rspack.CopyRspackPlugin({
        patterns: [
          {from: "assets/misc/bitcrusher.js", to: "[name][ext]"},
          {from: "assets/misc/soundtouch.js", to: "[name][ext]"},
          {from: "assets/misc/webpxmux.wasm", to: "[name][ext]"},
          {from: "assets/misc/avif_enc.wasm", to: "[name][ext]"},
          {from: "assets/misc/jxl_enc.wasm", to: "[name][ext]"},
          {from: "assets/live2d/live2dcubismcore.min.js", to: "[name][ext]"}
        ]
      })
    ]
  }, 
  {
  target: "node",
    entry: "./server",
    mode: env.TESTING === "yes" ? "development" : "production",
    node: {__dirname: false},
    externals: [nodeExternals()],
    devtool: env.TESTING === "yes" ? "eval-cheap-source-map" : false,
    output: {filename: "server.js", chunkFilename: "[id].js", path: path.resolve(__dirname, "./dist2/server"), assetModuleFilename: "[path][name][ext]"},
    resolve: {extensions: [".js", ".jsx", ".ts", ".tsx"], 
    fallback: {zlib: "browserify-zlib"}},
    performance: {hints: false},
    optimization: {minimize, minimizer: [new rspack.SwcJsMinimizerRspackPlugin({extractComments: false}), ...obfuscator], moduleIds: "named"},
    module: {
      rules: [
        {test: /\.(jpe?g|png|gif|webp|svg|mp3|wav|mp4|webm|glb|obj|fbx|ttf|otf|zip)$/, exclude: webExclude, type: "asset/resource", generator: {filename: "[path][name][ext]"}},
        {test: /\.(txt|sql)$/, exclude: webExclude, type: "asset/source", generator: {filename: "[path][name][ext]"}},
        {test: /\.html$/, exclude: nodeExclude, use: [{loader: "html-loader", options: {minimize: false}}]},
        {test: /\.(css|less)$/, exclude: webExclude, use: [{loader: rspack.CssExtractRspackPlugin.loader}, {loader: "css-loader"}, {loader: "less-loader"}]},
        {test: /\.(tsx?|jsx?)$/, exclude: nodeExclude, use: [{loader: "builtin:swc-loader", options: {jsc: {parser: {syntax: "typescript", tsx: true}, transform: {react: {runtime: "automatic", development: !minimize}}, externalHelpers: true}}}]}
      ]
    },
    plugins: [
      ...typecheck,
      ...hmr,
      new Dotenv(),
      new rspack.CssExtractRspackPlugin({
        filename: styleName,
        chunkFilename: "[id].css"
      }),
      new rspack.CopyRspackPlugin({
        patterns: [
          {from: "index.html", to: "[name][ext]"}
        ]
      })
    ]
  }
]