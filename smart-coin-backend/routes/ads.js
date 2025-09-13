import express from "express";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

// قاعدة بيانات مؤقتة بالذاكرة
let users = {};
// users = {
//   "7645815913": { username: "SMARTCOIN", wallet: "xx", earnings: 0.006, lastAdDate: "2025-09-12", referrerId: "123" }
// }

// قيمة الربح لكل إعلان
const REWARD_PER_AD = 0.002;
// نسبة الإحالة
const REFERRAL_BONUS = 0.1;
// الحد الأدنى للسحب
const MIN_WITHDRAW = 1;

// تسجيل مشاهدة إعلان
router.post("/view", (req, res) => {
    try {
        const { userId, username } = req.body;
        if (!userId || !username) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        const today = new Date().toISOString().split("T")[0];

        if (!users[userId]) {
            users[userId] = { username, earnings: 0, lastAdDate: null, wallet: null, referrerId: null };
        }

        // تحديث الأرباح
        if (users[userId].lastAdDate === today) {
            users[userId].earnings += REWARD_PER_AD;
        } else {
            users[userId].lastAdDate = today;
            users[userId].earnings += REWARD_PER_AD;
        }

        // مكافأة الإحالة
        if (users[userId].referrerId && users[users[userId].referrerId]) {
            const parent = users[users[userId].referrerId];
            const bonus = REWARD_PER_AD * REFERRAL_BONUS;
            parent.earnings += bonus;
        }

        res.json({
            success: true,
            message: "Ad view recorded ✅",
            earnings: users[userId].earnings.toFixed(3),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// تعيين محفظة المستخدم
router.post("/set-wallet", (req, res) => {
    const { userId, wallet } = req.body;
    if (!userId || !wallet) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }
    if (!users[userId]) return res.status(404).json({ success: false, message: "User not found" });

    users[userId].wallet = wallet;
    res.json({ success: true, message: "Wallet set successfully" });
});

// ربط إحالة (userId هو الحالي، referrerId هو يلي دعاه)
router.post("/set-referrer", (req, res) => {
    const { userId, referrerId } = req.body;
    if (!userId || !referrerId) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }
    if (!users[userId]) {
        users[userId] = { username: "Unknown", earnings: 0, lastAdDate: null, wallet: null, referrerId: null };
    }
    if (!users[referrerId]) {
        return res.status(404).json({ success: false, message: "Referrer not found" });
    }

    users[userId].referrerId = referrerId;
    res.json({ success: true, message: `Referral set to ${referrerId}` });
});

// طلب سحب
router.post("/withdraw", async (req, res) => {
    const { userId } = req.body;
    if (!userId || !users[userId]) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[userId];
    if (user.earnings < MIN_WITHDRAW) {
        return res.status(400).json({ success: false, message: "Not enough balance to withdraw" });
    }

    if (!user.wallet) {
        return res.status(400).json({ success: false, message: "Wallet not set" });
    }

    // إرسال إيميل إلى الأدمن
    await sendMail(
        "Withdrawal Request",
        `User <b>${user.username}</b> (ID: ${userId}) requested a withdrawal.<br/>
     Wallet: <b>${user.wallet}</b><br/>
     Amount: <b>${user.earnings.toFixed(3)}$</b>`
    );

    // تصفير الأرباح بعد الطلب
    user.earnings = 0;

    res.json({ success: true, message: "Withdrawal request sent ✅" });
});

export default router;
