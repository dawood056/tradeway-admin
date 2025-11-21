import { Router } from 'express';
import DriverVerification from '../models/DriverVerification.js';
import User from '../models/User.js';

const router = Router();

router.get('/verifications/me', async (req, res) => {
  const existing = await DriverVerification.findOne({ driverId: req.user._id })
    .sort({ createdAt: -1 });
  res.json({ ok: true, item: existing });
});

router.post('/verifications', async (req, res) => {
  const { name, cnic, licenseNumber, licenseImageUrl } = req.body || {};
  if (!name || !cnic || !licenseNumber) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  let doc = await DriverVerification.findOne({ driverId: req.user._id, status: 'pending' });

  if (doc) {
    doc.name = name;
    doc.cnic = cnic;
    doc.licenseNumber = licenseNumber;
    doc.licenseImageUrl = licenseImageUrl;
    await doc.save();
  } else {
    doc = await DriverVerification.create({
      driverId: req.user._id,
      name,
      cnic,
      licenseNumber,
      licenseImageUrl,
      status: 'pending'
    });
  }

  await User.findByIdAndUpdate(req.user._id, { driverVerificationStatus: 'pending' });

  res.json({ ok: true, item: doc });
});

export default router;
