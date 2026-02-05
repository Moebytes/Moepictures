import {useEffect} from "react"
import {useLayoutSelector, useFlagSelector, useMiscDialogActions, useFlagActions,
useInteractionActions} from "../../store"
import functions from "../../functions/Functions"
import "./styles/pagecontrols.less"

interface Props {
    page: number
    maxPage: number
    setPage: (page: number) => void
    scrollToTop?: boolean
}

const PageControls: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const {setMobileScrolling} = useInteractionActions()
    const {page, maxPage, setPage} = props

    const firstPage = () => {
        setPage(1)
        if (props.scrollToTop) functions.dom.jumpToTop()
        functions.util.defer(setMobileScrolling, 100, false)
    }

    const previousPage = () => {
        let newPage = page - 1 
        if (newPage < 1) newPage = 1 
        setPage(newPage)
        if (props.scrollToTop) functions.dom.jumpToTop()
        functions.util.defer(setMobileScrolling, 100, false)
    }

    const nextPage = () => {
        let newPage = page + 1 
        if (newPage > maxPage) newPage = maxPage
        setPage(newPage)
        if (props.scrollToTop) functions.dom.jumpToTop()
        functions.util.defer(setMobileScrolling, 100, false)
    }

    const lastPage = () => {
        setPage(maxPage)
        if (props.scrollToTop) functions.dom.jumpToTop()
        functions.util.defer(setMobileScrolling, 100, false)
    }
    
    const goToPage = (newPage: number) => {
        if (newPage < 1) newPage = 1 
        if (newPage > maxPage) newPage = maxPage
        setPage(newPage)
        if (props.scrollToTop) functions.dom.jumpToTop()
    }

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage < buttonAmount) buttonAmount = maxPage
        let counter = 0
        let increment = -3
        if (page > maxPage - 3) increment = -4
        if (page > maxPage - 2) increment = -5
        if (page > maxPage - 1) increment = -6
        if (mobile) {
            increment = -2
            if (page > maxPage - 2) increment = -3
            if (page > maxPage - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = page + increment
            if (pageNumber > maxPage) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    if (maxPage <= 1) return null

    return (
        <div key="page-numbers" className="page-container">
            {page <= 1 ? null : <button key="first" className="page-button" onClick={firstPage}>{"<<"}</button>}
            {page <= 1 ? null : <button key="prev" className="page-button" onClick={previousPage}>{"<"}</button>}
            {generatePageButtonsJSX()}
            {page >= maxPage ? null : <button key="next" className="page-button" onClick={nextPage}>{">"}</button>}
            {page >= maxPage ? null : <button key="last" className="page-button" onClick={lastPage}>{">>"}</button>}
            {maxPage > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
        </div>
    )
}

export default PageControls