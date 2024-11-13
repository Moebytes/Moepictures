import React from "react"
import ReactDOM from "react-dom"
import {BrowserRouter as Router} from "react-router-dom"
import {Provider} from "react-redux"
import store from "./store"
import App from "./App"
import pace from "pace-js"
import * as serviceWorker from "./service-worker"

pace.start({document: false, eventLag: false, restartOnRequestAfter: false})
ReactDOM.hydrate(<Router><Provider store={store}><App/></Provider></Router>, document.getElementById("root"))

if (process.env.TESTING === "yes") {
    serviceWorker.unregister()
} else {
    serviceWorker.register()
}