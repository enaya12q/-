import os
from flask import Flask, jsonify
from supabase import create_client, Client

app = Flask(__name__)

# قراءة متغيرات البيئة
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
POSTGRES_URL = os.environ.get('POSTGRES_URL', '')
POSTGRES_PRISMA_URL = os.environ.get('POSTGRES_PRISMA_URL', '')

# تهيئة اتصال Supabase باستخدام service role key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def mask_url(url):
    if not url:
        return ''
    # إخفاء كلمة السر من رابط postgres
    if 'postgres://' in url:
        parts = url.split('@')
        if len(parts) == 2:
            userinfo, hostinfo = parts
            userinfo = userinfo.split('//')[-1]
            userinfo_masked = userinfo.split(':')[0] + ':*****'
            return f"postgres://{userinfo_masked}@{hostinfo}"
    # تقصير الروابط الطويلة
    if len(url) > 40:
        return url[:20] + '...' + url[-10:]
    return url

@app.route('/')
def show_env():
    env_vars = {
        "SUPABASE_URL": mask_url(SUPABASE_URL),
        "SUPABASE_ANON_KEY": mask_url(SUPABASE_ANON_KEY),
        "SUPABASE_SERVICE_ROLE_KEY": mask_url(SUPABASE_SERVICE_ROLE_KEY),
        "POSTGRES_URL": mask_url(POSTGRES_URL),
        "POSTGRES_PRISMA_URL": mask_url(POSTGRES_PRISMA_URL)
    }
    return jsonify(env_vars)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
