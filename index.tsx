import {scan} from "react-scan"
import {hydrateRoot} from "react-dom/client"
import {BrowserRouter as Router} from "react-router-dom"
import {Provider} from "react-redux"
import store from "./store"
import App from "./App"
import pace from "pace-js"

pace.start({document: false, eventLag: false, restartOnRequestAfter: false})

if (process.env.SCAN === "yes") {
    scan({enabled: true})
}

document.addEventListener("DOMContentLoaded", () => {
    const rootElement = document.getElementById("root")!
    hydrateRoot(rootElement, <Router><Provider store={store}><App/></Provider></Router>)
})