import { Router } from 'express';
import DriverVerification from '../models/DriverVerification.js';
import User from '../models/User.js';

const router = Router();

router.get('/driver-verifications', async (req, res) => {
  const { status = 'pending' } = req.query;
  const match = {};
  if (status && status !== 'all') {
    match.status = status;
  }

  const [items, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    DriverVerification.find(match)
      .sort({ createdAt: -1 })
      .populate('driverId', 'fullName email role driverVerificationStatus')
      .populate('reviewedBy', 'fullName email role'),
    DriverVerification.countDocuments({ status: 'pending' }),
    DriverVerification.countDocuments({ status: 'approved' }),
    DriverVerification.countDocuments({ status: 'rejected' })
  ]);

  res.json({
    ok: true,
    items,
    counts: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    }
  });
});

async function updateUserStatus(driverVerification, status) {
  if (!driverVerification?.driverId) return;
  await User.findByIdAndUpdate(driverVerification.driverId, {
    driverVerificationStatus: status
  });
}

router.post('/driver-verifications/:id/approve', async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'admin_only' });
  }

  const verification = await DriverVerification.findById(req.params.id);
  if (!verification) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }

  if (verification.status === 'approved') {
    return res.status(400).json({ ok: false, error: 'already_approved' });
  }

  verification.status = 'approved';
  verification.reviewedAt = new Date();
  verification.reviewedBy = req.user._id;
  verification.rejectionReason = undefined;
  await verification.save();
  await updateUserStatus(verification, 'approved');

  res.json({ ok: true, item: verification });
});

router.post('/driver-verifications/:id/reject', async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'admin_only' });
  }

  const { reason } = req.body || {};
  const verification = await DriverVerification.findById(req.params.id);
  if (!verification) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }

  if (verification.status === 'rejected') {
    return res.status(400).json({ ok: false, error: 'already_rejected' });
  }

  verification.status = 'rejected';
  verification.reviewedAt = new Date();
  verification.reviewedBy = req.user._id;
  verification.rejectionReason = reason || 'Rejected by administrator';
  await verification.save();
  await updateUserStatus(verification, 'rejected');

  res.json({ ok: true, item: verification });
});

export default router;
