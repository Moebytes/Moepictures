import {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useSearchSelector, useSearchActions} from "../../store"
import functions from "../../functions/Functions"

interface Params<T> {
    loadInitial: () => Promise<T[]>
    updateOffset?: (offset: number) => Promise<T[]>
    pageAmount: number
    getTotalCount?: (item: T) => number | undefined
}

const usePaginatedScroll = <T,>(params: Params<T>) => {
    const {scroll} = useSearchSelector()
    const {setScroll} = useSearchActions()
    const {loadInitial, updateOffset, pageAmount, getTotalCount} = params
    const [items, setItems] = useState([] as T[])
    const [visible, setVisible] = useState([] as T[])
    const [page, setPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const loadedRef = useRef(false)
    const updatingRef = useRef(false)
    const navigate = useNavigate()

    const totalCount = items.length ? (getTotalCount?.(items[0]) ?? items.length) : 0
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    const getQueryPage = () => {
        if (typeof window === "undefined") return 1
        const pageParam = new URLSearchParams(window.location.search).get("page")
        return pageParam ? Number(pageParam) : 1
    }

    useEffect(() => {
        if (scroll || !loadedRef.current) return
        const searchParams = new URLSearchParams(window.location.search)
        if (!scroll) searchParams.set("page", String(page || ""))
        navigate(`${location.pathname}?${searchParams.toString()}`, {replace: true})
    }, [scroll, page])

    const initItemLoader = async (forceRestart?: boolean) => {
        setEnded(false)
        setOffset(0)
        const startPage = getQueryPage()
        setPage(forceRestart ? 1 : startPage)
        loadedRef.current = true
        const data = await loadInitial()
        setItems(data)
        setVisible(data.slice(0, pageAmount))
    }

    useEffect(() => {
        initItemLoader(true)
    }, [scroll])

    const updateItemLoader = async (forceOffset?: number) => {
        if (ended || updatingRef.current) return
        updatingRef.current = true

        const newOffset = forceOffset ?? offset + pageAmount
        let result = await updateOffset?.(newOffset)
        if (!result) result = items.slice(newOffset, newOffset + pageAmount)


        if (!result.length) {
            updatingRef.current = false
            return setEnded(true)
        }

        setOffset(newOffset)
        setItems((prev) => functions.util.removeDuplicates([...prev, ...result]))
        setVisible((prev) => functions.util.removeDuplicates([...prev, ...result]))
        updatingRef.current = false
    }

    useEffect(() => {
        if (scroll) return

        const offset = (page - 1) * pageAmount
        if (items.length <= offset) {
            updateItemLoader(offset)
        }
    }, [page, scroll])

    useEffect(() => {
        if (!scroll) return

        const scrollListener = () => {
            if (functions.dom.scrolledToBottom()) {
                updateItemLoader()
            }
        }
        window.addEventListener("scroll", scrollListener)
        return () => window.removeEventListener("scroll", scrollListener)
    }, [scroll, offset, ended])

    const toggleScroll = () => {
        const newValue = !scroll
        setScroll(newValue)
    }

    const visibleItems = scroll ? visible : items.slice((page - 1) * pageAmount, pageAmount * page)

    return {
        visibleItems,
        items,
        setItems,
        setVisible,
        initItemLoader,
        page,
        setPage,
        maxPage,
        toggleScroll
    }
}

export default usePaginatedScroll