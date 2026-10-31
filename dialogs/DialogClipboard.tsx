/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import {useActiveActions} from "../store"
import CopyIcon from "../assets/svg/copy-notes.svg"
import PasteIcon from "../assets/svg/paste-notes.svg"

interface Props {
    getData: () => object
    pasteData: (pastedObject: string) => void
}

const DialogClipboard: React.FunctionComponent<Props> = ({getData, pasteData}) => {
    const {setActionBanner} = useActiveActions()
        
    const copy = async () => {
        await navigator.clipboard.writeText(JSON.stringify(getData(), null, 4))
        setActionBanner("copy")
    }

    const paste = async () => {
        let text = await navigator.clipboard.readText()
        try {
            pasteData(text)
            setActionBanner("paste")
        } catch {}
    }

    return (
        <div className="dialog-clipboard">
            <button className="dialog-clipboard-button" onClick={copy}><CopyIcon/></button>
            <button className="dialog-clipboard-button" onClick={paste}><PasteIcon/></button>
        </div>
    )
}

export default DialogClipboard
