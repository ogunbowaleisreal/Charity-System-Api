"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientManagement = void 0;
const Accounts_1 = require("../../models/Accounts");
class clientManagement {
    async getAllClients(filter) {
        const client = await Accounts_1.Account.find({ role: "client" });
        if (client) {
            return client;
        }
        return null;
    }
}
exports.clientManagement = clientManagement;
