// import { ClientSubscription } from "../../models/clientSubcription"
// import { Types } from "mongoose"
// import transaction from "../../models/transaction"

// export type subscriptionFilter = {
//     status?: ["active", "non_renewing", "cancelled", "expired"],
//     planId?: Types.ObjectId,

// }
// export type transactionFilter = {
//     page?: number,
//     limit?: number,
//     status?: string,
//     planId?: Types.ObjectId,
//     reference?: string
// }

// export class SubscriptionManagementServices {
//     async getClientSubscription(clientId: string) {
//         return await ClientSubscription.findOne({ clientId: clientId, status: { $in: ["active", "non_renewing"] } }).populate('planId').lean()
//     }

//     async getAllActiveSubscriptions(page: number = 1, limit: number = 10, filters: subscriptionFilter = {}) {
//         const skip = (page - 1) * limit
//         console.log(filters)

//         const total = await ClientSubscription.countDocuments(filters)

//         const totalPages = Math.ceil(total / limit)

//         const subscriptions = await ClientSubscription.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('planId').populate('clientId').lean()
//         return { total, totalPages, subscriptions }
//     }

//     async getClientTransactionHistory(clientId: string, filter: transactionFilter = {}) {
//         console.log(filter)
//         const page = Number(filter.page) || 1
//         const limit = Number(filter.limit) || 10
//         const { page: _p, limit: _l, ...queryObj } = filter
//         const skip = (page - 1) * limit
//         const total = await transaction.countDocuments({ user: clientId, ...queryObj })
//         const totalPages = Math.ceil(total / limit)
//         const transactions = await transaction.find({ user: clientId, ...queryObj }).skip(skip).limit(limit).populate("plan").lean()
//         return { total, totalPages, transactions }
//     }

//     async verifyTransactiob() {

//     }

// }