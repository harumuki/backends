module.exports = `

schema {
  query: queries
  mutation: mutations
  subscription: subscriptions
}

type queries {
  notifications(
    onlyUnread: Boolean
    filter: EventObjectType
    first: Int
    last: Int
    before: String
    after: String
    lastDays: Int
  ): NotificationConnection
}

type mutations {
  # upsert
  subscribe(
    objectId: ID!
    type: SubscriptionObjectType!
    filters: [EventObjectType!]
  ): Subscription!

  unsubscribe(
    subscriptionId: ID!
    # EventObjectTypes provided here are removed from existing filters.
    # If filters is null, the subscription is deactivated completely.
    filters: [EventObjectType!]
  ): Subscription!

  markNotificationAsRead(id: ID!): Notification!
  markAllNotificationsAsRead: [Notification!]!

  sendTestPushNotification(
    title: String
    body: String
    url: String
    type: String
    tag: String
  ): Boolean!

  sendTestNotification(
    commentId: ID
    # repoId of document belonging to a format
    repoId: ID
    simulateAllPossibleSubscriptions: Boolean
  ): Boolean!
}

type subscriptions {
  webNotification: WebNotification!
  notification: Notification!
}
`
