#!/usr/bin/env bash
# ============================================================
# One-time server bootstrap for e-commerce backend on Ubuntu
# Run as: bash server-setup.sh
# ============================================================
set -e

echo "==> Installing Node.js 20 via nvm"
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20

echo "==> Installing PM2 globally"
npm install -g pm2

echo "==> Cloning repository"
# Change the URL if you're using SSH key auth instead of HTTPS
git clone https://github.com/Edu-Wire/e-commerce-platform.git ~/e-commerce-platform

echo "==> Installing backend dependencies"
cd ~/e-commerce-platform/backend
npm ci --omit=dev

echo "==> Building TypeScript"
npm run build

echo "==> Setting up .env — EDIT THIS FILE before starting PM2"
if [ ! -f .env ]; then
  cat > .env <<'ENVEOF'
NODE_ENV=production
PORT=4000

# PostgreSQL (Neon or self-hosted)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=7d

# AWS S3 (optional — for image uploads)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# CORS — comma-separated allowed origins
ALLOWED_ORIGINS=http://localhost:5174,https://yourdomain.com
ENVEOF
  echo "==> .env created. Fill in real values before starting the server."
else
  echo "==> .env already exists, skipping."
fi

echo "==> Configuring PM2 to start on boot"
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# PM2 will print a 'sudo env PATH...' command — run it manually.

echo ""
echo "================================================"
echo " Setup complete!"
echo " Next steps:"
echo "   1. Edit ~/e-commerce-platform/backend/.env"
echo "   2. cd ~/e-commerce-platform/backend"
echo "   3. pm2 start ecosystem.config.js --env production"
echo "   4. pm2 save"
echo "================================================"
