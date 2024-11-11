import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HideNavbarContext, HideSidebarContext, EnableDragContext, 
ShowBulkDeleteDialogContext, HideTitlebarContext, SessionContext, SessionFlagContext, MobileContext, SelectionModeContext, 
SelectionItemsContext, SelectionPostsContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import SearchSuggestions from "../components/SearchSuggestions"
import "./styles/dialog.less"

const BulkDeleteDialog: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {showBulkDeleteDialog, setShowBulkDeleteDialog} = useContext(ShowBulkDeleteDialogContext)
    const {selectionMode, setSelectionMode} = useContext(SelectionModeContext)
    const {selectionItems, setSelectionItems} = useContext(SelectionItemsContext) as {selectionItems: Set<string>, setSelectionItems: any}
    const {selectionPosts, setSelectionPosts} = useContext(SelectionPostsContext) as {selectionPosts: Map<string, any>, setSelectionPosts: any}
    const {mobile, setMobile} = useContext(MobileContext)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Bulk Delete"
    }, [])

    useEffect(() => {
        if (showBulkDeleteDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showBulkDeleteDialog])

    const bulkDelete = async () => {
        if (!permissions.isAdmin(session)) return setShowBulkDeleteDialog(false)
        if (!selectionMode) return setShowBulkDeleteDialog(false)
        for (const postID of selectionItems.values()) {
            await functions.delete("/api/post/delete", {postID}, session, setSessionFlag)
        }
        history.go(0)
        setShowBulkDeleteDialog(false)
        setSelectionMode(false)
        setTimeout(() => {
            setSelectionMode(true)
        }, 200)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            bulkDelete()
        } else {
            setShowBulkDeleteDialog(false)
        }
    }

    if (permissions.isAdmin(session) && showBulkDeleteDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "310px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Bulk Delete</span>
                        </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Are you sure that you want to delete the selected posts?</span>
                            </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Bulk Delete"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default BulkDeleteDialog