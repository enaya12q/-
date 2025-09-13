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

    // Record ad view and award reward
    async recordAdView(req, res) {
        try {
            const { user } = req;
            const today = new Date().toISOString().split('T')[0];

            // Start transaction
            const { data: { user: userData }, error: userError } = await supabase
                .from('users')
                .select('referrer_id, balance')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            // Check daily limit
            const { data: adViews, error: viewError } = await supabase
                .from('ad_views')
                .select('count')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (viewError && viewError.code !== 'PGRST116') throw viewError;

            const viewCount = adViews?.count || 0;
            if (viewCount >= maxDailyAds) {
                return res.status(400).json({ error: 'Daily ad limit reached' });
            }

            // Record ad view and update balance
            const { error: updateError } = await supabase
                .from('users')
                .update({ balance: userData.balance + rewardPerAd })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Update ad views count
            const { error: recordError } = await supabase
                .from('ad_views')
                .upsert([
                    { user_id: user.id, date: today, count: viewCount + 1 }
                ]);

            if (recordError) throw recordError;

            // Handle referral reward if applicable
            if (userData.referrer_id) {
                const referralReward = rewardPerAd * referralPercentage;
                const { error: referralError } = await supabase
                    .from('users')
                    .update({
                        referral_earnings: supabase.raw('referral_earnings + ?', [referralReward])
                    })
                    .eq('id', userData.referrer_id);

                if (referralError) throw referralError;
            }

            // Notify admin if user reaches daily limit
            if (viewCount + 1 >= maxDailyAds) {
                await sendAdminNotification({
                    type: 'daily_limit',
                    userId: user.id,
                    earnings: maxDailyAds * rewardPerAd
                });
            }

            res.json({
                success: true,
                reward: rewardPerAd,
                remainingAds: maxDailyAds - (viewCount + 1)
            });
        } catch (error) {
            console.error('Error recording ad view:', error);
            res.status(500).json({ error: 'Failed to record ad view' });
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