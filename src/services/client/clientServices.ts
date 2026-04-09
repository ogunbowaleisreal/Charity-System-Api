import mongoose from "mongoose";
//import { updateClientProfile } from "../../types/clientprofile";
import clientProfile from "../../models/clientProfile";
import { Account } from "../../models/Accounts";
import { comparePassword } from "../../utils/hash.utils";

export class ClientServices {


    async getClientById(clientId: string) {
        const client = await Account.findById(clientId)

        if (client) {
            return client
        }
        return null
    }

}