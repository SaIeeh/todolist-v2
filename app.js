// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

// Create an Express app
const app = express();

// Connect to the MongoDB database
mongoose.connect('mongodb+srv://9looo7y77:LxIixJ97pee9ZPo3@cluster0.k9ud5p3.mongodb.net/todolistDB', { useNewUrlParser: true });

// Define the Mongoose schema for items
const itemsSchema = {
  name: String
};
const Item = mongoose.model("items", itemsSchema);

// Create some default items
const item1 = new Item({
  name: "Welcome to your todolist!."
});
const item2 = new Item({
  name: "Hit the + button to add an item."
});
const item3 = new Item({
  name: "<-- hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

// Define the Mongoose schema for lists
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("list", listSchema);

// Set the view engine and use necessary middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Define the routes
app.get("/", function (req, res) {
  // Find all items in the database
  Item.find({}).then(function (foundItems) {
    // If there are no items in the database, insert the default items and redirect to the root path
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(function () {
        console.log("Data inserted"); // Success
      }).catch(function (error) {
        console.log(error); // Failure
      });
      res.redirect("/");
    } else {
      // If there are items in the database, render the list page with the found items
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

// Handle post request for deleting an item
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // Determine whether it's a custom list or the default list
  if (listName === "Today") {
    // Delete the item from the default list and redirect to the home page
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("Item deleted successfully!.");
        res.redirect("/");
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    // Delete the item from the custom list and redirect back to the custom list page
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

// Handle post request for adding a new item
app.post("/", function (req, res) {
  const newItemName = req.body.newItem;
  const listName = req.body.listName; // The name of the custom list

  // Create a new item based on the input
  const newItem = new Item({
    name: newItemName
  });

  if (listName === "Today") {
    // If the list is the default list ("Today"), save the item directly to the database
    newItem.save().then(function () {
      console.log("Item inserted successfully!.");
      res.redirect("/");
    }).catch(function (error) {
      console.log(error);
    });
  } else {
    // If the list is a custom list, find the list in the database and add the new item to it
    List.findOne({ name: listName }).then(function (foundList) {
      if (foundList) {
        foundList.items.push(newItem);
        foundList.save().then(function () {
          console.log("Item inserted successfully!.");
          res.redirect("/" + listName);
        }).catch(function (error) {
          console.log(error);
        });
      }
    }).catch(function (error) {
      console.log(error);
    });
  }
});

// Handle dynamic routes for custom lists
app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        console.log("saved");
        res.redirect("/" + customListName);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) { });

})

// Route for the about page
app.get("/about", function (req, res) {
  res.render("about");
});

// Start the server
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
