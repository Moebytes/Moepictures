/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import "./styles/errorboundary.less"

interface Props {
    children: React.ReactNode
}

class ErrorBoundary extends React.Component<Props> {
    public state = {
        error: null as any
    }

    public static getDerivedStateFromError = (error: any)  => {
        return {error}
    }

    public render = () => {
        if (this.state.error) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-container">
                        <span className="error-boundary-title">Error</span>
                        <span className="error-boundary-error">{this.state.error.constructor?.name}: {this.state.error.message}</span>
                        <span className="error-boundary-error">{this.state.error.stack}</span>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary