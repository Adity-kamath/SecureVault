const crypto = require('crypto');
const Credential = require('../models/Credential');
const { decryptPassword } = require('../utils/crypto');

/**
 * @route   GET /api/health/me
 * @desc    Get personal password health report for current employee
 * @access  Private
 */
const getMyHealth = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const credentials = await Credential.find({ ownerId: userId }).lean();

    if (credentials.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalCredentials: 0,
          overallScore: 100,
          weakCount: 0,
          reusedCount: 0,
          oldCount: 0,
          needAttentionCount: 0
        },
        items: []
      });
    }

    const now = Date.now();
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

    // Decrypt credentials in-memory only to compute anonymous hashes for reuse detection
    const hashes = new Map(); // hash -> count
    const itemDetails = [];

    for (const cred of credentials) {
      let passHash = '';
      try {
        const decrypted = decryptPassword(cred.encryptedPassword, cred.iv, cred.authTag);
        passHash = crypto.createHash('sha256').update(decrypted).digest('hex');
      } catch (err) {
        passHash = 'decryption_error';
      }

      hashes.set(passHash, (hashes.get(passHash) || 0) + 1);

      const updatedTime = new Date(cred.lastUpdated || cred.updatedAt || cred.createdAt).getTime();
      const ageDays = Math.floor((now - updatedTime) / (24 * 60 * 60 * 1000));
      const isOld = (now - updatedTime) > NINETY_DAYS_MS;
      const isWeak = (cred.strengthScore || 0) < 3;

      itemDetails.push({
        id: cred._id,
        title: cred.title,
        username: cred.username,
        url: cred.url,
        strengthScore: cred.strengthScore,
        passHash,
        isWeak,
        isOld,
        ageDays,
        lastUpdated: cred.lastUpdated || cred.updatedAt
      });
    }

    let weakCount = 0;
    let reusedCount = 0;
    let oldCount = 0;
    let totalScoreSum = 0;

    const items = itemDetails.map((item) => {
      const isReused = (hashes.get(item.passHash) || 0) > 1;
      const reuseOccurrences = hashes.get(item.passHash) || 1;

      if (item.isWeak) weakCount++;
      if (isReused) reusedCount++;
      if (item.isOld) oldCount++;

      // Score contribution: strengthScore (0-4) * 25
      let itemScore = item.strengthScore * 25;
      if (isReused) itemScore = Math.max(0, itemScore - 30);
      if (item.isOld) itemScore = Math.max(0, itemScore - 15);
      totalScoreSum += Math.max(0, itemScore);

      // Do NOT leak passHash in API response
      const { passHash, ...sanitized } = item;
      return {
        ...sanitized,
        isReused,
        reuseOccurrences
      };
    });

    const overallScore = Math.round(totalScoreSum / credentials.length);
    const needAttentionCount = items.filter((i) => i.isWeak || i.isReused || i.isOld).length;

    res.status(200).json({
      success: true,
      summary: {
        totalCredentials: credentials.length,
        overallScore,
        weakCount,
        reusedCount,
        oldCount,
        needAttentionCount
      },
      items
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyHealth
};
