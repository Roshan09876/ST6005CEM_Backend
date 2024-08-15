const mongoose = require("mongoose")
const productSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: String,
    },
    image: {
        type: String,
        required: false
    }
}, { timestampe: true })

const Product = mongoose.model("Product", productSchema);
module.exports = Product;