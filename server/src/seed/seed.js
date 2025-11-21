
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import IndustryUpdate from '../models/IndustryUpdate.js';

dotenv.config();

// Use faker for realistic random data
import { faker } from '@faker-js/faker';

function monthsBack(date, m) {
  return new Date(date.getFullYear(), date.getMonth() - m, faker.number.int({ min: 1, max: 28 }));
}

function randomFrom(arr) {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    IndustryUpdate.deleteMany({})
  ]);

  // Create super admin user
  const adminUsers = [{
    fullName: "Muhammad Dawood",
    email: "dawood.duggal2610@gmail.com",
    role: 'admin',
    passwordHash: await bcrypt.hash('admin123', 10)
  }];
  const analystUsers = [];
  for (let i = 0; i < 10; i++) {
    analystUsers.push({
      fullName: faker.person.fullName(),
      email: `analyst${i}@tradeway.com`,
      role: 'analyst',
      passwordHash: await bcrypt.hash('analyst123', 10)
    });
  }
  const sellerUsers = [];
  for (let i = 0; i < 50; i++) {
    sellerUsers.push({
      fullName: faker.company.name(),
      email: `seller${i}@tradeway.com`,
      role: 'seller'
    });
  }
  const buyerUsers = [];
  for (let i = 0; i < 200; i++) {
    buyerUsers.push({
      fullName: faker.person.fullName(),
      email: `buyer${i}@tradeway.com`,
      role: 'buyer'
    });
  }
  const allUsers = [...adminUsers, ...analystUsers, ...sellerUsers, ...buyerUsers];
  const createdUsers = await User.create(allUsers);

  // Map sellers and buyers
  const sellers = createdUsers.filter(u => u.role === 'seller');
  const buyers = createdUsers.filter(u => u.role === 'buyer');

  // Create products
  const categories = ['Carrara', 'Travertine', 'Emperador', 'Calacatta', 'Onyx', 'Granite'];
  const grades = ['A', 'B', 'C'];
  const types = ['raw', 'processed'];
  const products = [];
  for (let i = 0; i < 100; i++) {
    const seller = randomFrom(sellers);
    products.push({
      sellerId: seller._id,
      title: `${randomFrom(categories)} ${randomFrom(types)} ${faker.word.noun()}`,
      type: randomFrom(types),
      category: randomFrom(categories),
      grade: randomFrom(grades),
      pricePerUnit: faker.number.int({ min: 40, max: 200 })
    });
  }
  const createdProducts = await Product.create(products);

  // Create orders
  const regions = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad'];
  const statuses = ['delivered', 'cancelled', 'placed', 'confirmed'];
  const now = new Date();
  const orders = [];
  for (let i = 0; i < 5000; i++) {
    const prod = randomFrom(createdProducts);
    const seller = sellers.find(s => s._id.equals(prod.sellerId));
    const buyer = randomFrom(buyers);
    const qty = faker.number.int({ min: 5, max: 100 });
    const unitPrice = prod.pricePerUnit + faker.number.int({ min: -10, max: 20 });
    const status = randomFrom(statuses);
    const createdAt = monthsBack(now, faker.number.int({ min: 0, max: 24 }));
    orders.push({
      productId: prod._id,
      buyerId: buyer._id,
      sellerId: seller._id,
      quantity: qty,
      unitPrice,
      status,
      originRegion: randomFrom(regions),
      destinationRegion: randomFrom(regions),
      createdAt,
      updatedAt: createdAt
    });
  }
  await Order.insertMany(orders);

  // Create industry updates
  const updates = [];
  for (let i = 0; i < 50; i++) {
    updates.push({
      title: faker.company.catchPhrase(),
      summary: faker.lorem.sentence(),
      source: faker.company.name(),
      link: faker.internet.url(),
      tags: [randomFrom(['pricing', 'demand', 'innovation', 'market', 'tech', 'export'])],
      publishedAt: monthsBack(now, faker.number.int({ min: 0, max: 24 })),
      published: true
    });
  }
  await IndustryUpdate.insertMany(updates);

  console.log('Large seed complete.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
