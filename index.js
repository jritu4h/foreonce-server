const express = require('express')
const app = express()
const port =process.env.PORT|| 3000
const cors = require('cors')
app.use(cors())
app.use(express.json())
require('dotenv').config()
var jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.mfuox2b.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT=(req,res,next)=>{
  console.log('hitting server')
 //  console.log(req.headers.authorize)
   const authorize=req.headers.authorize;
   if (!authorize) {
     return res.status(401).send({error:true,message:'unauthorize access'})
   }
   const token = authorize.split(' ')[1]
   console.log(token)
   jwt.verify(token,process.env.ACCESS_TOKEN,(error,decoded)=>{
     if(error){
      return res.status(401).send({error: true , message:"unauthorize access"})
     }
     req.decoded=decoded
     next()
   })
}

async function run() {
  try {
    const database = client.db("TawsifStoreDB");
    const products = database.collection("product");
    const userCallaction = database.collection("user");
    const orderCallaction = database.collection("Order");
    const ConfromorderCallaction = database.collection("confrom");
    const reviewCallaction = database.collection("review");


    const verifyAdmin= async (req,res,next)=>{
      const email=req.decoded.email;
      const query={email: email}
      const user= await userCallaction.findOne(query)
     if (user?.role !== "admin") {
        return res.status(403).send({error:true,message:'You Are Not Admin'})
     }
     next()
    }

    app.post('/jwt',(req,res)=>{
      const user= req.body;
      console.log(user)
      const token= jwt.sign(user,process.env.ACCESS_TOKEN,{
        expiresIn:'2000h'
      });
      console.log(token)
      res.send({token})
  
     })


   app.post('/products',verifyJWT,verifyAdmin,async(req,res)=>{
    const product=req.body
    const result= await products.insertOne(product)
    res.send(result)
   }) 
  app.get('/products',async(req,res)=>{
    const result= await products.find().toArray()
    res.send(result)
  })
 
  app.get("/products/:id",async(req,res)=>{
    const id = req.params.id;
    const query={_id: new ObjectId(id)}
    const result= await products.findOne(query)
    res.send(result);
  })


  // verify Admin

  app.post('/user',async(req,res)=>{
    const user=req.body;
    const query = { email: user.email }
    const existingUser = await userCallaction.findOne(query)
    if (existingUser) {
      return res.send({ message: 'user already exists' })
    }
    const result = await userCallaction.insertOne(user);
    res.send(result)
  })

  app.get('/user',verifyJWT, verifyAdmin, async (req, res) => {
    const result = await userCallaction.find().toArray();
    res.send(result);
  });



  // admin

  app.get('/user/admin/:email',verifyJWT,async(req,res)=>{
    const email = req.params.email;
    const query={email: email}
    const user= await userCallaction.findOne(query)
    const result={admin: user?.role==='admin'}
    res.send(result)
  })

  // update user make admin
  app.patch('/user/admin/:id',async(req,res)=>{
    const id= req.params.id
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: 'admin'
      },
    };
    const result = await userCallaction.updateOne(filter,updateDoc)
    res.send(result)
  })

  app.delete('/user/:id',async(req,res)=>{
    const id= req.params.id
    const query = { _id: new ObjectId(id) };
    const result = await userCallaction.deleteOne(query)
    res.send(result)
  })
  // admin order confrom

  app.post('/storeOrder',async(req,res)=>{
    const confrom = req.body
    const result= await ConfromorderCallaction.insertOne(confrom)
    res.send(result)
  })

 app.get('/storeOrder',verifyJWT,verifyAdmin,async(req,res)=>{
  const result= await ConfromorderCallaction.find().toArray()
         res.send(result)
 })
 app.get('/chart',verifyJWT,verifyAdmin,async(req,res)=>{
  const result= await ConfromorderCallaction.find().toArray()
         res.send(result)
 })
 app.get('/storeOrder/:id',async(req,res)=>{
  const id= req.params.id
  const query = { _id: new ObjectId(id) };
  const result= await ConfromorderCallaction.findOne(query)
         res.send(result)
 })

  app.get('/confromorder',verifyJWT,verifyAdmin,async(req,res)=>{
         const result= await orderCallaction.find().toArray()
         res.send(result)
  })
/* status */

app.get("/status",verifyJWT,verifyAdmin,async(req,res)=>{
  const users= await userCallaction.estimatedDocumentCount()
  const orders= await ConfromorderCallaction.estimatedDocumentCount()
  const Products= await products.estimatedDocumentCount()
  res.send({
    users,
    orders,
    Products
  })
})

/* status */
  app.put('/confromorder/:id',async(req,res)=>{
    const id= req.params.id
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        Ispending:'Accepted'
      },
    };
    const result = await orderCallaction.updateOne(filter,updateDoc)
    res.send(result)
  })

  app.delete('/confromorder/:id',async(req,res)=>{
    const id= req.params.id
    const query = { _id: new ObjectId(id) };
    const result = await orderCallaction.deleteOne(query)
    res.send(result)
  })



  app.post("/order",async(req,res)=>{
    const order = req.body
   const result= await orderCallaction.insertOne(order)
   res.send(result)
  })

  app.get("/order",verifyJWT,async(req,res)=>{
    const email = req.query.email;

    if (!email) {
      res.send([]);
    }
    const query = { email: email };

   const result= await orderCallaction.find(query).toArray()
   res.send(result)
  })
  app.delete('/order/:id',async(req,res)=>{
    const id = req.params.id
    const query={_id: new ObjectId(id)}
    const result= await orderCallaction.deleteOne(query)
    res.send(result)
  })

  app.post('/review',async(req,res)=>{
    const review = req.body
    const result= await reviewCallaction.insertOne(review)
    res.send(result)
  })
  app.get('/review',verifyJWT,async(req,res)=>{
    const email = req.query.email;

    if (!email) {
      res.send([]);
    }
    const query = { email: email };

   const result= await reviewCallaction.find(query).toArray()
   res.send(result)
  })
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('server!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})