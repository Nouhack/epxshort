const express = require("express");
var randomstring = require("randomstring");
const client = require("./database");
const app = express();

app.use(express.static(__dirname + "/styles"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("view engine", "ejs");

//-----------------------  main post route   -----------------------
app.post("/url/*", async (req, res) => {
  // var sub = req.params.txt;
  var pref = randomstring.generate({
    length: 5,
    charset: "alphanumeric",
  });

  // here you add all your login and generate the new url after saving the original one in the database
  try {
    await client.connect();
    const database = client.db("mydb");
    const haiku = database.collection("urls");
    console.log("-------------------------------");
    console.log(req.originalUrl.slice(5));
    console.log("-------------------------------");
    // create a document to insert
    const doc = {
      originalURL: req.originalUrl.slice(5),
      preficURL: pref,
      createdDate: new Date(),
    };

    haiku.createIndex({ createdDate: 1 }, { expireAfterSeconds: 60 });
    const result = await haiku.insertOne(doc);

    console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } finally {
    await client.close();
  }

  //res.send(req.protocol + "://" + req.get("host") + "/" + pref);
  res.render("result", {
    url: req.protocol + "://" + req.get("host") + "/" + pref,
  });
});

//-------------------- get shortcut link then redirect  -----------------------------
app.get("/:prefix", async (req, res) => {
  //console.log(req.params.prefix);

  try {
    await client.connect();
    const database = client.db("mydb");
    const collection = database.collection("urls");
    // Query for a movie that has the title 'The Room'
    const query = { preficURL: req.params.prefix };
    const url = await collection.findOne(query);
    // since this method returns the matched document, not a cursor, print it directly
    if (url) {
      console.log(url);
      return res.redirect(url.originalURL);
    }
  } finally {
    await client.close();
  }

  res.render("notfound");
});
//---------------- main route  ----------------------------
app.get("/", (req, res) => {
  res.render("index");
});
//-------------------------------------------------------
app.listen(4000, () => {
  console.log(`Server started on port 4000`);
});
