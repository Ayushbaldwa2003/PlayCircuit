# Render Deployment Guide

## Environment Variables Setup

To deploy this app on Render and enable OTP email functionality, you need to set the following environment variables in your Render project:

### Step 1: Go to Render Dashboard
1. Open your Render project
2. Navigate to **Settings** → **Environment**

### Step 2: Add Environment Variables

Add these variables with your Gmail App Password credentials:

| Variable Name | Value |
|---|---|
| `GMAIL_USER` | `ayushbaldwa2003@gmail.com` |
| `GMAIL_PASS` | `nsryicowrznbrcwi` |
| `JWT_SECRET` | `your_jwt_secret_here` (or use default) |
| `MONGO_URI` | Your MongoDB connection string |
| `PORT` | `5500` (optional - Render handles this) |

### Step 3: Important Notes

#### Gmail App Password
- The `GMAIL_PASS` is your **Gmail App Password**, NOT your regular Gmail password
- This is generated in Google Account → Security → App passwords
- Your account must have 2-factor authentication enabled

#### MongoDB Connection
- Update `MONGO_URI` with your actual MongoDB connection string
- The app uses local MongoDB if not provided (dev fallback)

#### .env File
- The `.env` file is in `.gitignore` and is **NOT** deployed to Render
- Environment variables must be set in **Render Dashboard** instead
- Never commit `.env` to Git

### Step 4: Deploy

After setting environment variables:
1. Push your code to GitHub
2. Render will automatically redeploy
3. Check Render logs for any errors

### Step 5: Testing OTP Flow

Once deployed:
1. Go to `/signup`
2. Enter a Gmail address (must be `@gmail.com`)
3. Enter a password with:
   - At least 8 characters
   - 1 uppercase letter
   - 1 lowercase letter
   - 1 number
   - 1 special character (e.g., `Test@123!`)
4. You should receive an OTP email within seconds

### Troubleshooting

#### 502 Bad Gateway
- Check Render logs: **Settings** → **Logs**
- Usually means email sending is failing
- Verify `GMAIL_USER` and `GMAIL_PASS` are set correctly

#### Email Not Received
- Check spam/trash folder
- Verify Gmail credentials are correct
- Make sure Gmail 2FA is enabled for App Passwords to work

#### "OTP expired" Error
- OTP is valid for 5 minutes
- Re-signup or login to get a fresh OTP

### Running Locally

To test locally before deploying:

```bash
# Create .env file with your credentials
GMAIL_USER=ayushbaldwa2003@gmail.com
GMAIL_PASS=nsryicowrznbrcwi
JWT_SECRET=dev_secret
MONGO_URI=mongodb://127.0.0.1:27017/multiplayer-gaming-site
PORT=5500
```

Then:
```bash
npm install
npm start
```

Visit: `http://localhost:5500/signup`

### Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to Git
- Never hardcode credentials in source code for production
- Always use Render environment variables for sensitive data
- Use application-specific Gmail passwords, not your main password
- Rotate credentials periodically

---

**Last Updated:** April 8, 2026
