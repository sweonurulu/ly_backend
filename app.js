// server/app.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require("cors");
// routers
const userRouter = require("./Routers/userRouter.js");
const contactRouter = require("./Routers/contactRouter.js");
const searchRouter = require("./Routers/searchRouter.js");
const bookRouter = require("./Routers/bookRouter.js");
const bookCategoryRouter = require("./Routers/bookCategoryRouter.js");
const adminRouter = require("./Routers/adminRouter.js");
const contentRouter = require("./Routers/contentRouter.js");
const rentingRouter = require("./Routers/rentingRouter.js");
const pdfRouter = require("./Routers/pdfRouter.js");
const paymentRouter = require("./Routers/paymentRouter.js");
const addressRouter = require("./Routers/addressRouter.js");
const cartRouter = require("./Routers/cartRouter.js");
const contentPdfRouter = require("./Routers/contentPdfRouter.js");

dotenv.config();

const app = express();

// CORS ayarları: tüm sitelere izin verilecek şekilde ayarlandı
app.use(cors({ 
    origin: "*", // Tüm kaynaklardan gelen istekler kabul edilir
    methods: ["GET", "POST", "PUT", "DELETE"], // İzin verilen HTTP metodları
    credentials: true // Çerezlerin (cookies) gönderilmesine izin ver
}));

app.use(express.json());

// routes
app.use("/users", userRouter);
app.use("/book", bookRouter);
app.use("/category", bookCategoryRouter);
app.use("/content", contentRouter);
app.use("/search", searchRouter);
app.use("/contact", contactRouter);
app.use("/admin", adminRouter);
app.use("/renting", rentingRouter);
app.use("/pdf", pdfRouter);
app.use("/payment", paymentRouter);
app.use("/address", addressRouter);
app.use("/cart", cartRouter);
app.use("/content-pdf", contentPdfRouter);

app.listen(process.env.PORT, () => {
    mongoose.connect(process.env.DB_CONNECTION)
        .then(() => console.log("Veritabanına bağlandı"))
        .catch((error) => console.log(error));
});
