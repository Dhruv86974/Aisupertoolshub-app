import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Ensure __dirname works in both ES modules and CommonJS
let __filename = '';
let __dirname = '';
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  // CommonJS fallback (already exists globally in CJS)
  __filename = (globalThis as any).__filename || __filename;
  __dirname = (globalThis as any).__dirname || __dirname;
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Set up JSON body parsing with large limit for OCR uploads
app.use(express.json({ limit: '15mb' }));

// ================= USER DATABASE HELPER =================
const USERS_FILE = path.join(process.cwd(), 'users_db.json');

interface UserRecord {
  id: string;
  email: string;
  name: string;
  username: string;
  passwordHash: string;
  tier: string;
  credits: number;
  college?: string;
  semester?: string;
}

function loadUsers(): UserRecord[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.users || [];
  } catch (e) {
    console.error('Error loading users DB:', e);
    return [];
  }
}

function saveUsers(users: UserRecord[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving users DB:', e);
  }
}

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Lazy initializer for Gemini Client
let geminiClient: GoogleGenAI | null = null;

function getGemini() {
  if (!geminiClient) {
    let apiKey = process.env.GEMINI_API_KEY;
    
    // Check for missing, undefined, null, or placeholder API keys
    const isInvalid = !apiKey || 
                      apiKey.trim() === '' || 
                      apiKey.trim() === 'undefined' || 
                      apiKey.trim() === 'null' || 
                      apiKey.trim().toLowerCase().includes('placeholder');
                      
    if (isInvalid) {
      throw new Error(
        'તમારી લાઈવ વેબસાઇટ પર GEMINI_API_KEY સેટ નથી અથવા અમાન્ય છે! કૃપા કરીને તમારા ક્લાઉડ રન (Cloud Run) ના Environment Variables માં GEMINI_API_KEY ઉમેરો અને તેમાં સાચો Gemini API Key પેસ્ટ કરો. / GEMINI_API_KEY is missing or invalid on your production server! Please add GEMINI_API_KEY to your Cloud Run environment variables.'
      );
    }
    
    // Sanitize API key (trim whitespace and remove leading/trailing double or single quotes)
    apiKey = apiKey.trim().replace(/^["']|["']$/g, '').trim();

    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// ================= API ENDPOINTS =================

// User Sign-up route
app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    if (!email || !password || !name || !username) {
      return res.status(400).json({ error: 'All fields are required (email, password, name, username)' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const users = loadUsers();

    // Check if user already exists
    const existingUser = users.find(u => u.email === normalizedEmail || u.username === normalizedUsername);
    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Create new user
    const newUser: UserRecord = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: normalizedEmail,
      name: name.trim(),
      username: normalizedUsername,
      passwordHash: hashPassword(password),
      tier: 'free',
      credits: 30
    };

    users.push(newUser);
    saveUsers(users);

    // Return sanitized user object
    const { passwordHash, ...sanitizedUser } = newUser;
    res.status(201).json({ success: true, user: sanitizedUser });
  } catch (error: any) {
    console.error('Auth signup error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// User Login route
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const users = loadUsers();

    const user = users.find(u => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const inputHash = hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const { passwordHash, ...sanitizedUser } = user;
    res.json({ success: true, user: sanitizedUser });
  } catch (error: any) {
    console.error('Auth login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Social Login / Autoregistration route
app.post('/api/auth/social', (req, res) => {
  try {
    const { email, name, username, provider } = req.body;
    if (!email || !name || !username || !provider) {
      return res.status(400).json({ error: 'All fields are required (email, name, username, provider)' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();
    const users = loadUsers();

    // Check if user already exists
    let user = users.find(u => u.email === normalizedEmail);
    if (!user) {
      // Create new user automatically
      user = {
        id: `usr-social-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: normalizedEmail,
        name: name.trim(),
        username: normalizedUsername,
        passwordHash: 'social-authenticated',
        tier: 'free',
        credits: 30
      };
      users.push(user);
      saveUsers(users);
    }

    const { passwordHash, ...sanitizedUser } = user;
    res.json({ success: true, user: sanitizedUser });
  } catch (error: any) {
    console.error('Auth social login error:', error);
    res.status(500).json({ error: 'Internal server error during social authentication' });
  }
});

// ================= GOOGLE OAUTH & SSO SIMULATOR =================

app.get('/api/auth/google/login', (req, res) => {
  const redirectUri = process.env.APP_URL 
    ? `${process.env.APP_URL}/api/auth/google/callback` 
    : `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  // If real Google client is configured, redirect to real Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    }).toString();
    return res.redirect(googleAuthUrl);
  }

  // Otherwise, serve our gorgeous custom high-fidelity OAuth Consent Simulator
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in - Google Accounts</title>
      <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        body { font-family: 'Roboto', sans-serif; }
      </style>
    </head>
    <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
      <div class="bg-white w-full max-w-md rounded-lg border border-gray-200 shadow-sm p-8 text-center relative overflow-hidden">
        
        <!-- Google Multi-color Bar -->
        <div class="absolute top-0 left-0 right-0 h-1 flex">
          <div class="bg-blue-500 flex-1"></div>
          <div class="bg-red-500 flex-1"></div>
          <div class="bg-yellow-500 flex-1"></div>
          <div class="bg-green-500 flex-1"></div>
        </div>

        <!-- Google Logo -->
        <div class="flex justify-center mb-5">
          <svg class="w-10 h-10" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </div>

        <h1 class="text-xl font-normal text-gray-900 mb-1">Choose an account</h1>
        <p class="text-sm text-gray-500 mb-6">to continue to <strong class="text-gray-700">AI Super Tools Hub</strong></p>

        <!-- Account List -->
        <div class="space-y-2 text-left" id="accountList">
          <!-- Account 1 -->
          <button onclick="selectAccount('dhruvtarsariya3@gmail.com', 'Dhruv Tarsariya')" class="w-full flex items-center justify-between p-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                DT
              </div>
              <div>
                <p class="text-sm font-medium text-gray-800">Dhruv Tarsariya</p>
                <p class="text-xs text-gray-500">dhruvtarsariya3@gmail.com</p>
              </div>
            </div>
            <span class="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Logged in</span>
          </button>

          <!-- Account 2 -->
          <button onclick="selectAccount('aarav@gmail.com', 'Aarav Shah')" class="w-full flex items-center p-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                AS
              </div>
              <div>
                <p class="text-sm font-medium text-gray-800">Aarav Shah</p>
                <p class="text-xs text-gray-500">aarav@gmail.com</p>
              </div>
            </div>
          </button>

          <!-- Use another account action -->
          <button onclick="toggleForm()" class="w-full flex items-center gap-3 p-3.5 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 transition cursor-pointer">
            <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </div>
            <p class="text-sm font-medium text-gray-600">Use another Google account</p>
          </button>
        </div>

        <!-- Custom Account Form -->
        <form id="customForm" action="/api/auth/google/mock-submit" method="POST" class="hidden text-left space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Your Full Name</label>
            <input type="text" name="name" required placeholder="e.g. Dhruv Tarsariya" class="w-full text-sm px-3.5 py-2.5 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Google Email Address</label>
            <input type="email" name="email" required placeholder="username@gmail.com" class="w-full text-sm px-3.5 py-2.5 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" onclick="toggleForm()" class="flex-1 py-2 rounded border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer">Back</button>
            <button type="submit" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium shadow-sm cursor-pointer">Sign in</button>
          </div>
        </form>

        <p class="text-xs text-gray-400 mt-6 leading-relaxed">
          To continue, Google will share your name, email address, language preference, and profile picture with AI Super Tools Hub. Review our <span class="text-blue-500 hover:underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>

      <form id="directSubmitForm" action="/api/auth/google/mock-submit" method="POST" class="hidden">
        <input type="hidden" name="name" id="directName">
        <input type="hidden" name="email" id="directEmail">
      </form>

      <script>
        function selectAccount(email, name) {
          document.getElementById('directName').value = name;
          document.getElementById('directEmail').value = email;
          document.getElementById('directSubmitForm').submit();
        }
        function toggleForm() {
          const list = document.getElementById('accountList');
          const form = document.getElementById('customForm');
          list.classList.toggle('hidden');
          form.classList.toggle('hidden');
        }
      </script>
    </body>
    </html>
  `);
});

app.post('/api/auth/google/mock-submit', express.urlencoded({ extended: true }), (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).send('Email and name are required');
    }

    const emailStr = (email as string).toLowerCase().trim();
    const nameStr = (name as string).trim();
    const username = emailStr.split('@')[0] + Math.floor(Math.random() * 100);

    const users = loadUsers();
    let user = users.find(u => u.email === emailStr);
    if (!user) {
      user = {
        id: `usr-google-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: emailStr,
        name: nameStr,
        username: username.toLowerCase(),
        passwordHash: 'google-mock-authenticated',
        tier: 'free',
        credits: 30
      };
      users.push(user);
      saveUsers(users);
    }

    const { passwordHash, ...sanitizedUser } = user;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(sanitizedUser)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
            <p style="font-size: 18px; font-weight: bold; color: #10B981;">Authentication Successful!</p>
            <p style="color: #6B7280;">You can close this window now.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google mock auth error:', error);
    res.status(500).send('Internal Server Error during Mock Authentication');
  }
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.send(`
      <html>
        <body>
          <script>
            alert("Authorization code was not provided by Google.");
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.APP_URL ? `${process.env.APP_URL}/api/auth/google/callback` : `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errText}`);
    }

    const tokens = await tokenResponse.json() as any;
    
    // Get user profile info
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Google user profile info.');
    }

    const profile = await profileResponse.json() as any;
    const email = profile.email;
    const name = profile.name || profile.given_name || 'Google User';
    const username = email.split('@')[0] + Math.floor(Math.random() * 100);

    const users = loadUsers();
    let user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
      user = {
        id: `usr-google-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: email.toLowerCase(),
        name: name,
        username: username.toLowerCase(),
        passwordHash: 'google-oauth-authenticated',
        tier: 'free',
        credits: 30
      };
      users.push(user);
      saveUsers(users);
    }

    const { passwordHash, ...sanitizedUser } = user;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(sanitizedUser)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
            <p style="font-size: 18px; font-weight: bold; color: #10B981;">Authentication Successful!</p>
            <p style="color: #6B7280;">You can close this window now.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.send(`
      <html>
        <body>
          <script>
            alert("Google Authentication failed: ${error.message}");
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});


// ================= FACEBOOK OAUTH & SSO SIMULATOR =================

app.get('/api/auth/facebook/login', (req, res) => {
  const redirectUri = process.env.APP_URL 
    ? `${process.env.APP_URL}/api/auth/facebook/callback` 
    : `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;

  // If real Facebook client is configured, redirect to real Facebook OAuth
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` + new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'email,public_profile',
      response_type: 'code'
    }).toString();
    return res.redirect(facebookAuthUrl);
  }

  // Otherwise, serve our gorgeous custom high-fidelity Facebook Consent Simulator
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Log in with Facebook</title>
      <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    </head>
    <body class="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div class="bg-white w-full max-w-md rounded-xl shadow-lg border border-gray-200 overflow-hidden text-center">
        
        <!-- Facebook Header -->
        <div class="bg-[#1877F2] p-5 text-white flex items-center gap-3">
          <svg class="w-8 h-8 fill-white" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <div class="text-left">
            <h4 class="text-sm font-bold tracking-tight">Facebook Secure Login</h4>
            <p class="text-[10px] opacity-80">Continue to AI Super Tools Hub</p>
          </div>
        </div>

        <div class="p-8">
          <h2 class="text-lg font-bold text-gray-800 text-left mb-2">Log in with Facebook</h2>
          <p class="text-xs text-gray-500 text-left mb-6 leading-relaxed">
            AI Super Tools Hub will receive your public profile name, email, and avatar picture. This does not let the app post to Facebook.
          </p>

          <!-- Account Choice -->
          <div class="space-y-3 text-left" id="accountList">
            <button onclick="selectAccount('dhruvtarsariya3@gmail.com', 'Dhruv Tarsariya')" class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-extrabold text-sm">
                  DT
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-800">Dhruv Tarsariya</p>
                  <p class="text-xs text-gray-400">dhruvtarsariya3@gmail.com</p>
                </div>
              </div>
              <span class="text-xs font-bold text-[#1877F2]">Continue</span>
            </button>

            <button onclick="toggleForm()" class="w-full text-center py-2.5 text-xs font-bold text-[#1877F2] hover:underline cursor-pointer">
              Log in with another Facebook account
            </button>
          </div>

          <!-- Custom Account Form -->
          <form id="customForm" action="/api/auth/facebook/mock-submit" method="POST" class="hidden text-left space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Name</label>
              <input type="text" name="name" required placeholder="e.g. Dhruv Tarsariya" class="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#1877F2] transition">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Facebook Email or Phone</label>
              <input type="email" name="email" required placeholder="username@facebook-id.com" class="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#1877F2] transition">
            </div>
            <div class="flex gap-2 pt-2">
              <button type="button" onclick="toggleForm()" class="flex-1 py-2.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer">Back</button>
              <button type="submit" class="flex-1 py-2.5 bg-[#1877F2] hover:bg-[#1565C0] text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer">Log In</button>
            </div>
          </form>

          <div class="mt-8 border-t border-gray-150 pt-4 flex justify-between items-center text-[11px] text-gray-400">
            <span>App Version 2.15</span>
            <span class="text-[#1877F2] font-semibold hover:underline cursor-pointer" onclick="window.close()">Cancel authorization</span>
          </div>
        </div>
      </div>

      <form id="directSubmitForm" action="/api/auth/facebook/mock-submit" method="POST" class="hidden">
        <input type="hidden" name="name" id="directName">
        <input type="hidden" name="email" id="directEmail">
      </form>

      <script>
        function selectAccount(email, name) {
          document.getElementById('directName').value = name;
          document.getElementById('directEmail').value = email;
          document.getElementById('directSubmitForm').submit();
        }
        function toggleForm() {
          const list = document.getElementById('accountList');
          const form = document.getElementById('customForm');
          list.classList.toggle('hidden');
          form.classList.toggle('hidden');
        }
      </script>
    </body>
    </html>
  `);
});

app.post('/api/auth/facebook/mock-submit', express.urlencoded({ extended: true }), (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).send('Email and name are required');
    }

    const emailStr = (email as string).toLowerCase().trim();
    const nameStr = (name as string).trim();
    const username = emailStr.split('@')[0] + Math.floor(Math.random() * 100);

    const users = loadUsers();
    let user = users.find(u => u.email === emailStr);
    if (!user) {
      user = {
        id: `usr-facebook-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: emailStr,
        name: nameStr,
        username: username.toLowerCase(),
        passwordHash: 'facebook-mock-authenticated',
        tier: 'free',
        credits: 30
      };
      users.push(user);
      saveUsers(users);
    }

    const { passwordHash, ...sanitizedUser } = user;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(sanitizedUser)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
            <p style="font-size: 18px; font-weight: bold; color: #10B981;">Authentication Successful!</p>
            <p style="color: #6B7280;">You can close this window now.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Facebook mock auth error:', error);
    res.status(500).send('Internal Server Error during Mock Authentication');
  }
});

app.get('/api/auth/facebook/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.send(`
      <html>
        <body>
          <script>
            alert("Authorization code was not provided by Facebook.");
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  try {
    const redirectUri = process.env.APP_URL 
      ? `${process.env.APP_URL}/api/auth/facebook/callback` 
      : `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code: code as string
    }).toString();

    const fetchToken = await fetch(tokenUrl);
    if (!fetchToken.ok) {
      const errText = await fetchToken.text();
      throw new Error(`Token exchange failed: ${errText}`);
    }

    const tokens = await fetchToken.json() as any;

    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${tokens.access_token}`;
    const fetchProfile = await fetch(profileUrl);
    if (!fetchProfile.ok) {
      throw new Error('Failed to fetch Facebook user profile.');
    }

    const profile = await fetchProfile.json() as any;
    const email = profile.email || `${profile.id}@facebook.com`;
    const name = profile.name || 'Facebook User';
    const username = (profile.email ? profile.email.split('@')[0] : `fb_${profile.id}`) + Math.floor(Math.random() * 100);

    const users = loadUsers();
    let user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
      user = {
        id: `usr-facebook-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: email.toLowerCase(),
        name: name,
        username: username.toLowerCase(),
        passwordHash: 'facebook-oauth-authenticated',
        tier: 'free',
        credits: 30
      };
      users.push(user);
      saveUsers(users);
    }

    const { passwordHash, ...sanitizedUser } = user;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(sanitizedUser)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
            <p style="font-size: 18px; font-weight: bold; color: #10B981;">Authentication Successful!</p>
            <p style="color: #6B7280;">You can close this window now.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Facebook OAuth callback error:', error);
    res.send(`
      <html>
        <body>
          <script>
            alert("Facebook Authentication failed: ${error.message}");
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});

// Update Profile route
app.post('/api/auth/update-profile', (req, res) => {
  try {
    const { userId, name, username, college, semester } = req.body;
    if (!userId || !name || !username) {
      return res.status(400).json({ error: 'User ID, name, and username are required' });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const users = loadUsers();

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new username is already taken by someone else
    const duplicateUser = users.find(u => u.id !== userId && u.username === normalizedUsername);
    if (duplicateUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Update details
    users[userIndex].name = name.trim();
    users[userIndex].username = normalizedUsername;
    if (college !== undefined) {
      users[userIndex].college = college.trim();
    }
    if (semester !== undefined) {
      users[userIndex].semester = semester.trim();
    }
    saveUsers(users);

    const { passwordHash, ...sanitizedUser } = users[userIndex];
    res.json({ success: true, user: sanitizedUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error during profile update' });
  }
});

// Change Password route
app.post('/api/auth/change-password', (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const currentHash = hashPassword(currentPassword);
    if (users[userIndex].passwordHash !== currentHash) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    users[userIndex].passwordHash = hashPassword(newPassword);
    saveUsers(users);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error during password update' });
  }
});

// ================= RATE LIMITING MIDDLEWARE =================
const rateLimits = new Map<string, { count: number; resetTime: number }>();

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20; // 20 requests per minute

  const limitData = rateLimits.get(ip);

  if (!limitData || now > limitData.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (limitData.count >= maxRequests) {
    return res.status(429).json({
      error: 'Rate Limit Reached',
      message: 'તમે ખૂબ જ ઝડપથી રિક્વેસ્ટ કરી રહ્યા છો. કૃપા કરીને થોડી સેકન્ડો રાહ જુઓ. / You are sending requests too fast. Please wait a few seconds and try again.',
      resetTime: limitData.resetTime
    });
  }

  limitData.count += 1;
  next();
};

// Apply rate limiting to all AI generation routes
app.use('/api/tools/*', rateLimiter);

// --- HELPER FOR ROBUST MODEL FALLBACK SYSTEM ---
const MODEL_FALLBACKS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash'];

async function runGenerateWithFallback(ai: any, params: { contents: any, config?: any }) {
  let lastError: any = null;
  for (const modelName of MODEL_FALLBACKS) {
    try {
      console.log(`[API] Trying content generation using model: ${modelName}`);
      const response = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      return response;
    } catch (err: any) {
      console.warn(`[API] Fallback warning: model ${modelName} failed. Reason:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('All fallback models returned failures.');
}

async function runGenerateStreamWithFallback(ai: any, params: { contents: any, config?: any }) {
  let lastError: any = null;
  for (const modelName of MODEL_FALLBACKS) {
    try {
      console.log(`[API] Trying streaming generation using model: ${modelName}`);
      const stream = await ai.models.generateContentStream({
        ...params,
        model: modelName,
      });
      return stream;
    } catch (err: any) {
      console.warn(`[API] Fallback stream warning: model ${modelName} failed. Reason:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('All fallback streaming models returned failures.');
}

// Generic Tool Prompt Generation Endpoint
app.post('/api/tools/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGemini();
    const response = await runGenerateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are a highly efficient assistant.',
        temperature: 0.7,
      },
    });

    res.json({ output: response.text });
  } catch (error: any) {
    console.error('Gemini generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate output' });
  }
});

// Streaming Generic Tool Generation Endpoint
app.post('/api/tools/generate-stream', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGemini();
    const responseStream = await runGenerateStreamWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are a highly efficient assistant.',
        temperature: 0.7,
      },
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.end();
  } catch (error: any) {
    console.error('Gemini generate stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failure' })}\n\n`);
    res.end();
  }
});

// Chat Endpoint with Multi-turn history support
app.post('/api/tools/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Convert client-side chat format to Gemini contents structure
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const ai = getGemini();
    const response = await runGenerateWithFallback(ai, {
      contents: contents,
      config: {
        systemInstruction: 'You are an advanced conversational assistant inside the AI Super Tools Hub. Provide clear, visually formatted, engaging, and detailed responses in markdown layout.',
        temperature: 0.7,
      },
    });

    res.json({ output: response.text });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to proceed with conversation' });
  }
});

// Streaming Chat Endpoint with Multi-turn history support
app.post('/api/tools/chat-stream', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const ai = getGemini();
    const responseStream = await runGenerateStreamWithFallback(ai, {
      contents: contents,
      config: {
        systemInstruction: 'You are an advanced conversational assistant inside the AI Super Tools Hub. Provide clear, visually formatted, engaging, and detailed responses in markdown layout.',
        temperature: 0.7,
      },
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.end();
  } catch (error: any) {
    console.error('Gemini chat stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Chat stream failed' })}\n\n`);
    res.end();
  }
});

// High-Fidelity OCR Transcription Endpoint
app.post('/api/tools/ocr', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Prepare image payload for fallback
    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/png',
        data: base64Image,
      },
    };

    const textPart = {
      text: 'Perform high-precision optical character recognition (OCR) on this document or image. Transcribe all text verbatim. Maintain structural layouts, line breaks, tables, and spacing. If there is handwritten text, decipher it carefully. Provide a highly clean, structured output in clear Markdown, starting with a Brief Summary first and then the Full Raw Transcription.',
    };

    const ai = getGemini();
    const response = await runGenerateWithFallback(ai, {
      contents: { parts: [imagePart, textPart] },
    });

    res.json({ output: response.text });
  } catch (error: any) {
    console.error('Gemini OCR error:', error);
    res.status(500).json({ error: error.message || 'OCR transcription failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ================= VITE MIDDLEWARE SETUP =================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
    console.log(`AI Super Tools Hub Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
