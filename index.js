const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

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

    app.get('/products', async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skipIndex = (page - 1) * limit;

        const products = await allProducts.find()
          .sort({ createdAt: -1 }) // Sort by creation date
          .limit(limit)
          .skip(skipIndex)
          .toArray(); // Convert the cursor to an array
  
        const totalProducts = await allProducts.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);
  
        res.status(200).json({
          totalProducts,
          totalPages,
          currentPage: page,
          products,
        });
      } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Ping the database to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
