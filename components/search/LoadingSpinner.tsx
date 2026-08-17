/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import miyuLoading from "../../assets/images/miyuloading.gif"
import "./styles/loadingspinner.less"

const LoadingSpinner: React.FunctionComponent = () => {
    return (
        <div className="loading-spinner">
            <img className="loading-img" src={miyuLoading}/>
        </div>
    )
}

export default LoadingSpinner