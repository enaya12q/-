
# --- Imports ---
import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, g, jsonify
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import uuid
import smtplib
from email.mime.text import MIMEText
from werkzeug.security import generate_password_hash, check_password_hash

# --- App Initialization ---
app = Flask(__name__, template_folder="../templates", static_folder="../static")
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'super_secret_key_for_dev')

# --- Email Config ---
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'enayabasmaji9@gmail.com')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'yymu fxwr hnws yzxu') # App password

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'enayabasmaji9@gmail.com')

def get_db():
    if 'db' not in g:
        g.db = psycopg2.connect(
            os.environ.get('DATABASE_URL'),
            cursor_factory=psycopg2.extras.RealDictCursor
        )
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        with open(os.path.join(os.path.dirname(__file__), '../schema.sql'), 'r') as f:
            cursor.execute(f.read())
        db.commit()
        cursor.close()

# Initialize the database when the app starts, if tables don't exist
with app.app_context():
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT 1 FROM users LIMIT 1;")
    except Exception:
        print("Database tables not found, initializing...")
        init_db()
    finally:
        cursor.close()
        close_db()

@app.before_request
def before_request():
    g.user = None
    if 'user_id' in session:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('SELECT * FROM users WHERE id = %s', (session['user_id'],))
        user = cursor.fetchone()
        if user:
            g.user = user
        else:
            session.pop('user_id', None)
            g.user = None
        cursor.close()
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
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        referrer_id = request.args.get('ref')

        if not email or not password or not confirm_password:
            flash('All fields are required.', 'error')
            return render_template('signup.html', email=email)

        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('signup.html', email=email)

        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            flash('Email already registered.', 'error')
            cursor.close()
            return render_template('signup.html', email=email)

        password_hash = generate_password_hash(password)
        verification_token = str(uuid.uuid4())

        try:
            cursor.execute(
                'INSERT INTO users (email, password_hash, balance, referrer_id, verification_token, is_verified) VALUES (%s, %s, %s, %s, %s, %s)',
                (email, password_hash, 0.0, referrer_id, verification_token, 0)
            )
            db.commit()
            send_verification_email(email, verification_token)
            flash('A verification email has been sent to your inbox. Please verify your email to activate your account.', 'info')
            cursor.close()
            return redirect(url_for('login'))
        except Exception as e:
            db.rollback()
            flash(f'An error occurred during registration: {e}. Please try again.', 'error')
            cursor.close()
            return render_template('signup.html', email=email)

    return render_template('signup.html')

@app.route('/verify_email/<token>')
def verify_email(token: str):
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('SELECT id FROM users WHERE verification_token = %s', (token,))
    user = cursor.fetchone()

    if user:
        cursor.execute('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = %s', (user['id'],))
        db.commit()
        flash('Your email has been successfully verified! You can now log in.', 'success')
    else:
        flash('Invalid or expired verification link.', 'error')
    cursor.close()
    return redirect(url_for('login'))

def send_verification_email(email: str, token: str):
    verification_link = url_for('verify_email', token=token, _external=True)
    msg = MIMEText(f'Please click the following link to verify your email: {verification_link}')
    msg['Subject'] = 'Verify your Smart Lab account'
    msg['From'] = app.config['MAIL_USERNAME']
    msg['To'] = email

    try:
        with smtplib.SMTP(str(app.config['MAIL_SERVER']), int(app.config['MAIL_PORT'])) as server:
            server.starttls()
            server.login(str(app.config['MAIL_USERNAME']), str(app.config['MAIL_PASSWORD']))
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
        cursor = db.cursor()
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if user and check_password_hash(user['password_hash'], password):
            if user['is_verified']:
                session['user_id'] = user['id']
                flash('Logged in successfully!', 'success')
                cursor.close()
                return redirect(url_for('dashboard'))
            else:
                flash('Please verify your email before logging in.', 'warning')
        else:
            flash('Invalid email or password.', 'error')
        cursor.close()

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

# --- Dashboard and Ad System ---

@app.route('/dashboard')
def dashboard():
    import logging
    try:
        # تحقق من متغيرات البيئة المهمة
        missing_envs = []
        for env_var in ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']:
            if not os.environ.get(env_var):
                missing_envs.append(env_var)
        if missing_envs:
            logging.error(f"Missing environment variables: {missing_envs}")

        if not g.user:
            logging.error("g.user is None (user not logged in)")
            return redirect(url_for('login'))

        db = get_db()
        user_id = g.user.get('id')
        user_balance = g.user.get('balance', 0)
        if user_id is None:
            logging.error(f"user_id is None: user_id={user_id}")
            return render_template('dashboard.html', balance=0, error="User info missing. Please log in again.")

        today = datetime.now().strftime('%Y-%m-%d')
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(
            'SELECT ad_type, COUNT(*) AS count FROM ad_clicks WHERE user_id = %s AND date = %s GROUP BY ad_type',
            (user_id, today)
        )
        ad_clicks_today = cursor.fetchall()

        clicks_ad1 = 0
        clicks_ad2 = 0
        for click in ad_clicks_today:
            if click.get('ad_type') == 'popunder1':
                clicks_ad1 = click.get('count', 0)
            elif click.get('ad_type') == 'popunder2':
                clicks_ad2 = click.get('count', 0)

        total_clicks_today = clicks_ad1 + clicks_ad2

        referral_link = url_for('signup', ref=user_id, _external=True)
        cursor.close()

        return render_template(
            'dashboard.html',
            balance=user_balance,
            clicks_ad1=clicks_ad1,
            clicks_ad2=clicks_ad2,
            total_clicks_today=total_clicks_today,
            referral_link=referral_link,
            ad_limit_per_button=25,
            ad_total_limit=50,
            error=None
        )
    except Exception as e:
        logging.error(f"Exception in /dashboard: {e}", exc_info=True)
        return render_template('dashboard.html', balance=0, error=f"Internal error: {str(e)}")

# --- Withdrawal Route ---
@app.route('/withdraw', methods=['GET', 'POST'])
def withdraw():
    if not g.user:
        return redirect(url_for('login'))
    db = get_db()
    if request.method == 'POST':
        amount_str = request.form.get('amount')
        try:
            amount = float(amount_str)
        except (ValueError, TypeError):
            flash('Invalid amount. Please enter a number.', 'error')
            return render_template('withdraw.html', balance=g.user.get('balance', 0))

        if amount < 0.5:
            flash('Minimum withdrawal amount is 0.5 USD.', 'error')
            return render_template('withdraw.html', balance=g.user.get('balance', 0))

        if g.user.get('balance', 0) < amount:
            flash('Insufficient balance.', 'error')
            return render_template('withdraw.html', balance=g.user.get('balance', 0))

        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute('UPDATE users SET balance = balance - %s WHERE id = %s', (amount, g.user['id']))
            # Handle referral commission
            if g.user.get('referrer_id'):
                referrer_id = g.user['referrer_id']
                commission_amount = amount * 0.05 # 5% commission
                cursor.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (commission_amount, referrer_id))
                flash(f'Referrer (ID: {referrer_id}) received {commission_amount:.3f} USD commission.', 'info')
            db.commit()
            send_withdrawal_notification(g.user['id'], g.user['email'], amount)
            flash(f'Withdrawal of {amount:.2f} USD successful! An admin will process your request.', 'success')
            cursor.close()
            return redirect(url_for('dashboard'))
        except Exception as e:
            db.rollback()
            flash(f'An error occurred during withdrawal: {e}', 'error')
            cursor.close()
    # GET request
    return render_template('withdraw.html', balance=g.user.get('balance', 0))

def send_withdrawal_notification(user_id: int, user_email: str, amount: float):
    msg = MIMEText(f'User ID: {user_id}\nEmail: {user_email}\nAmount: {amount:.2f} USD')
    msg['Subject'] = 'New Withdrawal Request - Smart Lab'
    msg['From'] = app.config['MAIL_USERNAME']
    msg['To'] = ADMIN_EMAIL

    try:
        with smtplib.SMTP(str(app.config['MAIL_SERVER']), int(app.config['MAIL_PORT'])) as server:
            server.starttls()
            server.login(str(app.config['MAIL_USERNAME']), str(app.config['MAIL_PASSWORD']))
            server.send_message(msg)
    except Exception as e:
        print(f"Error sending withdrawal notification email: {e}")
        # Log this error, but don't prevent the withdrawal from completing

@app.route('/api/hello')
def hello():
    return jsonify({"message": "Hello from Flask API!"})