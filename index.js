const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectToDatabase = require("./db/db");
const cloudinary = require("cloudinary").v2;
const acceptMultimedia = require("connect-multiparty");
const csurf = require("csurf");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
dotenv.config();

connectToDatabase();

// Cloudinary Config for Images
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// For Uploading Files
app.use(acceptMultimedia());

// Parse cookies to enable CSRF protection
// app.use(cookieParser());

// CSRF protection
// const csrfProtection = csurf({ cookie: true });

const corsOptions = {
    origin: true,
    credentials: true,
    optionSuccessStatus: 200
};

app.use(cors(corsOptions));

// Apply CSRF protection globally
// app.use(csrfProtection);

// Route to get the CSRF token
// app.get('/api/csrf-token', (req, res) => {
//     res.status(200).json({ csrfToken: req.csrfToken() });
// });

app.use('/api/user', require("./routes/userRoutes"));
app.use('/api/product', require("./routes/productroutes"));
app.use('/api/cart', require("./routes/cartRoute"));
app.use('/api/audit', require("./routes/auditRoute"));

app.get('/', (req, res) => {
    res.send("Hello from the server");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// fetch('http://localhost:5500/api/csrf-token', {
//     method: 'GET',
//     credentials: 'include' // This is important to include the cookie
// })
// .then(response => response.json())
// .then(data => {
//     console.log('CSRF Token:', data.csrfToken); // Check if you get the CSRF token
// })
// .catch(error => console.error('Error fetching CSRF token:', error));
