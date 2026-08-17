/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import "bootstrap/dist/css/bootstrap.min.css"
import "react-image-crop/dist/ReactCrop.css"
import {scan} from "react-scan"
import {hydrateRoot} from "react-dom/client"
import {BrowserRouter as Router} from "react-router-dom"
import {Provider} from "react-redux"
import store from "./store"
import App from "./App"
import pace from "pace-js"

//pace.start({document: false, eventLag: false, restartOnRequestAfter: false})

if (process.env.SCAN === "yes") {
    scan({enabled: true})
}

const rootElement = document.getElementById("root")!
hydrateRoot(rootElement, <Router><Provider store={store} stabilityCheck="never"><App/></Provider></Router>)