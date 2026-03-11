const cron = require("node-cron");
const RefreshToken = require("../models/refreshTokens");
const ArchivedToken = require("../models/ArchivedTokens");

const ARCHIVE_AFTER_DAYS = 90;          // move to archive after 90 days
const PURGE_ARCHIVED_AFTER_DAYS = 365;  // delete from archive after 1 year

const startTokenCleanup = () => {
  // Runs every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("🧹 [Token Cleanup] Starting daily token cleanup...");

    try {
      // STEP 1: Archive tokens older than 90 days
      const archiveCutoff = new Date();
      archiveCutoff.setDate(archiveCutoff.getDate() - ARCHIVE_AFTER_DAYS);

      const tokensToArchive = await RefreshToken.find({
        createdAt: { $lte: archiveCutoff },
      });

      if (tokensToArchive.length > 0) {
        // Insert into ArchivedTokens first, never delete before insert
        await ArchivedToken.insertMany(
          tokensToArchive.map((t) => ({
            userId:    t.userId,
            token:     t.token,
            expiry:    t.expiry,
            revoked:   t.revoked,
            archivedAt: new Date(),
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
          { ordered: false } // don't let one failure block the rest
        );

        // Only delete from RefreshTokens after successful archive
        await RefreshToken.deleteMany({
          _id: { $in: tokensToArchive.map((t) => t._id) },
        });

        console.log(`✅ [Token Cleanup] Archived ${tokensToArchive.length} token(s) to ArchivedTokens.`);
      } else {
        console.log("✅ [Token Cleanup] No tokens to archive.");
      }

      // STEP 2: Clean up expired/revoked tokens under 90 days
      // These are short-lived tokens that expired or were revoked before
      // reaching the 90 day archive threshold — no audit value, safe to delete
      const cleaned = await RefreshToken.deleteMany({
        $or: [
          { expiry: { $lt: new Date() } }, // expired
          { revoked: true },               // manually revoked
        ],
      });

      console.log(`🧼 [Token Cleanup] Removed ${cleaned.deletedCount} expired/revoked token(s) from RefreshTokens.`);

      // STEP 3: Purge archived tokens older than 1 year
      const purgeCutoff = new Date();
      purgeCutoff.setDate(purgeCutoff.getDate() - PURGE_ARCHIVED_AFTER_DAYS);

      const purged = await ArchivedToken.deleteMany({
        archivedAt: { $lt: purgeCutoff },
      });

      console.log(`🗑️  [Token Cleanup] Purged ${purged.deletedCount} archived token(s) older than ${PURGE_ARCHIVED_AFTER_DAYS} days.`);

    } catch (error) {
      console.error("❌ [Token Cleanup] Failed:", error.message);
    }
  });

  console.log("📅 [Token Cleanup] Cron job scheduled — runs daily at midnight.");
};

module.exports = startTokenCleanup;