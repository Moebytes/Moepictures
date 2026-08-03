/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

export interface PurchaseParams {
    platform: string
    purchaseToken: string
}

export interface PubSubMessage {
    message: {
        attributes: {key: string}
        data: string
        messageId: string
    },
    subscription: string
}

export interface DecodedPubSubMessage {
    version: string
    packageName: string
    eventTimeMillis: number
    subscriptionNotification: SubscriptionNotification
    voidedPurchaseNotification: VoidedPurchaseNotification
    pendingRefundReviewNotification: PendingRefundReviewNotification
}

export enum NotificationType {
    SUBSCRIPTION_RECOVERED = 1,
    SUBSCRIPTION_RENEWED = 2,
    SUBSCRIPTION_CANCELED = 3,
    SUBSCRIPTION_PURCHASED = 4,
    SUBSCRIPTION_ON_HOLD = 5,
    SUBSCRIPTION_IN_GRACE_PERIOD = 6,
    SUBSCRIPTION_RESTARTED = 7,
    SUBSCRIPTION_PRICE_CHANGE_CONFIRMED = 8,
    SUBSCRIPTION_DEFERRED = 9,
    SUBSCRIPTION_PAUSED = 10,
    SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED = 11,
    SUBSCRIPTION_REVOKED = 12,
    SUBSCRIPTION_EXPIRED = 13,
    SUBSCRIPTION_ITEMS_CHANGED = 17,
    SUBSCRIPTION_CANCELLATION_SCHEDULED = 18,
    SUBSCRIPTION_PRICE_CHANGE_UPDATED = 19,
    SUBSCRIPTION_PENDING_PURCHASE_CANCELED = 20,
    SUBSCRIPTION_PRICE_STEP_UP_CONSENT_UPDATED = 22
}

export interface SubscriptionNotification {
    version: string
    notificationType: NotificationType
    purchaseToken: string
}

export enum ProductType {
    PRODUCT_TYPE_SUBSCRIPTION = 1,
    PRODUCT_TYPE_ONE_TIME = 2
}

export enum RefundType {
    REFUND_TYPE_FULL_REFUND = 1,
    REFUND_TYPE_QUANTITY_BASED_PARTIAL_REFUND = 2
}

export interface VoidedPurchaseNotification {
    purchaseToken: string
    orderId: string
    productType: ProductType
    refundType: RefundType
}

export enum RefundReason {
    CHARGEBACK = 7
}

export interface PendingRefundReviewNotification {
    version: string
    pendingRefundToken: string
    orderId: string
    refundReason: RefundReason
    obfuscatedAccountId: string
    obfuscatedProfileId: string
}

export type PaymentPostEndpoint<T extends string> = 
    T extends "/api/premium/verify-purchase" ? {params: PurchaseParams, response: boolean} :
    T extends "/api/apple/notifications" ? {params: {signedPayload: string}, response: null} :
    T extends "/api/google/notifications" ? {params: PubSubMessage, response: null} :
    never