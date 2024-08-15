const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const { encryptText, decryptText } = require('../middleware/encryption');

// Add item to cart
const addToCart = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
        return res.status(400).json({
            success: false,
            message: 'UserId, ProductId, and quantity are required'
        });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Product not found'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist'
            });
        }

        const encryptedProductId = encryptText(productId.toString());
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [{ product: encryptedProductId, quantity }]
            });
        } else {
            const itemIndex = cart.items.findIndex(item => decryptText(item.product) === productId.toString());
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ product: encryptedProductId, quantity });
            }
        }

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cart
        });

    } catch (error) {
        console.error(`Error in add to cart: ${error}`);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

// Get cart items
const getCart = async (req, res) => {
    const userId = req.params.userId;

    try {
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const decryptedItems = cart.items.map(item => ({
            ...item.toObject(),
            product: decryptText(item.product) // Decrypt the product ID
        }));

        res.status(200).json({
            success: true,
            message: 'Cart fetched successfully',
            cart: {
                ...cart.toObject(),
                items: decryptedItems // Use decrypted items
            }
        });

    } catch (error) {
        console.error('Error in fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error
        });
    }
};

const deleteCartItem = async (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({
            success: false,
            message: "UserId and ProductId are required"
        });
    }

    try {
        console.log("Received productId:", productId); // Log received productId

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const decryptedProductId = decryptText(productId);

        if (!decryptedProductId) {
            return res.status(400).json({
                success: false,
                message: "Invalid productId"
            });
        }

        console.log("Decrypted Product ID:", decryptedProductId);

        const itemIndex = cart.items.findIndex(item => {
            const decryptedItemProductId = decryptText(item.product);
            console.log(`Comparing ${decryptedItemProductId} with ${decryptedProductId}`);
            return decryptedItemProductId === decryptedProductId;
        });

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            await cart.save();

            return res.status(200).json({
                success: true,
                message: "Item removed from cart successfully",
                cart
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

    } catch (error) {
        console.error("Error in deleting cart item:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error
        });
    }
};


// Delete item from cart
// const deleteCartItem = async (req, res) => {
//     const { userId, productId } = req.body;

//     if (!userId || !productId) {
//         return res.status(400).json({
//             success: false,
//             message: 'UserId and ProductId are required'
//         });
//     }

//     try {
//         const cart = await Cart.findOne({ user: userId });

//         if (!cart) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Cart not found'
//             });
//         }

//         const decryptedProductId = decryptText(productId);

//         const itemIndex = cart.items.findIndex(item => {
//             const decryptedItemProductId = decryptText(item.product);
//             return decryptedItemProductId === decryptedProductId;
//         });

//         if (itemIndex > -1) {
//             cart.items.splice(itemIndex, 1);
//             await cart.save();

//             return res.status(200).json({
//                 success: true,
//                 message: 'Item removed from cart successfully',
//                 cart
//             });
//         } else {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Item not found in cart'
//             });
//         }

//     } catch (error) {
//         console.error('Error in deleting cart item:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal Server Error',
//             error
//         });
//     }
// };

// Clear all items from the cart
const clearCart = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'UserId is required'
        });
    }

    try {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = []; // Clear all items
        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'All items removed from cart successfully',
            cart
        });

    } catch (error) {
        console.error('Error in clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error
        });
    }
};

// Update quantity of an item in the cart
const updateCartItem = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
        return res.status(400).json({
            success: false,
            message: 'UserId, ProductId, and quantity are required'
        });
    }

    try {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => decryptText(item.product) === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            await cart.save();

            return res.status(200).json({
                success: true,
                message: 'Cart item updated successfully',
                cart
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

    } catch (error) {
        console.error('Error in updating cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    deleteCartItem,
    clearCart,
    updateCartItem
};
