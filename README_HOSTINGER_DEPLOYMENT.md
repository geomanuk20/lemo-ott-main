# 🚀 LEMO OTT - Hostinger VPS Deployment & Scalability Guide

ഈ ഗൈഡിൽ **LEMO OTT** Backend Server (Node.js PM2 Cluster + Nginx Load Balancer + Redis Cache + Background Worker + MongoDB Atlas) **Hostinger VPS**-ലേക്ക് ഇംപ്ലിമെന്റ് ചെയ്ത് പബ്ലിഷ് ചെയ്യാനുള്ള എല്ലാ വിവരങ്ങളും അടങ്ങിയിരിക്കുന്നു.

---

## 🛠️ Requirements & Hostinger Specifications

- **Server Type**: Hostinger VPS (KVM 1 / KVM 2 / KVM 4 or higher)
- **OS**: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS
- **Access**: SSH Root Access

---

## ⚡ Quick 1-Command Automated Deployment

Hostinger VPS Terminal തുറന്ന് ഒറ്റ Command-ൽ Deployment പൂർത്തിയാക്കാം:

```bash
# 1. Hostinger VPS-ലേക്ക് Connect ചെയ്യുക
ssh root@YOUR_HOSTINGER_VPS_IP

# 2. Repository Clone ചെയ്യുക
cd /var/www
git clone https://github.com/YOUR_GITHUB_USERNAME/lemo-ott.git lemo-app
cd lemo-app

# 3. Auto-Deployment Script റൺ ചെയ്യുക
sudo bash deploy_hostinger.sh
```

---

## 📋 Manual Step-by-Step Instructions

സെറ്റപ്പ് ഘട്ടം ഘട്ടമായി നടപ്പിലാക്കാൻ താഴെ നൽകിയിരിക്കുന്ന ക്രമം പിന്തുടരുക:

### Step 1: Production `.env` ഫയൽ സെറ്റ് ചെയ്യുക

```bash
cd /var/www/lemo-app/server
cp .env.production.example .env
nano .env
```
*നിങ്ങളുടെ MongoDB Atlas URI (`mongodb+srv://...`), JWT Secrets, SMTP Mailer വിവരങ്ങൾ നൽകുക. (Ctrl+O, Enter, Ctrl+X)*

### Step 2: DB Indexes Generate ചെയ്യുക

```bash
node ensure_indexes.js
```

### Step 3: PM2 Cluster Launch ചെയ്യുക

```bash
cd /var/www/lemo-app
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

ഇത് 4 API Nodes (`lemo-api-node-1` to `4` on ports 5001-5004) ഉം 1 Background Worker പ്രോസസും റൺ ചെയ്യും.

### Step 4: Free SSL Certificate (HTTPS) Active ആക്കുക

നിങ്ങളുടെ Domain Hostinger VPS IP-ലേക്ക് Point ചെയ്ത ശേഷം:

```bash
sudo certbot --nginx -d lemoott.com -d www.lemoott.com
```

---

## 📊 Useful Server Management Commands

| Action | Command |
| :--- | :--- |
| **Check Backend Status** | `pm2 status` |
| **View Realtime Logs** | `pm2 logs` |
| **Restart Backend** | `pm2 reload all` |
| **Test Nginx LB** | `sudo nginx -t` |
| **Restart Nginx** | `sudo systemctl restart nginx` |
| **Check Redis Cache** | `redis-cli ping` (Returns `PONG`) |
| **Test Health Check** | `curl http://127.0.0.1:5001/health` |

---

## 🏗️ Enterprise Architecture Breakdown

```
                            [ User Mobile & Web Apps ]
                                        │
                                        ▼
                             [ Hostinger Nginx LB ]
                                   (Port 80/443)
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
    [ Node API Node 1 ]        [ Node API Node 2 ]        [ Node API Node 4 ]
        (Port 5001)                (Port 5002)                (Port 5004)
             │                          │                          │
             └──────────────────────────┴──────────────────────────┘
                                        │
                   ┌────────────────────┴────────────────────┐
                   ▼                                         ▼
           [ Redis Cache ]                         [ BullMQ Queue System ]
         (In-Memory Cache)                                   │
                                                             ▼
                                                 [ Background Worker Process ]
                                                  - Email Delivery
                                                  - Subscription Expiry Sync
                                                  - Media Transcoding
```
