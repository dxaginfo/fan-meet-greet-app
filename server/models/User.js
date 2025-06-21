const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * User model
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData 
   * @returns {Promise<Object>} Newly created user
   */
  static async create(userData) {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Insert user into database
      const [user] = await db('users')
        .insert({
          user_type: userData.userType,
          email: userData.email.toLowerCase(),
          password_hash: hashedPassword,
          first_name: userData.firstName,
          last_name: userData.lastName,
          profile_image_url: userData.profileImageUrl || null,
        })
        .returning('*');

      // Create additional profile based on user type
      if (userData.userType === 'artist') {
        await db('artists').insert({
          user_id: user.user_id,
          artist_name: userData.artistName || `${userData.firstName} ${userData.lastName}`,
          bio: userData.bio || '',
          social_media_links: userData.socialMediaLinks || {},
          preferences: userData.preferences || {},
          commission_rate: userData.commissionRate || 0,
        });
      } else if (userData.userType === 'fan') {
        await db('fans').insert({
          user_id: user.user_id,
          preferences: userData.preferences || {},
          accessibility_requirements: userData.accessibilityRequirements || '',
          payment_token: userData.paymentToken || null,
        });
      }

      // Return user without password
      delete user.password_hash;
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find a user by ID
   * @param {string} userId 
   * @returns {Promise<Object>} User if found, null otherwise
   */
  static async findById(userId) {
    try {
      const user = await db('users')
        .where({ user_id: userId })
        .first();

      if (!user) return null;

      // Remove password hash from user object
      delete user.password_hash;
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find a user by email
   * @param {string} email 
   * @returns {Promise<Object>} User if found, null otherwise
   */
  static async findByEmail(email) {
    try {
      const user = await db('users')
        .where({ email: email.toLowerCase() })
        .first();

      return user || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Get complete user profile with type-specific information
   * @param {string} userId 
   * @returns {Promise<Object>} Complete user profile
   */
  static async getCompleteProfile(userId) {
    try {
      const user = await db('users')
        .where({ user_id: userId })
        .first();

      if (!user) return null;

      // Remove password hash from user object
      delete user.password_hash;

      // Get additional profile information based on user type
      if (user.user_type === 'artist') {
        const artistProfile = await db('artists')
          .where({ user_id: userId })
          .first();
        
        return { ...user, profile: artistProfile };
      } else if (user.user_type === 'fan') {
        const fanProfile = await db('fans')
          .where({ user_id: userId })
          .first();
        
        return { ...user, profile: fanProfile };
      }

      return user;
    } catch (error) {
      console.error('Error getting complete user profile:', error);
      throw error;
    }
  }

  /**
   * Update a user
   * @param {string} userId 
   * @param {Object} userData 
   * @returns {Promise<Object>} Updated user
   */
  static async update(userId, userData) {
    try {
      const updateData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        profile_image_url: userData.profileImageUrl,
        updated_at: db.fn.now(),
      };

      // If password is provided, hash it
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(userData.password, salt);
      }

      // Update user
      const [updatedUser] = await db('users')
        .where({ user_id: userId })
        .update(updateData)
        .returning('*');

      // Update profile based on user type
      if (updatedUser.user_type === 'artist' && userData.profile) {
        await db('artists')
          .where({ user_id: userId })
          .update({
            artist_name: userData.profile.artistName,
            bio: userData.profile.bio,
            social_media_links: userData.profile.socialMediaLinks || {},
            preferences: userData.profile.preferences || {},
            commission_rate: userData.profile.commissionRate,
            updated_at: db.fn.now(),
          });
      } else if (updatedUser.user_type === 'fan' && userData.profile) {
        await db('fans')
          .where({ user_id: userId })
          .update({
            preferences: userData.profile.preferences || {},
            accessibility_requirements: userData.profile.accessibilityRequirements,
            payment_token: userData.profile.paymentToken,
            updated_at: db.fn.now(),
          });
      }

      // Remove password hash from user object
      delete updatedUser.password_hash;
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Authenticate a user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} User if authenticated, null otherwise
   */
  static async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);

      if (!user) return null;

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) return null;

      // Remove password hash from user object
      delete user.password_hash;
      return user;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param {string} userId 
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  static async delete(userId) {
    try {
      const deletedRows = await db('users')
        .where({ user_id: userId })
        .del();

      return deletedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User;