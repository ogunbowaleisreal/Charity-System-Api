import { Account } from "../../models/Accounts";


export class clientManagement {

    async getAllClients(filter?: {}) {

        const client = await Account.find({ role: "client" })

        if (client) {
            return client
        }
        return null
    }


}