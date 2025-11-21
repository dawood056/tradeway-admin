import { Router } from 'express';
import IndustryUpdate from '../models/IndustryUpdate.js';

const router = Router();

router.get('/updates', async (req, res) => {
  // If admin or analyst is requesting, show all updates
  const query = req.user?.role === 'admin' || req.user?.role === 'analyst' 
    ? {} 
    : { published: true };
    
  const items = await IndustryUpdate.find(query)
    .sort({ createdAt: -1, publishedAt: -1 })
    .limit(50);
  res.json({ ok: true, items });
});

/** Admin create/edit (optional, can comment out in prod) */
router.post('/updates', async (req, res) => {
  const { _id, ...payload } = req.body || {};
  let doc;
  if (_id) {
    doc = await IndustryUpdate.findByIdAndUpdate(_id, payload, { new: true });
  } else {
    doc = await IndustryUpdate.create(payload);
  }
  res.json({ ok: true, item: doc });
});

router.delete('/updates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only admin/analyst can delete
    if (req.user?.role !== 'admin' && req.user?.role !== 'analyst') {
      return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }

    // Check if update exists
    const update = await IndustryUpdate.findById(id);
    if (!update) {
      return res.status(404).json({ ok: false, error: 'Update not found' });
    }

    // Delete the update
    await IndustryUpdate.findByIdAndDelete(id);
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete industry update:', err);
    res.status(500).json({ ok: false, error: err.message || 'Failed to delete update' });
  }
});

export default router;
