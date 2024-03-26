import React from "react"
import ReactDOM from "react-dom"
import {BrowserRouter as Router} from "react-router-dom"
import App from "./App"
import * as serviceWorker from "./service-worker"

ReactDOM.hydrate(<Router><App/></Router>, document.getElementById("root"))

/*
if (process.env.TESTING === "yes") {
    serviceWorker.unregister()
} else {
    serviceWorker.register()
}*/