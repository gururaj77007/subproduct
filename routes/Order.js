const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Order = require('../Mongodb/Order');
const crypto = require('crypto');
require('dotenv').config();
const Fuse = require('fuse.js');

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/create-order', async (req, res) => {
    console.log("createorder")
  const { amount, currency, receipt } = req.body;

  try {
    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise for INR)
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, products, vendorsId,grandTotal,customerDetails } = req.body;
  console.log(customerDetails)

  // Calculate grand total based on products and quantities
 

  // Extracting product details for the Order schema
  
  // Verify the payment signature to ensure the payment is legit
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest === razorpay_signature) {
    // Save the order details in the database
    const newOrder = new Order({
      
      products ,
      customerDetails,
      vendorsId,
      grandTotal,
      transactionDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    });

    try {
      const savedOrder = await newOrder.save();
      res.status(201).json(savedOrder);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save order' });
    }
  } else {
    res.status(400).json({ error: 'Invalid payment signature' });
  }
});
router.post('/orders', async (req, res) => {
  const { userId,page = 1, limit = 10 } = req.body;
  console.log( req.body)

  try {
    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
    };
    const searchCriteria = { 'customerDetails.id': userId };
    const result = await Order.paginate(searchCriteria, options);
    res.json({
      orders: result.docs,
      totalPages: result.totalPages,
      currentPage: result.page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Updated search endpoint
router.post('/search', async (req, res) => {
  const { userId,query, page = 1, limit = 10 } = req.body;
  console.log(userId,query)

  try {
    let orders;
    let totalOrders;

    if (query) {
      // If there's a search query, perform the fuzzy search
      const searchCriteria = { 'customerDetails.id': userId };
    const allOrders = await Order.find(searchCriteria).sort({ createdAt: -1 });
      const options = {
        keys: ['products.productName'],
        threshold: 0.3, // Adjust this threshold for sensitivity
      };
      const fuse = new Fuse(allOrders, options);
      const result = fuse.search(query);

      const expandedResults = result.map(({ item }) => ({
        _id: item._id,
        customerDetails: item.customerDetails,
        products: item.products,
        vendorsId: item.vendorsId,
        transactionDetails: item.transactionDetails,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        grandTotal: item.grandTotal,
      }));

      totalOrders = expandedResults.length;
      orders = expandedResults.slice((page - 1) * limit, page * limit);
    } 

    const totalPages = Math.ceil(totalOrders / limit);

    res.json({ orders, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search orders' });
  }
});
router.get('/order/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});


module.exports = router;
