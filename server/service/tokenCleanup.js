const cron = require("node-cron");
const RefreshToken = require("../models/refreshTokens");
const ArchivedToken = require("../models/ArchivedTokens");

const PURGE_ARCHIVED_AFTER_DAYS = 365; // delete archived tokens after 1 year

const startTokenCleanup = () => {
  // Runs every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("🧹 [Token Cleanup] Running expired token cleanup...");
    try {
      // Delete tokens that are expired OR revoked from the main collection
      const result = await RefreshToken.deleteMany({
        $or: [
          { expiry: { $lt: new Date() } }, // expired tokens
          { revoked: true },               // manually revoked tokens
        ],
      });
      console.log(`✅ [Token Cleanup] Removed ${result.deletedCount} expired/revoked token(s).`);

      // Purge archived tokens older than 1 year
      const purgedCutoff = new Date();
      purgedCutoff.setDate(purgedCutoff.getDate() - PURGE_ARCHIVED_AFTER_DAYS);

      const purged = await ArchivedToken.deleteMany({
        archivedAt: { $lt: purgedCutoff },
      });
      console.log(`🗑️  [Token Cleanup] Purged ${purged.deletedCount} archived token(s) older than ${PURGE_ARCHIVED_AFTER_DAYS} days.`);

    } catch (error) {
      console.error("❌ [Token Cleanup] Failed to clean up tokens:", error);
    }
  });

  console.log("📅 [Token Cleanup] Cron job scheduled — runs daily at midnight.");
};

module.exports = startTokenCleanup;