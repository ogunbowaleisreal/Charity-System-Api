import axios from "axios";
import "dotenv/config";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const client = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
    }
});

async function clearAllAuthorizationsAndSubscriptions() {
    try {
        console.log("Fetching customers...");

        // 1️⃣ Get all customers
        const customersRes = await client.get("/customer");
        const customers = customersRes.data.data;

        for (const customer of customers) {
            console.log(`\nChecking customer: ${customer.email}`);

            // 2️⃣ Cancel all subscriptions
            const subscriptionsRes = await client.get(`/subscription?customer=${customer.customer_code}`);
            const subscriptions = subscriptionsRes.data.data;

            if (subscriptions && subscriptions.length > 0) {
                for (const sub of subscriptions) {
                    console.log(` -> Cancelling subscription: ${sub.subscription_code}`);
                    await client.post("/subscription/disable", {
                        code: sub.subscription_code
                    });
                }
            } else {
                console.log(" -> No subscriptions found.");
            }

            // 3️⃣ Deactivate all authorizations (cards)
            const authRes = await client.get(`/customer/${customer.customer_code}`);
            const authorizations = authRes.data.data.authorizations;

            if (authorizations && authorizations.length > 0) {
                for (const auth of authorizations) {
                    console.log(` -> Removing card: ${auth.authorization_code}`);
                    await client.post("/customer/deactivate_authorization", {
                        authorization_code: auth.authorization_code
                    });
                }
            } else {
                console.log(" -> No saved cards.");
            }
        }

        console.log("\n🎉 DONE! All subscriptions cancelled and saved cards removed.");
    } catch (error: any) {
        console.error("Error:", error.response?.data || error.message);
    }
}

clearAllAuthorizationsAndSubscriptions();

// import axios from "axios";
// import "dotenv/config";

// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// const client = axios.create({
//     baseURL: "https://api.paystack.co",
//     headers: {
//         Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//         "Content-Type": "application/json"
//     }
// });

// async function clearAllAuthorizations() {
//     try {
//         console.log("Fetching customers...");

//         // 1️⃣ Get all customers
//         const customersRes = await client.get("/customer");
//         const customers = customersRes.data.data;

//         for (const customer of customers) {
//             console.log(`Checking customer: ${customer.email}`);

//             // 2️⃣ Fetch authorizations for this customer
//             const authRes = await client.get(`/customer/${customer.customer_code}`);
//             const authorizations = authRes.data.data.authorizations;

//             if (!authorizations || authorizations.length === 0) {
//                 console.log(" -> No saved cards.");
//                 continue;
//             }

//             // 3️⃣ Disable each authorization
//             for (const auth of authorizations) {
//                 console.log(` -> Removing card: ${auth.signature}`);

//                 await client.post("/customer/deactivate_authorization", {
//                     authorization_code: auth.authorization_code
//                 });
//             }
//         }

//         console.log("🎉 DONE! All saved cards removed.");
//     } catch (error: any) {
//         console.error("Error:", error.response?.data || error.message);
//     }
// }

// clearAllAuthorizations();
