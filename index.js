const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 9000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://job-task-ad4b4.web.app",
      "https://job-task-ad4b4.firebaseapp.com",
      "https://job-task-server-iota.vercel.app",
    ],
    // methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allow specific methods
    // credentials: true, // Allow credentials if needed
  })
);

// app.use(
//   cors({
//     origin: "*",
//   })
// );

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s1le0vj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect(); // Ensure the MongoDB client is connected

    const allProducts = client.db("Job-Task").collection("all-products");

    app.get("/products", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skipIndex = (page - 1) * limit;
        const searchQuery = req.query.search || "";
        const sortOption = req.query.sort || "";

        const brandFilter = req.query.brand || "";
        const categoryFilter = req.query.category || "";
        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice =
          parseInt(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

        // const query = searchQuery
        //   ? { productName: { $regex: searchQuery, $options: "i" } } // Case-insensitive search
        //   : {};

        let query = {
          price: { $gte: minPrice, $lte: maxPrice },
        };

        if (searchQuery) {
          query.productName = { $regex: searchQuery, $options: "i" };
        }

        if (brandFilter) {
          query.brandName = brandFilter;
        }

        if (categoryFilter) {
          query.category = categoryFilter;
        }

        let sort = {};
        if (sortOption === "priceLowToHigh") {
          sort = { price: 1 };
        } else if (sortOption === "priceHighToLow") {
          sort = { price: -1 };
        } else if (sortOption === "newestFirst") {
          sort = { createdAt: -1 };
        }
        // console.log(query);
        const products = await allProducts
          .find(query)
          .sort(sort)
          .limit(limit)
          .skip(skipIndex)
          .toArray();

        const totalProducts = await allProducts.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
          totalProducts,
          totalPages,
          currentPage: page,
          products,
        });
      } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Server error" });
      }
    });

    // Ping the database to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  } finally {
    // Optional: Close the client connection when you're done
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Assalamualaikum!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
