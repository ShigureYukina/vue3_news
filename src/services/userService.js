// src/services/userService.js
import Mock from "mockjs";
import multiavatar from "@multiavatar/multiavatar";

const R = Mock.Random;

/**
 * 根据用户ID生成模拟的用户个人信息
 * @param {string} userId - 用户ID
 * @returns {object} 模拟的用户信息对象
 */
const generateUserProfile = (userId) => {
  return {
    userId: userId,
    username: R.name(),
    email: R.email(),
    avatar: multiavatar(userId), // 根据用户ID生成一个独特的SVG头像
    registrationDate: R.date("yyyy-MM-dd"),
    bio: R.cparagraph(1, 3),
    address: {
      city: R.city(true),
      street: R.cword(3, 5) + "路" + R.natural(1, 100) + "号",
      zipcode: R.zip(),
    },
    stats: {
      articlesRead: R.natural(10, 500),
      commentsMade: R.natural(5, 100),
    },
  };
};

export const userService = {
  /**
   * 异步获取用户个人信息
   * @param {string} userId - 用户ID
   * @returns {Promise<{data: object}>} 包含用户信息的Promise
   */
  async getProfile(userId) {
    console.log(`正在获取用户ID的用户信息 (Mock.js): ${userId}`);
    // 模拟网络延迟
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 300)
    );

    // 基于用户ID生成个人信息
    const userProfile = generateUserProfile(userId);

    return { data: userProfile };
  },
};
