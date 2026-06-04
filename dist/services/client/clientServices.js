"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientServices = void 0;
const Accounts_1 = require("../../models/Accounts");
class ClientServices {
    async getClientById(clientId) {
        const client = await Accounts_1.Account.findById(clientId);
        if (client) {
            return client;
        }
        return null;
    }
}
exports.ClientServices = ClientServices;
