const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

// Define the Product subdocument schema


// Define the Order schema
const OrderSchema = new Schema({
  customerDetails: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: false },
    gstNumber: { type: String, required: true }
  },
  
  products: { type: [Object], required: true },
  vendorsId: { type: Array, required: true },
  transactionDetails: {
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String, required: true },
    razorpay_signature: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  grandTotal: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
});

// Create a pre-save hook to update the 'updatedAt' field
OrderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});
OrderSchema.plugin(mongoosePaginate);

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
