const { supabase, rewardPerAd, maxDailyAds, referralPercentage } = require('../config/config');
const { sendAdminNotification } = require('../utils/mailer');

const adController = {
    // Get available ads for user
    async getAvailableAds(req, res) {
        try {
            const { user } = req;
            const today = new Date().toISOString().split('T')[0];

            // Get today's ad views for user
            const { data: adViews, error: viewError } = await supabase
                .from('ad_views')
                .select('count')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (viewError) throw viewError;

            const viewCount = adViews?.count || 0;
            const remainingAds = maxDailyAds - viewCount;

            res.json({
                remainingAds,
                canWatch: remainingAds > 0,
                rewardPerAd
            });
        } catch (error) {
            console.error('Error getting available ads:', error);
            res.status(500).json({ error: 'Failed to get available ads' });
        }
    },


    // Get user stats
    async getUserStats(req, res) {
        try {
            const { user } = req;

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('balance, referral_earnings, referral_code')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            const today = new Date().toISOString().split('T')[0];
            const { data: adViews, error: viewError } = await supabase
                .from('ad_views')
                .select('count')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (viewError && viewError.code !== 'PGRST116') throw viewError;

            res.json({
                balance: userData.balance,
                referralEarnings: userData.referral_earnings,
                referralCode: userData.referral_code,
                todayAdViews: adViews?.count || 0,
                remainingAds: maxDailyAds - (adViews?.count || 0)
            });
        } catch (error) {
            console.error('Error getting user stats:', error);
            res.status(500).json({ error: 'Failed to get user stats' });
        }
    }
};

module.exports = adController;