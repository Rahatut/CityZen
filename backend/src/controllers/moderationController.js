const { User, Citizen, Complaint } = require('../models');

/**
 * Add strike to a citizen user
 * Admin only action
 */
const addStrike = async (req, res) => {
  try {
    const { citizenUid, reason, complaintId } = req.body;

    if (!citizenUid) {
      return res.status(400).json({ message: 'citizenUid is required' });
    }

    // Find the user
    const user = await User.findByPk(citizenUid, {
      include: [{ model: Citizen}]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.Citizen) {
      return res.status(400).json({ message: 'User is not a citizen' });
    }

    // Increment strike count
    const newStrikeCount = user.Citizen.strikes + 1;
    await user.Citizen.update({
      strikes: newStrikeCount
    });

    // Log the strike action
    console.log(`Strike added to user ${citizenUid}. Total strikes: ${newStrikeCount}. Reason: ${reason || 'Not specified'}`);

    // Check if user should be auto-banned (5 or more strikes)
    const shouldBan = newStrikeCount >= 5;

    return res.status(200).json({
      message: `Strike added successfully. User now has ${newStrikeCount} strike(s).`,
      strikes: newStrikeCount,
      shouldBan,
      userId: citizenUid,
      isBanned: user.Citizen.isBanned
    });

  } catch (error) {
    console.error('Error adding strike:', error);
    return res.status(500).json({ 
      message: 'Failed to add strike',
      error: error.message 
    });
  }
};

/**
 * Ban a citizen user permanently
 * Admin only action
 */
const banUser = async (req, res) => {
  try {
    const { citizenUid, reason } = req.body;

    if (!citizenUid) {
      return res.status(400).json({ message: 'citizenUid is required' });
    }

    // Find the user
    const user = await User.findByPk(citizenUid, {
      include: [{ model: Citizen}]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.Citizen) {
      return res.status(400).json({ message: 'User is not a citizen' });
    }

    if (user.Citizen.isBanned) {
      return res.status(400).json({ message: 'User is already banned' });
    }

    // Ban the user
    await user.Citizen.update({
      isBanned: true,
      bannedAt: new Date(),
      banReason: reason || 'Accumulated 5 or more strikes for policy violations'
    });

    console.log(`User ${citizenUid} has been banned. Reason: ${reason || 'Multiple strikes'}`);

    return res.status(200).json({
      message: 'User banned successfully',
      userId: citizenUid,
      bannedAt: user.Citizen.bannedAt,
      banReason: user.Citizen.banReason
    });

  } catch (error) {
    console.error('Error banning user:', error);
    return res.status(500).json({ 
      message: 'Failed to ban user',
      error: error.message 
    });
  }
};

/**
 * Unban a citizen user
 * Admin only action
 */
const unbanUser = async (req, res) => {
  try {
    const { citizenUid } = req.body;

    if (!citizenUid) {
      return res.status(400).json({ message: 'citizenUid is required' });
    }

    // Find the user
    const user = await User.findByPk(citizenUid, {
      include: [{ model: Citizen}]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.Citizen) {
      return res.status(400).json({ message: 'User is not a citizen' });
    }

    if (!user.Citizen.isBanned) {
      return res.status(400).json({ message: 'User is not currently banned' });
    }

    // Unban the user (but keep strike count)
    await user.Citizen.update({
      isBanned: false,
      bannedAt: null,
      banReason: null
    });

    console.log(`User ${citizenUid} has been unbanned`);

    return res.status(200).json({
      message: 'User unbanned successfully',
      userId: citizenUid,
      strikes: user.Citizen.strikes
    });

  } catch (error) {
    console.error('Error unbanning user:', error);
    return res.status(500).json({ 
      message: 'Failed to unban user',
      error: error.message 
    });
  }
};

/**
 * Get user moderation info (strikes, ban status)
 * Admin only action
 */
const getUserModerationInfo = async (req, res) => {
  try {
    const { citizenUid } = req.params;

    if (!citizenUid) {
      return res.status(400).json({ message: 'citizenUid is required' });
    }

    // Find the user
    const user = await User.findByPk(citizenUid, {
      include: [{ model: Citizen}]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.Citizen) {
      return res.status(400).json({ message: 'User is not a citizen' });
    }

    return res.status(200).json({
      userId: citizenUid,
      email: user.email,
      strikes: user.Citizen.strikes,
      isBanned: user.Citizen.isBanned,
      bannedAt: user.Citizen.bannedAt,
      banReason: user.Citizen.banReason,
      ward: user.Citizen.ward
    });

  } catch (error) {
    console.error('Error getting user moderation info:', error);
    return res.status(500).json({ 
      message: 'Failed to get user info',
      error: error.message 
    });
  }
};

/**
 * Get all banned users
 * Admin only action
 */
const getBannedUsers = async (req, res) => {
  try {
    const bannedUsers = await Citizen.findAll({
      where: { isBanned: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['uid', 'email', 'createdAt']
      }],
      order: [['bannedAt', 'DESC']]
    });

    const formattedUsers = bannedUsers.map(citizen => ({
      uid: citizen.user.uid,
      email: citizen.user.email,
      strikes: citizen.strikes,
      bannedAt: citizen.bannedAt,
      banReason: citizen.banReason,
      ward: citizen.ward,
      createdAt: citizen.user.createdAt
    }));

    return res.status(200).json({
      count: formattedUsers.length,
      bannedUsers: formattedUsers
    });

  } catch (error) {
    console.error('Error getting banned users:', error);
    return res.status(500).json({ 
      message: 'Failed to get banned users',
      error: error.message 
    });
  }
};

/**
 * Get current user's own moderation info (strikes, ban status)
 * Available to citizen users
 */
const getMyModerationInfo = async (req, res) => {
  try {
    const { citizenUid } = req.params;
    
    console.log('=== GET MY STRIKES ENDPOINT CALLED ===');
    console.log('Citizen UID from params:', citizenUid);

    if (!citizenUid) {
      console.log('ERROR: No citizenUid provided');
      return res.status(400).json({ message: 'citizenUid is required' });
    }

    // Find the user
    console.log('Searching for user with UID:', citizenUid);
    const user = await User.findByPk(citizenUid, {
      include: [{ model: Citizen, required: false }]
    });

    if (!user) {
      console.log('ERROR: User not found for UID:', citizenUid);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', {
      uid: user.firebaseUid,
      email: user.email,
      role: user.role,
      hasCitizenProfile: !!user.Citizen
    });

    // If user doesn't have a Citizen profile, return default values
    if (!user.Citizen) {
      console.log('No Citizen profile found, returning default values');
      return res.status(200).json({
        strikes: 0,
        isBanned: false,
        bannedAt: null,
        banReason: null
      });
    }

    const response = {
      strikes: user.Citizen.strikes || 0,
      isBanned: user.Citizen.isBanned || false,
      bannedAt: user.Citizen.bannedAt,
      banReason: user.Citizen.banReason
    };
    
    console.log('Returning strike info:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('=== ERROR IN GET MY STRIKES ===');
    console.error('Error getting user moderation info:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ 
      message: 'Failed to get moderation info',
      error: error.message 
    });
  }
};

module.exports = {
  addStrike,
  banUser,
  unbanUser,
  getUserModerationInfo,
  getBannedUsers,
  getMyModerationInfo
};
