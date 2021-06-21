const express = require("express");
const app = express();
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
// firebase
const admin = require("firebase-admin");
const serviceAccount = require(`./adminSDK.json`);
// mongodb
const ObjectId = require("mongodb").ObjectID;
const port = 5000;
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.skjt9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.use(bodyParser.json());
app.use(cors());
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const userCollection = client
    .db(process.env.DB_NAME)
    .collection(process.env.DB_USER_COLLECTION);
  const jobCollection = client
    .db(process.env.DB_NAME)
    .collection(process.env.DB_JOB_COLLECTION);
  const applyCollection = client
    .db(process.env.DB_NAME)
    .collection(process.env.DB_APPLY_COLLECTION);
  //   const propertyCollection = client
  //     .db(process.env.DB_NAME)
  //     .collection(process.env.DB_PROPERTY_COLLECTION);
  //   const ordersCollection = client
  //     .db(process.env.DB_NAME)
  //     .collection(process.env.DB_ORDER_COLLECTION);
  //   const reviewCollection = client
  //     .db(process.env.DB_NAME)
  //     .collection(process.env.DB_REVIEW_COLLECTION);
  //   const adminCollection = client
  //     .db(process.env.DB_NAME)
  //     .collection(process.env.DB_ADMIN_COLLECTION);

  // jwt token verify

  //   const authCheck = (req, res,next) => {
  //     const token = req.headers.authorization;
  //     // console.log(token);
  //     if (token) {
  //       // console.log(token)
  //       admin
  //       .auth()
  //       .verifyIdToken(token)
  //       .then((decodedToken) => {
  //         const uid = decodedToken.uid;
  //         console.log(uid);
  //         next()
  //       })
  //       .catch((error) => {
  //         // Handle error
  //         console.log(error)
  //       });

  //     }
  //     // idToken comes from the client app
  //     else {
  //       res.status(401).json({ message: "Unauthorized Action" });
  //     }
  //   };

  app.post("/addUser", (req, res) => {
    const user = req.body;
    userCollection.insertOne(user).then((result) => {
      //   console.log(result);
      res.send(result.insertedCount > 0);
    });
  });
  app.get("/checkUserRole/:email", (req, res) => {
    userCollection
      .find({ email: req.params.email })
      .toArray((err, documents) => {
        if (err) {
          res.sendStatus(400).send("Could not perform the search");
          console.log(err);
        } else {
          res.json(documents[0]);
        }
      });
  });

  app.post("/addJob", (req, res) => {
    const job = { ...req.body, status: "pending" };
    jobCollection.insertOne(job).then((result) => {
      res.json(result.insertedCount);
    });
  });

  app.get("/allJobBySingleEmployer/:email", (req, res) => {
    jobCollection
      .find({ email: req.params.email })
      .toArray((err, documents) => {
        if (err) {
          res.sendStatus(400).send("Could not perform the search");
          console.log(err);
        } else {
          res.json(documents);
        }
      });
  });
  //   get all post only admin can approve
  app.get("/allposts", (req, res) => {
    jobCollection.find({}).toArray((err, documents) => {
      if (err) {
        res.sendStatus(400).send("Could not perform the search");
        console.log(err);
      } else {
        res.json(documents);
      }
    });
  });

  //   update job post status

  app.patch("/publishJobPost/:id", (req, res) => {
    const { status } = req.body;
    jobCollection
      .updateOne(
        { _id: ObjectId(req.params.id) },
        {
          $set: {
            status: status,
          },
        }
      )
      .then((result) => {
        res.send(result);
      });
  });
  //   show all publised post in ui
  app.get("/getAllJob", (req, res) => {
    jobCollection.find({ status: "publish" }).toArray((err, documents) => {
      if (err) {
        res.sendStatus(400).send("Could not perform the search");
        console.log(err);
      } else {
        res.json(documents);
      }
    });
  });
  // find a specific job for apply
  app.get("/findJob/:jobId", (req, res) => {
    jobCollection
      .find({ _id: ObjectId(req.params.jobId) })
      .toArray((err, documents) => {
        if (err) {
          res.sendStatus(400).send("Could not perform the search");
          console.log(err);
        } else {
          res.json(documents[0]);
        }
      });
  });
  // apply from jobSeeker
  app.post("/applyOnJob", (req, res) => {
    const data = req.body;
    applyCollection.insertOne(data).then((result) => {
      res.json(result.insertedCount);
    });
  });
  // check if already applied for this post

  app.get("/checkDuplicateApply/:jobId/:email", (req, res) => {
    applyCollection
      .find({ jobId: req.params.jobId, email: req.params.email })
      .toArray((err, documents) => {
        if (err) {
          res.sendStatus(400).send("Could not perform the search");
          console.log(err);
        } else {
          res.json(documents);
        }
      });
  });
});

app.listen(process.env.PORT || port);
