const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer'); // Assuming nodemailer is used in utils/mailer.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Assuming mailer.js exports sendUserEmail and sendAdminNotification functions
const { sendUserEmail } = require('../utils/mailer');

exports.withdraw = async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id; // Assuming req.user is populated by the protect middleware
    const userEmail = req.user.email; // Assuming req.user is populated by the protect middleware
    const userName = req.user.name; // Assuming req.user is populated by the protect middleware

    if (!userId || !userEmail) {
        return res.status(401).json({ error: 'Unauthorized: User not identified.' });
    }

    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount.' });
    }

    const minWithdrawal = 0.1;
    if (amount < minWithdrawal) {
        return res.status(400).json({ error: `Minimum withdrawal amount is $${minWithdrawal}.` });
    }

    try {
        // Fetch user's current balance
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            console.error('Error fetching user balance:', userError);
            return res.status(500).json({ error: 'Failed to fetch user balance.' });
        }

        const currentBalance = parseFloat(userData.balance);

        if (currentBalance < amount) {
            return res.status(400).json({ error: 'Insufficient balance for withdrawal.' });
        }

        // Deduct amount and record transaction in a single atomic operation (using a Supabase function if possible, or transaction)
        // For simplicity, we'll do it sequentially here, but a database transaction is recommended for production.
        const { error: updateError } = await supabase
            .from('users')
            .update({ balance: currentBalance - amount })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating user balance:', updateError);
            return res.status(500).json({ error: 'Failed to process withdrawal.' });
        }

        const { error: transactionError } = await supabase
            .from('transactions')
            .insert({ user_id: userId, type: 'withdrawal', amount: -amount }); // Negative amount for withdrawal

        if (transactionError) {
            console.error('Error recording withdrawal transaction:', transactionError);
            // Potentially revert balance update here if transaction fails
            return res.status(500).json({ error: 'Failed to record withdrawal transaction.' });
        }

        // Send email notification
        const emailSubject = 'User Wallet: Withdrawal Confirmation';
        const emailContent = `
            Hello ${userName},

            Your withdrawal of $${amount.toFixed(3)} has been successfully processed.
            Your new balance is $${(currentBalance - amount).toFixed(3)}.

            Thank you for using Smart Coin Labs!
        `;

        await sendUserEmail(userEmail, emailSubject, emailContent);

        res.status(200).json({ message: 'Withdrawal successful and email sent.', newBalance: currentBalance - amount });

    } catch (error) {
        console.error('Withdrawal process error:', error);
        res.status(500).json({ error: 'An unexpected error occurred during withdrawal.' });
    }
};