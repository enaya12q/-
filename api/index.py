from flask import Flask, render_template, request, redirect, url_for, session, flash, g, jsonify
import sqlite3
import os
from datetime import datetime, timedelta
import uuid
import smtplib
from email.mime.text import MIMEText
from werkzeug.security import generate_password_hash, check_password_hash

# Adjust template_folder and static_folder for Vercel deployment
app = Flask(__name__, template_folder="../templates", static_folder="../static")
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'super_secret_key_for_dev')
app.config['DATABASE'] = 'database.db'
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'enayabasmaji9@gmail.com'
app.config['MAIL_PASSWORD'] = 'yymu fxwr hnws yzxu' # App password

ADMIN_EMAIL = 'enayabasmaji9@gmail.com'

def get_db():
    db_path = os.path.join(app.root_path, '..', app.config['DATABASE'])
    if 'db' not in g:
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        schema_path = os.path.join(app.root_path, '..', 'schema.sql')
        with open(schema_path, mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# Initialize the database when the app starts, if it doesn't exist
with app.app_context():
    db_path = os.path.join(app.root_path, '..', app.config['DATABASE'])
    if not os.path.exists(db_path):
        init_db()

@app.before_request
def before_request():
    g.user = None
    if 'user_id' in session:
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        if user:
            g.user = user
        else:
            session.pop('user_id', None)
            g.user = None
    else:
        g.user = None

@app.route('/')
def index():
    if g.user:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

# --- Authentication Routes ---

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if g.user:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        referrer_id = request.args.get('ref')

        if not email or not password or not confirm_password:
            flash('All fields are required.', 'error')
            return render_template('signup.html', email=email)

        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('signup.html', email=email)

        db = get_db()
        existing_user = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing_user:
            flash('Email already registered.', 'error')
            return render_template('signup.html', email=email)

        password_hash = generate_password_hash(password)
        verification_token = str(uuid.uuid4())

        try:
            cursor = db.execute(
                'INSERT INTO users (email, password_hash, balance, referrer_id, verification_token, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
                (email, password_hash, 0.0, referrer_id, verification_token, 0)
            )
            db.commit()
            user_id = cursor.lastrowid

            send_verification_email(email, verification_token)
            flash('A verification email has been sent to your inbox. Please verify your email to activate your account.', 'info')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('An error occurred during registration. Please try again.', 'error')
            return render_template('signup.html', email=email)

    return render_template('signup.html')

@app.route('/verify_email/<token>')
def verify_email(token):
    db = get_db()
    user = db.execute('SELECT id FROM users WHERE verification_token = ?', (token,)).fetchone()

    if user:
        db.execute('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', (user['id'],))
        db.commit()
        flash('Your email has been successfully verified! You can now log in.', 'success')
    else:
        flash('Invalid or expired verification link.', 'error')
    return redirect(url_for('login'))

def send_verification_email(email, token):
    verification_link = url_for('verify_email', token=token, _external=True)
    msg = MIMEText(f'Please click the following link to verify your email: {verification_link}')
    msg['Subject'] = 'Verify your Smart Lab account'
    msg['From'] = app.config['MAIL_USERNAME']
    msg['To'] = email

    try:
        with smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT']) as server:
            server.starttls()
            server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
            server.send_message(msg)
    except Exception as e:
        print(f"Error sending verification email: {e}")
        flash('Failed to send verification email. Please try again later.', 'error')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if g.user:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        db = get_db()
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

        if user and check_password_hash(user['password_hash'], password):
            if user['is_verified']:
                session['user_id'] = user['id']
                flash('Logged in successfully!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Please verify your email before logging in.', 'warning')
        else:
            flash('Invalid email or password.', 'error')

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

# --- Dashboard and Ad System ---

@app.route('/dashboard')
def dashboard():
    if not g.user:
        return redirect(url_for('login'))

    db = get_db()
    user_id = g.user['id']
    user_balance = g.user['balance']

    today = datetime.now().strftime('%Y-%m-%d')
    ad_clicks_today = db.execute(
        'SELECT ad_type, COUNT(*) as count FROM ad_clicks WHERE user_id = ? AND date = ? GROUP BY ad_type',
        (user_id, today)
    ).fetchall()

    clicks_ad1 = 0
    clicks_ad2 = 0
    for click in ad_clicks_today:
        if click['ad_type'] == 'popunder1':
            clicks_ad1 = click['count']
        elif click['ad_type'] == 'popunder2':
            clicks_ad2 = click['count']

    total_clicks_today = clicks_ad1 + clicks_ad2

    referral_link = url_for('signup', ref=user_id, _external=True)

    return render_template(
        'dashboard.html',
        balance=user_balance,
        clicks_ad1=clicks_ad1,
        clicks_ad2=clicks_ad2,
        total_clicks_today=total_clicks_today,
        referral_link=referral_link,
        ad_limit_per_button=25,
        ad_total_limit=50
    )

@app.route("/api/add_balance", methods=["POST"])
def add_balance():
    if not g.user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = g.user['id']
    data = request.json
    ad_type = data.get("ad_type")

    if not ad_type:
        return jsonify({"error": "Ad type is required"}), 400

    db = get_db()
    today = datetime.now().strftime('%Y-%m-%d')

    # Check daily limit for the specific ad type
    clicks_for_ad_type = db.execute(
        'SELECT COUNT(*) FROM ad_clicks WHERE user_id = ? AND ad_type = ? AND date = ?',
        (user_id, ad_type, today)
    ).fetchone()[0]

    if clicks_for_ad_type >= 25:
        return jsonify({"error": f"Daily limit reached for {ad_type}"}), 403

    # Check total daily limit
    total_clicks_today = db.execute(
        'SELECT COUNT(*) FROM ad_clicks WHERE user_id = ? AND date = ?',
        (user_id, today)
    ).fetchone()[0]

    if total_clicks_today >= 50:
        return jsonify({"error": "Total daily ad click limit reached (50 total)."}), 403

    try:
        amount = 0.001
        db.execute("UPDATE users SET balance = balance + ? WHERE id=?", (amount, user_id))
        db.execute("INSERT INTO ad_clicks (user_id, ad_type, date) VALUES (?, ?, ?)", (user_id, ad_type, today))
        db.commit()

        new_balance = db.execute("SELECT balance FROM users WHERE id=?", (user_id,)).fetchone()['balance']
        return jsonify({"new_balance": new_balance, "message": f"You earned {amount:.3f} USD from {ad_type}!"})
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"An error occurred: {e}"}), 500

# --- Withdrawal System ---

@app.route('/withdraw', methods=['GET', 'POST'])
def withdraw():
    if not g.user:
        return redirect(url_for('login'))

    if request.method == 'POST':
        amount_str = request.form['amount']
        try:
            amount = float(amount_str)
        except ValueError:
            flash('Invalid amount. Please enter a number.', 'error')
            return render_template('withdraw.html', balance=g.user['balance'])

        if amount < 0.5:
            flash('Minimum withdrawal amount is 0.5 USD.', 'error')
            return render_template('withdraw.html', balance=g.user['balance'])

        if g.user['balance'] < amount:
            flash('Insufficient balance.', 'error')
            return render_template('withdraw.html', balance=g.user['balance'])

        db = get_db()
        try:
            db.execute('UPDATE users SET balance = balance - ? WHERE id = ?', (amount, g.user['id']))
            db.commit()

            # Handle referral commission
            if g.user['referrer_id']:
                referrer_id = g.user['referrer_id']
                commission_amount = amount * 0.05 # 5% commission
                db.execute('UPDATE users SET balance = balance + ? WHERE id = ?', (commission_amount, referrer_id))
                db.commit()
                flash(f'Referrer (ID: {referrer_id}) received {commission_amount:.3f} USD commission.', 'info')

            send_withdrawal_notification(g.user['id'], g.user['email'], amount)
            flash(f'Withdrawal of {amount:.2f} USD successful! An admin will process your request.', 'success')
            return redirect(url_for('dashboard'))
        except Exception as e:
            flash(f'An error occurred during withdrawal: {e}', 'error')
            db.rollback()

    return render_template('withdraw.html', balance=g.user['balance'])

def send_withdrawal_notification(user_id, user_email, amount):
    msg = MIMEText(f'User ID: {user_id}\nEmail: {user_email}\nAmount: {amount:.2f} USD')
    msg['Subject'] = 'New Withdrawal Request - Smart Lab'
    msg['From'] = app.config['MAIL_USERNAME']
    msg['To'] = ADMIN_EMAIL

    try:
        with smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT']) as server:
            server.starttls()
            server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
            server.send_message(msg)
    except Exception as e:
        print(f"Error sending withdrawal notification email: {e}")
        # Log this error, but don't prevent the withdrawal from completing

@app.route('/api/hello')
def hello():
    return jsonify({"message": "Hello from Flask API!"})