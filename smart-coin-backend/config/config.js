require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Export configuration
module.exports = {
    port: process.env.PORT || 3001,
    supabase,
    rewardPerAd: parseFloat(process.env.REWARD_PER_AD) || 0.002,
    maxDailyAds: parseInt(process.env.MAX_DAILY_ADS) || 50,
    referralPercentage: parseFloat(process.env.REFERRAL_PERCENTAGE) || 0.10,
    adminEmail: process.env.ADMIN_EMAIL,
    isDevelopment: process.env.NODE_ENV === 'development'
};