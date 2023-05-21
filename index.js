const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ws55k5x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		client.connect();

		const toyCollection = client
			.db('incyWincyCars')
			.collection('toyCollection');

		//create index for search
		const indexKey = { toyName: 1 };
		const indexOption = { name: 'toyIndex' };
		await toyCollection.createIndex(indexKey, indexOption);
		app.get('/all_toys/:searchText', async (req, res) => {
			const searchText = req.params.searchText;
			const result = await toyCollection
				.find({
					toyName: { $regex: searchText, $options: 'i' },
				})
				.toArray();
			res.send(result);
		});

		//to send single toy data
		app.get('/view_toy/:id', async (req, res) => {
			const id = req.params.id;
			// console.log(id);
			const query = { _id: new ObjectId(id) };
			const result = await toyCollection.findOne(query);
			res.send(result);
		});

		//to send specific toy data for all toy page
		app.get('/all_toys', async (req, res) => {
			const result = await toyCollection
				.find()
				.project({
					sellerName: 1,
					subCategory: 1,
					toyName: 1,
					price: 1,
					availableQuantity: 1,
				})
				.limit(20)
				.toArray();
			res.send(result);
		});

		//to send specific toy data for my toy page
		app.get('/my_toys/:email', async (req, res) => {
			const email = req.params.email;
			const query = { sellerEmail: email };
			const result = await toyCollection.find(query).toArray();
			res.send(result);
		});

		//to delete specific toy data from my toy page
		app.delete('/my_toys/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await toyCollection.deleteOne(query);
			res.send(result);
		});

		//to send specific toy data
		app.get('/:sub_category', async (req, res) => {
			const subCategory = req.params.sub_category;
			const query = { subCategory: subCategory };
			const result = await toyCollection
				.find(query)
				.project({ photoURL: 1, toyName: 1, price: 1, ratings: 1 })
				.limit(2)
				.toArray();
			res.send(result);
		});

		//for receiving toy data
		app.post('/add_toy', async (req, res) => {
			// const toyData = req.body;

			const doc = {
				photoURL: req.body.photoURL,
				toyName: req.body.toyName,
				sellerName: req.body.sellerName,
				sellerEmail: req.body.sellerEmail,
				subCategory: req.body.subCategory,
				price: req.body.price,
				ratings: req.body.ratings,
				availableQuantity: req.body.availableQuantity,
				detailsDescription: req.body.detailsDescription,
			};

			const result = await toyCollection.insertOne(doc);
			res.send(result);
		});

		// Send a ping to confirm a successful connection
		await client.db('admin').command({ ping: 1 });
		console.log(
			'Pinged your deployment. You successfully connected to MongoDB!'
		);
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.get('/', async (req, res) => {
	res.send('Incy Wincy Cars is running...');
});

app.listen(port, () => {
	console.log(`server is running on port: ${port}`);
});
