import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import http from 'node:http';
import https from 'node:https';
import User from '../src/models/User.js';

const API_BASE_URL = process.env.API_BASE_URL || process.env.MOCK_DRIVER_API || 'http://localhost:5000';

async function ensureDriver({ email, name }) {
  let driver = await User.findOne({ email });
  if (!driver) {
    const passwordHash = await bcrypt.hash('driver123', 10);
    driver = await User.create({
      fullName: name,
      email,
      role: 'driver',
      passwordHash,
      driverVerificationStatus: 'not_required'
    });
  }
  return driver;
}

function callApi(urlString, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const lib = url.protocol === 'https:' ? https : http;

    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (err) {
          // keep raw text
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function submitVerification(sample) {
  const driver = await ensureDriver(sample);
  const token = jwt.sign({ _id: driver._id, role: 'driver', email: driver.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
  const endpoint = `${API_BASE_URL}/api/driver/verifications`;
  const payload = {
    name: sample.name,
    cnic: sample.cnic,
    licenseNumber: sample.licenseNumber,
    licenseImageUrl: sample.licenseImageUrl
  };
  return callApi(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload
  });
}

async function logAdminSnapshot() {
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.warn('No admin user found; skipping admin snapshot.');
    return;
  }
  const token = jwt.sign({ _id: adminUser._id, role: adminUser.role, email: adminUser.email }, process.env.JWT_SECRET, { expiresIn: '30m' });
  try {
    const res = await callApi(`${API_BASE_URL}/api/admin/driver-verifications?status=all`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    const summary = res?.counts || {};
    console.log('Admin snapshot counts:', summary);
    console.log(`Admin can currently see ${res?.items?.length ?? 0} submissions`);
  } catch (err) {
    console.error('Failed to fetch admin snapshot:', err.message);
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const submissions = [
    {
      name: 'Ali Haider',
      email: 'driver.ali@tradeway.com',
      cnic: '35202-1234567-1',
      licenseNumber: 'LHR-928374',
      licenseImageUrl: 'https://images.example.com/licenses/ali-haider.jpg'
    },
    {
      name: 'Sadia Khan',
      email: 'driver.sadia@tradeway.com',
      cnic: '61101-9876543-2',
      licenseNumber: 'ISB-445566',
      licenseImageUrl: 'https://images.example.com/licenses/sadia-khan.jpg'
    },
    {
      name: 'Jawad Sheikh',
      email: 'driver.jawad@tradeway.com',
      cnic: '42301-7654321-9',
      licenseNumber: 'KHI-123987',
      licenseImageUrl: 'https://images.example.com/licenses/jawad-sheikh.jpg'
    }
  ];

  for (const sample of submissions) {
    try {
      const res = await submitVerification(sample);
      console.log(`✔ Submitted for ${sample.name}:`, res?.item?._id || res);
    } catch (err) {
      console.error(`✖ Failed for ${sample.name}:`, err.message);
    }
  }

  await logAdminSnapshot();

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Script failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
