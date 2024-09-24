import React from "react"
import ReactDOM from "react-dom"
import {BrowserRouter as Router} from "react-router-dom"
import App from "./App"
import pace from "pace-js"
import * as serviceWorker from "./service-worker"

pace.start({document: true, eventLag: false, restartOnRequestAfter: false})
ReactDOM.hydrate(<Router><App/></Router>, document.getElementById("root"))

if (process.env.TESTING === "yes") {
    serviceWorker.unregister()
} else {
    serviceWorker.register()
}