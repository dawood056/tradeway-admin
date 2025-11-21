import { Router } from 'express';
import Order from '../models/Order.js';
import { analyzeTimeSeries, generatePredictions } from '../utils/timeSeriesAnalysis.js';

const router = Router();

/** GET /api/admin/forecast?target=price|demand&category=&h=3 */
router.get('/forecast', async (req, res) => {
  const { target = 'price', category, h = '3' } = req.query;
  const horizon = Math.max(1, parseInt(h, 10));

  const pipeline = [
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
    { $unwind: '$p' },
    ...(category ? [{ $match: { 'p.category': category } }] : []),
    { $group: {
      _id: { $dateTrunc: { date: '$createdAt', unit: 'day' } }, // Daily data points
      avgPrice: { $avg: '$unitPrice' },
      demand: { $sum: 1 },
      totalVolume: { $sum: '$quantity' }
    }},
    { $sort: { _id: 1 } }
  ];
  const rows = await Order.aggregate(pipeline);

  if (rows.length < 2) {
    return res.json({ 
      ok: true, 
      target, 
      historicalData: [],
      predictions: [],
      confidence: 0 
    });
  }

  const dates = rows.map(r => r._id);
  const values = rows.map(r => {
    if (target === 'price') return r.avgPrice;
    if (target === 'demand') return r.totalVolume;
    return 0;
  });

  // Analyze time series
  const analysis = analyzeTimeSeries(values);
  if (!analysis) {
    return res.json({ 
      ok: true, 
      target,
      historicalData: [],
      predictions: [],
      confidence: 0 
    });
  }

  // Generate predictions
  const predictions = generatePredictions(analysis, horizon);
  
  // Calculate confidence based on volatility
  const confidence = Math.max(0, Math.min(100, 100 * (1 - analysis.volatility)));

  // Format response with historical data and predictions
  const historicalData = rows.map((r, i) => ({
    date: r._id,
    value: values[i],
    ma: analysis.trend[i]
  }));

  // Generate future dates for predictions
  const lastDate = dates[dates.length - 1];
  const predictionDates = Array.from({ length: horizon }).map((_, i) => {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const formattedPredictions = predictions.map((value, i) => ({
    date: predictionDates[i],
    value: Number(value.toFixed(2))
  }));

  res.json({
    ok: true,
    target,
    historicalData,
    predictions: formattedPredictions,
    confidence
  });
});

export default router;
