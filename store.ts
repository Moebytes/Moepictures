import {configureStore} from "@reduxjs/toolkit"
import themeReducer, {useThemeSelector, useThemeActions} from "./reducers/themeReducer"
import layoutReducer, {useLayoutSelector, useLayoutActions} from "./reducers/layoutReducer"
import sessionReducer, {useSessionSelector, useSessionActions} from "./reducers/sessionReducer"
import interactionReducer, {useInteractionSelector, useInteractionActions} from "./reducers/interactionReducer"
import activeReducer, {useActiveSelector, useActiveActions} from "./reducers/activeReducer"
import cacheReducer, {useCacheSelector, useCacheActions} from "./reducers/cacheReducer"
import searchReducer, {useSearchSelector, useSearchActions} from "./reducers/searchReducer"
import filterReducer, {useFilterSelector, useFilterActions} from "./reducers/filterReducer"
import pageReducer, {usePageSelector, usePageActions} from "./reducers/pageReducer"
import playbackReducer, {usePlaybackSelector, usePlaybackActions} from "./reducers/playbackReducer"
import flagReducer, {useFlagSelector, useFlagActions} from "./reducers/flagReducer"
import postDialogReducer, {usePostDialogSelector, usePostDialogActions} from "./reducers/postDialogReducer"
import tagDialogReducer, {useTagDialogSelector, useTagDialogActions} from "./reducers/tagDialogReducer"
import commentDialogReducer, {useCommentDialogSelector, useCommentDialogActions} from "./reducers/commentDialogReducer"
import translationDialogReducer, {useTranslationDialogSelector, useTranslationDialogActions} from "./reducers/translationDialogReducer"
import threadDialogReducer, {useThreadDialogSelector, useThreadDialogActions} from "./reducers/threadDialogReducer"
import messageDialogReducer, {useMessageDialogSelector, useMessageDialogActions} from "./reducers/messageDialogReducer"
import searchDialogReducer, {useSearchDialogSelector, useSearchDialogActions} from "./reducers/searchDialogReducer"
import groupDialogReducer, {useGroupDialogSelector, useGroupDialogActions} from "./reducers/groupDialogReducer"
import miscDialogReducer, {useMiscDialogSelector, useMiscDialogActions} from "./reducers/miscDialogReducer"

const store = configureStore({
    reducer: {
        theme: themeReducer,
        layout: layoutReducer,
        session: sessionReducer,
        interaction: interactionReducer,
        active: activeReducer,
        cache: cacheReducer,
        search: searchReducer,
        filter: filterReducer,
        page: pageReducer,
        playback: playbackReducer,
        flag: flagReducer,
        postDialog: postDialogReducer,
        tagDialog: tagDialogReducer,
        commentDialog: commentDialogReducer,
        translationDialog: translationDialogReducer,
        threadDialog: threadDialogReducer,
        messageDialog: messageDialogReducer,
        searchDialog: searchDialogReducer,
        groupDialog: groupDialogReducer,
        miscDialog: miscDialogReducer
    },
    devTools: {
        maxAge: 50,
        serialize: {
            replacer: (key, value) => {
                if (key === "posts") return undefined
                if (key === "visiblePosts") return undefined
                if (key === "unverifiedPosts") return undefined
                if (key === "tags") return undefined
                if (key === "emojis") return undefined
                return value
            }
        }
    }
})

export type StoreState = ReturnType<typeof store.getState>
export type StoreDispatch = typeof store.dispatch

export {
    useThemeSelector, useThemeActions,
    useLayoutSelector, useLayoutActions,
    useInteractionSelector, useInteractionActions,
    useSessionSelector, useSessionActions,
    useActiveSelector, useActiveActions,
    useCacheSelector, useCacheActions,
    useSearchSelector, useSearchActions,
    useFilterSelector, useFilterActions,
    usePageSelector, usePageActions,
    usePlaybackSelector, usePlaybackActions,
    useFlagSelector, useFlagActions,
    usePostDialogSelector, usePostDialogActions,
    useTagDialogSelector, useTagDialogActions,
    useCommentDialogSelector, useCommentDialogActions,
    useTranslationDialogSelector, useTranslationDialogActions,
    useThreadDialogSelector, useThreadDialogActions,
    useMessageDialogSelector, useMessageDialogActions,
    useSearchDialogSelector, useSearchDialogActions,
    useGroupDialogSelector, useGroupDialogActions,
    useMiscDialogSelector, useMiscDialogActions
}

export default store