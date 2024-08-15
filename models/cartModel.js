// models/cartModel.js
const mongoose = require('mongoose');
const { encryptText, decryptText } = require('../middleware/encryption');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: String, // Store encrypted product ID as a string
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [cartItemSchema]
});

// Encrypt product ID before saving
cartSchema.pre('save', function(next) {
    if (this.isModified('items')) {
        this.items.forEach(item => {
            if (item.product) {
                item.product = encryptText(item.product.toString());
            }
        });
    }
    next();
});

// Decrypt product ID after fetching
cartSchema.post('findOne', function(doc) {
    if (doc) {
        doc.items.forEach(item => {
            if (item.product) {
                item.product = decryptText(item.product);
            }
        });
    }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
