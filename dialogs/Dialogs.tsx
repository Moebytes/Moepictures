import React from "react"
import DeleteCommentDialog from "./comment/DeleteCommentDialog"
import EditCommentDialog from "./comment/EditCommentDialog"
import ReportCommentDialog from "./comment/ReportCommentDialog"
import AddFavgroupPostDialog from "./group/AddFavgroupPostDialog"
import AddGroupPostDialog from "./group/AddGroupPostDialog" 
import BulkFavgroupDialog from "./group/BulkFavgroupDialog"
import BulkGroupDialog from "./group/BulkGroupDialog"
import DeleteFavgroupDialog from "./group/DeleteFavgroupDialog"
import DeleteGroupDialog from "./group/DeleteGroupDialog"
import DeleteGroupHistoryDialog from "./group/DeleteGroupHistoryDialog"
import DeleteGroupPostDialog from "./group/DeleteGroupPostDialog"
import EditFavgroupDialog from "./group/EditFavgroupDialog"
import EditGroupDialog from "./group/EditGroupDialog"
import FavGroupDialog from "./group/FavGroupDialog"
import GroupDialog from "./group/GroupDialog"
import RevertGroupHistoryDialog from "./group/RevertGroupHistoryDialog"
import DeleteMessageDialog from "./message/DeleteMessageDialog"
import DeleteMessageReplyDialog from "./message/DeleteMessageReplyDialog"
import EditMessageDialog from "./message/EditMessageDialog"
import EditMessageReplyDialog from "./message/EditMessageReplyDialog"
import ForwardMessageDialog from "./message/ForwardMessageDialog"
import SendMessageDialog from "./message/SendMessageDialog"
import SoftDeleteMessageDialog from "./message/SoftDeleteMessageDialog"
import CaptchaDialog from "./misc/CaptchaDialog"
import DownloadDialog from "./misc/DownloadDialog"
import PageDialog from "./misc/PageDialog"
import PremiumRequiredDialog from "./misc/PremiumRequiredDialog"
import QRCodeDialog from "./misc/QRCodeDialog"
import R18Dialog from "./misc/R18Dialog"
import DeleteNoteHistoryDialog from "./note/DeleteNoteHistoryDialog"
import EditNoteDialog from "./note/EditNoteDialog"
import OCRDialog from "./note/OCRDialog"
import RevertNoteHistoryDialog from "./note/RevertNoteHistoryDialog"
import SaveNoteDialog from "./note/SaveNoteDialog"
import AppealPostDialog from "./post/AppealPostDialog"
import BulkDeleteDialog from "./post/BulkDeleteDialog"
import BulkTagEditDialog from "./post/BulkTagEditDialog"
import CompressPostDialog from "./post/CompressPostDialog"
import DeletePostDialog from "./post/DeletePostDialog"
import DeletePostHistoryDialog from "./post/DeletePostHistoryDialog"
import JoinPostDialog from "./post/JoinPostDialog"
import LockPostDialog from "./post/LockPostDialog"
import ParentDialog from "./post/ParentDialog"
import PermaDeleteAllPostDialog from "./post/PermaDeleteAllPostDialog"
import PermaDeletePostDialog from "./post/PermaDeletePostDialog"
import PostInfoDialog from "./post/PostInfoDialog"
import PrivatePostDialog from "./post/PrivatePostDialog"
import RevertPostHistoryDialog from "./post/RevertPostHistoryDialog"
import SourceEditDialog from "./post/SourceEditDialog"
import SplitPostDialog from "./post/SplitPostDialog"
import TagEditDialog from "./post/TagEditDialog"
import TakedownPostDialog from "./post/TakedownPostDialog"
import UndeletePostDialog from "./post/UndeletePostDialog"
import UpscalePostDialog from "./post/UpscalePostDialog"
import AliasTagDialog from "./tag/AliasTagDialog"
import CategorizeTagDialog from "./tag/CategorizeTagDialog"
import DeleteAliasHistoryDialog from "./tag/DeleteAliasHistoryDialog"
import DeleteTagDialog from "./tag/DeleteTagDialog"
import DeleteTagFavoritesDialog from "./tag/DeleteTagFavoritesDialog"
import DeleteTagHistoryDialog from "./tag/DeleteTagHistoryDialog"
import EditTagDialog from "./tag/EditTagDialog"
import MassImplyDialog from "./tag/MassImplyDialog"
import RevertAliasHistoryDialog from "./tag/RevertAliasHistoryDialog"
import RevertTagHistoryDialog from "./tag/RevertTagHistoryDialog"
import TakedownTagDialog from "./tag/TakedownTagDialog"
import DeleteReplyDialog from "./thread/DeleteReplyDialog"
import DeleteThreadDialog from "./thread/DeleteThreadDialog"
import EditReplyDialog from "./thread/EditReplyDialog"
import EditThreadDialog from "./thread/EditThreadDialog"
import NewThreadDialog from "./thread/NewThreadDialog"
import ReportReplyDialog from "./thread/ReportReplyDialog"
import ReportThreadDialog from "./thread/ReportThreadDialog"
import BanDialog from "./user/BanDialog"
import DeleteAccountDialog from "./user/DeleteAccountDialog"
import DeleteAllSaveSearchDialog from "./user/DeleteAllSaveSearchDialog"
import DeleteAllSearchHistoryDialog from "./user/DeleteAllSearchHistoryDialog"
import DeleteSearchHistoryDialog from "./user/DeleteSearchHistoryDialog"
import Disable2FADialog from "./user/Disable2FADialog"
import EditSaveSearchDialog from "./user/EditSaveSearchDialog"
import PromoteDialog from "./user/PromoteDialog"
import SaveSearchDialog from "./user/SaveSearchDialog"
import UnbanDialog from "./user/UnbanDialog"

const Dialogs: React.FunctionComponent = (props) => {

    return (
        <>
        <DeleteCommentDialog/>
        <EditCommentDialog/>
        <ReportCommentDialog/>
        <AddFavgroupPostDialog/>
        <AddGroupPostDialog/>
        <BulkFavgroupDialog/>
        <BulkGroupDialog/>
        <DeleteFavgroupDialog/>
        <DeleteGroupDialog/>
        <DeleteGroupHistoryDialog/>
        <DeleteGroupPostDialog/>
        <EditFavgroupDialog/>
        <EditGroupDialog/>
        <FavGroupDialog/>
        <GroupDialog/>
        <RevertGroupHistoryDialog/>
        <DeleteMessageDialog/>
        <DeleteMessageReplyDialog/>
        <EditMessageDialog/>
        <EditMessageReplyDialog/>
        <ForwardMessageDialog/>
        <SendMessageDialog/>
        <SoftDeleteMessageDialog/>
        <CaptchaDialog/>
        <DownloadDialog/>
        <PageDialog/>
        <PremiumRequiredDialog/>
        <QRCodeDialog/>
        <R18Dialog/>
        <DeleteNoteHistoryDialog/>
        <EditNoteDialog/>
        <OCRDialog/>
        <RevertNoteHistoryDialog/>
        <SaveNoteDialog/>
        <AppealPostDialog/>
        <BulkDeleteDialog/>
        <BulkTagEditDialog/>
        <CompressPostDialog/>
        <DeletePostDialog/>
        <DeletePostHistoryDialog/>
        <JoinPostDialog/>
        <LockPostDialog/>
        <ParentDialog/>
        <PermaDeleteAllPostDialog/>
        <PermaDeletePostDialog/>
        <PostInfoDialog/>
        <PrivatePostDialog/>
        <RevertPostHistoryDialog/>
        <SourceEditDialog/>
        <SplitPostDialog/>
        <TagEditDialog/>
        <TakedownPostDialog/>
        <UndeletePostDialog/>
        <UpscalePostDialog/>
        <AliasTagDialog/>
        <CategorizeTagDialog/>
        <DeleteAliasHistoryDialog/>
        <DeleteTagDialog/>
        <DeleteTagFavoritesDialog/>
        <DeleteTagHistoryDialog/>
        <EditTagDialog/>
        <MassImplyDialog/>
        <RevertAliasHistoryDialog/>
        <RevertTagHistoryDialog/>
        <TakedownTagDialog/>
        <DeleteReplyDialog/>
        <DeleteThreadDialog/>
        <EditReplyDialog/>
        <EditThreadDialog/>
        <NewThreadDialog/>
        <ReportReplyDialog/>
        <ReportThreadDialog/>
        <BanDialog/>
        <DeleteAccountDialog/>
        <DeleteAllSaveSearchDialog/>
        <DeleteAllSearchHistoryDialog/>
        <DeleteSearchHistoryDialog/>
        <Disable2FADialog/>
        <EditSaveSearchDialog/>
        <PromoteDialog/>
        <SaveSearchDialog/>
        <UnbanDialog/>
        </>
    )
}

export default Dialogs