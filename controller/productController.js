const Product = require("../models/productModel")
const cloudinary = require("cloudinary").v2;

const createProduct = async (req, res) => {
    const { title, description, price } = req.body;
    const image = req.files?.image; // Access file if using middleware

    if (!title || !description || !price) {
        return res.status(400).send('Please enter all fields');
    }

    try {
        let imageUrl = '';

        if (image) {
            // Ensure you access the file correctly
            const uploadedImage = await cloudinary.uploader.upload(image.path, {
                folder: "product",
                crop: "scale"
            });
            imageUrl = uploadedImage.secure_url;
        }

        const productExist = await Product.findOne({ title: title });
        if (productExist) {
            return res.status(400).send("Product Already Exists");
        }

        const newProduct = new Product({
            title: title,
            description: description,
            price: price,
            image: imageUrl
        });

        await newProduct.save();
        res.json({
            success: true,
            message: "Product created successfully",
            product: newProduct
        });

    } catch (error) {
        console.log(`Error while Creating Product: ${error}`);
        res.status(400).send("Internal Server Error");
    }
};


const getallProduct = async (req, res) => {
    try {
        const allProducts = await Product.find();
        if (!allProducts) {
            return res.status(400).send("No Product Found")
        }
        return res.status(200).json({
            success: true,
            allProducts,
            message: "All Products Fetch successfully"
        })
    } catch (error) {
        console.log(`Error while Fetching all Product is ${error}`)
        res.status(500).send("Internal Server Error")
    }
}

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if(!product){
            return res.status(400).send("Product Not Found")
        }
        return res.status(200).json({
            success: true,
            product,
            message: "Single Product Fetch Successfully"
        })
    } catch (error) {
        console.log(`Error while Fetching  Product is ${error}`)
        res.status(500).send("Internal Server Error")
    }
}

const deleteProductById = async (req, res) => {
    try {
        const deleteProduct = await Product.findByIdAndDelete(req.params.id)
        if (!deleteProduct) {
            return res.status(400).send("Deleted Product Not Found")
        }
        return res.status(200).json({
            success: true,
            deleteProduct,
            message: "Product Deleted Successfuly"
        })

    } catch (error) {
        console.log(`Error while deleting product is ${error}`)
        return res.status(500).send("Internal Server Error")
    }
}

const updateProduct = async (req, res) => {
    const { title, description } = req.body;
    const { image } = req.path;

    try {
        let updatedData = {
            title: title,
            description: description,
        };

        if (image) {
            const uploadedImage = await cloudinary.v2.uploader.upload(
                image.path,
                {
                    folder: "foharmalai/products",
                    crop: "scale"
                }
            );
            updatedData.image = uploadedImage.secure_url;
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            updatedData: updatedProduct,
            message: "Product updated successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


module.exports = {
    createProduct, getallProduct, deleteProductById, updateProduct, getProductById
}