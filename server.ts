import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // 1. Festive Offer Broadcast (Meta Cloud API)
  app.post('/api/broadcast-offer', async (req, res) => {
    const { message, phoneNumbers } = req.body;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      return res.status(500).json({ error: 'Meta API keys not configured. Please add META_ACCESS_TOKEN and META_PHONE_NUMBER_ID to secrets.' });
    }

    if (!message || !phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
      const results = await Promise.all(phoneNumbers.map(async (phone) => {
        try {
          // Clean phone number (remove non-digits, ensure country code)
          const cleanPhone = phone.replace(/\D/g, '');
          const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

          // Meta Cloud API call
          await axios.post(
            `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to: finalPhone,
              type: "text",
              text: { body: message }
            },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return { phone, status: 'sent' };
        } catch (err: any) {
          console.error(`Failed to send to ${phone}:`, err.response?.data || err.message);
          return { phone, status: 'failed', error: err.response?.data?.error?.message || err.message };
        }
      }));

      res.json({ success: true, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Wallet Expiry Reminder (Cron Job placeholder)
  // This can be expanded when automation is restored in the future
  cron.schedule('0 10 * * *', async () => {
    console.log('Daily cron check active (automation currently disabled by user request)');
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
