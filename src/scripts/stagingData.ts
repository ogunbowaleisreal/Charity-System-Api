import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { Donation } from "../models/Donations";
import Campaign from "../models/Campaign";

// Set to true if you want to overwrite donations that already have a
// campaignOwner set (e.g. re-running after a campaign ownership transfer).
// Default false = skip donations that already have campaignOwner, so this
// script is safe to re-run repeatedly.
const FORCE_OVERWRITE = false;

const BATCH_SIZE = 500;

async function run() {
    const uri = process.env["ATLAS_DATABASE_URI"]
    if (!uri) throw new Error("MONGODB_URI is not set");

    await mongoose.connect(uri);
    console.log("Connected to database");

    const filter: any = FORCE_OVERWRITE
        ? {}
        : { $or: [{ campaignOwner: { $exists: false } }, { campaignOwner: null }] };

    const totalDonations = await Donation.countDocuments(filter);
    console.log(`Found ${totalDonations} donation(s) to process...`);

    let processed = 0;
    let updated = 0;
    let skippedNoCampaign = 0;
    let skippedNoOwner = 0;
    let failed = 0;

    let lastId: mongoose.Types.ObjectId | null = null;

    while (true) {
        const pageFilter: any = { ...filter };
        if (lastId) {
            pageFilter._id = { $gt: lastId };
        }

        const donations = await Donation.find(pageFilter)
            .sort({ _id: 1 })
            .limit(BATCH_SIZE)
            .select("_id campaign campaignOwner")
            .lean();

        if (donations.length === 0) break;

        const campaignIds = [
            ...new Set(donations.map((d) => d.campaign?.toString()).filter(Boolean)),
        ];

        const campaigns = await Campaign.find({ _id: { $in: campaignIds } })
            .select("_id owner")
            .lean();

        const ownerByCampaignId = new Map(
            campaigns.map((c) => [c._id.toString(), c.owner])
        );

        const bulkOps: any[] = [];

        for (const donation of donations) {
            processed++;

            if (!donation.campaign) {
                skippedNoCampaign++;
                console.warn(`  ⚠ Donation ${donation._id} has no campaign reference — skipped`);
                continue;
            }

            const owner = ownerByCampaignId.get(donation.campaign.toString());

            if (!owner) {
                skippedNoOwner++;
                console.warn(
                    `  ⚠ Donation ${donation._id} — campaign ${donation.campaign} not found (deleted?) or has no owner — skipped`
                );
                continue;
            }

            bulkOps.push({
                updateOne: {
                    filter: { _id: donation._id },
                    update: { $set: { campaignOwner: owner } },
                },
            });
        }

        if (bulkOps.length) {
            try {
                const result = await Donation.bulkWrite(bulkOps, { ordered: false });
                updated += result.modifiedCount ?? 0;
            } catch (err: any) {
                failed += bulkOps.length;
                console.error(`  ✗ Bulk write error on this batch: ${err.message}`);
            }
        }

        lastId = donations[donations.length - 1]._id as mongoose.Types.ObjectId;
        console.log(`  ...processed ${processed}/${totalDonations}`);
    }

    console.log(`\nDone. ${processed} donation(s) checked.`);
    console.log(
        `Updated: ${updated}, skipped (no campaign ref): ${skippedNoCampaign}, skipped (campaign/owner not found): ${skippedNoOwner}, failed: ${failed}`
    );

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});