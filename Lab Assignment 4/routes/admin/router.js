const express = require("express");
const multer = require("multer");
const Category = require("../../models/Cat_Schema");
const Product = require("../../models/Product_schema");
const Account = require("../../models/AccountSchema");
const Order = require("../../models/OrderSchema");
const bcrypt = require("bcryptjs");

function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    return next(); 
  }
  res.redirect("/signin"); 
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.use("/admin-pages", isAuthenticated);
router.get("/contact-us", (req, res) => {
  res.render("contact-us", { layout: false });
});

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.render("home", { layout: false, products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).send("Server Error");
  }
});
router.get("/admin-pages/admin/product/create", async (req, res) => {
  const categories = await Category.find();
  res.render("admin-pages/product-create", {
    layout: "admin-layout",
    categories,
  });
});

router.get("/admin-pages/dashboard", (req, res) => {
  res.render("admin-pages/dashboard", { layout: "admin-layout" });
});

router.get("/admin-pages/admin/product/:page?", async (req, res) => {
  try {
    let page = req.params.page ? Number(req.params.page) : 1;
    let pageSize = 2;
    let query = req.query.query || "";
    let sort = req.query.sort || "title_asc";
    let categoryFilter = req.query.category || ""; // Get the selected category from the query

    let sortQuery;
    switch (sort) {
      case "title_asc":
        sortQuery = { title: 1 };
        break;
      case "title_desc":
        sortQuery = { title: -1 };
        break;
      case "price_asc":
        sortQuery = { price: 1 };
        break;
      case "price_desc":
        sortQuery = { price: -1 };
        break;
      case "category_asc":
        sortQuery = { category: 1 };
        break;
      case "category_desc":
        sortQuery = { category: -1 };
        break;
      default:
        sortQuery = { title: 1 };
    }

    let filterQuery = {};
    if (query) {
      filterQuery = {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      };
    }

    if (categoryFilter) {
      filterQuery.category = categoryFilter; // Add category filter
    }

    let products = await Product.find(filterQuery)
      .populate("category")
      .limit(pageSize)
      .skip((page - 1) * pageSize)
      .sort(sortQuery);

    let totalRecords = await Product.countDocuments(filterQuery); // Count documents based on filter
    let totalPages = Math.ceil(totalRecords / pageSize);

    const categories = await Category.find(); // Fetch categories for the filter

    res.render("admin-pages/product-form", {
      layout: "admin-layout",
      products,
      page,
      totalRecords,
      totalPages,
      query,
      sort,
      categories, // Pass categories to the view
      categoryFilter, // Pass selected category filter to the view
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Server Error");
  }
});
router.post(
  "/admin-pages/admin/product-form",
  upload.single("image"),
  async (req, res) => {
    const { category, title, description, price, quantity, isFeatured } =
      req.body;
    const image = req.file.path;

    const newProduct = new Product({
      category,
      title,
      description,
      price,
      quantity,
      isFeatured,
      image,
    });

    await newProduct.save();
    res.redirect("/admin-pages/admin/product");
  }
);

router.get("/admin-pages/admin/product/edit/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const categories = await Category.find();

    if (!product) {
      return res.status(404).send("Product not found");
    }

    return res.render("admin-pages/product-edit", {
      product,
      categories,
      layout: "admin-layout",
    });
  } catch (error) {
    console.error("Error fetching product or categories:", error);
    return res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/admin-pages/admin/product/edit/:id",
  upload.single("image"),
  async (req, res) => {
    const { category, title, description, price, quantity, isFeatured } =
      req.body;
    const updatedData = {
      category,
      title,
      description,
      price,
      quantity,
      isFeatured,
    };

    if (req.file) {
      updatedData.image = req.file.path;
    }

    await Product.findByIdAndUpdate(req.params.id, updatedData);
    res.redirect("/admin-pages/admin/product");
  }
);

router.post("/admin-pages/admin/product/delete/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect("/admin-pages/admin/product");
});

router.get("/admin-pages/admin/category/create", async (req, res) => {
  res.render("admin-pages/category-create", { layout: "admin-layout" });
});

router.post("/admin-pages/admin/category/create", async (req, res) => {
  const { name } = req.body;
  const newCategory = new Category({ name });
  await newCategory.save();
  res.redirect("/admin-pages/admin/category/1");
});

router.post("/cart/add", (req, res) => {
  const { id, title, price } = req.body;

  let cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];

  const existingProduct = cart.find((item) => item.id === id);
  if (existingProduct) {
    existingProduct.quantity++;
  } else {
    cart.push({ id, title, price, quantity: 1 });
  }

  res.cookie("cart", JSON.stringify(cart), { httpOnly: true });
  res.redirect("/cart");
});

router.get("/cart", (req, res) => {
  const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  res.render("cart", { layout: false, cart });
});

router.post("/cart/remove", (req, res) => {
  const { id } = req.body;
  let cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];

  cart = cart.filter((item) => item.id !== id);

  res.cookie("cart", JSON.stringify(cart), { httpOnly: true });
  res.redirect("/cart");
});

router.post("/cart/update", (req, res) => {
  const { id, action } = req.body;

  let cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];

  const productIndex = cart.findIndex((item) => item.id === id);

  if (productIndex !== -1) {
    if (action === "increase") {
      cart[productIndex].quantity++;
    } else if (action === "decrease") {
      if (cart[productIndex].quantity > 1) {
        cart[productIndex].quantity--;
      }
    }
  }

  res.cookie("cart", JSON.stringify(cart), { httpOnly: true });
  res.redirect("/cart");
});

router.get("/admin-pages/admin/category/:page?", async (req, res) => {
  try {
    let page = req.params.page ? Number(req.params.page) : 1;
    let pageSize = 2;
    let query = req.query.query || "";
    let sort = req.query.sort || "name_asc";

    let sortQuery;
    switch (sort) {
      case "name_asc":
        sortQuery = { name: 1 };
        break;
      case "name_desc":
        sortQuery = { name: -1 };
        break;
      default:
        sortQuery = { name: 1 };
    }

    let categories;
    if (query) {
      categories = await Category.find({
        name: { $regex: query, $options: "i" },
      })
        .limit(pageSize)
        .skip((page - 1) * pageSize)
        .sort(sortQuery);
    } else {
      categories = await Category.find()
        .limit(pageSize)
        .skip((page - 1) * pageSize)
        .sort(sortQuery);
    }

    let totalRecords = await Category.countDocuments();
    let totalPages = Math.ceil(totalRecords / pageSize);

    res.render("admin-pages/category-form", {
      layout: "admin-layout",
      categories,
      page,
      totalRecords,
      totalPages,
      query,
      sort,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Server Error");
  }
});

router.get("/admin-pages/admin/category/edit/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);
  res.render("admin-pages/category-edit", { layout: "admin-layout", category });
});

router.post("/admin-pages/admin/category/edit/:id", async (req, res) => {
  const { name } = req.body;
  await Category.findByIdAndUpdate(req.params.id, { name });
  res.redirect("/admin-pages/admin/category/1");
});

router.post("/admin-pages/admin/category/delete/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.redirect("/admin-pages/admin/category/1");
});

router.get("/bill", (req, res) => {
  const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  res.render("bill", { layout: false, cart });
});
router.get("/bill/confirm", (req, res) => {
  res.cookie("cart", JSON.stringify([]), { httpOnly: true });

  res.render("confirmorder", { layout: false });
});
router.get("/signin", (req, res) => {
  res.render("signin", { layout: false });
});
router.get("/createaccount", (req, res) => {
  res.render("createacc", { layout: false });
});
router.post("/create-account", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).send("All fields are required.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAccount = new Account({
      username,
      email,
      password: hashedPassword,
    });

    await newAccount.save();

    res.redirect("/signin");
  } catch (error) {
    console.error("Error creating account:", error.message);

    if (error.code === 11000) {
      return res.status(400).send("Username or email already exists.");
    }
    res.status(500).send("Server Error");
  }
});
router.post("/bill/confirm", async (req, res) => {
  const { name, phone } = req.body;
  const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];

  if (!name || !phone) {
    return res.status(400).send("Name and phone number are required.");
  }

  try {
    let totalAmount = 0;
    const items = cart.map((item) => {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;
      return {
        product: item.title,
        quantity: item.quantity,
        price: item.price,
        subtotal: subtotal,
      };
    });

    const newOrder = new Order({
      name,
      phone,
      items,
      totalAmount,
    });

    await newOrder.save();

    res.clearCookie("cart");

    res.redirect("/bill/confirm");
  } catch (error) {
    console.error("Error confirming order:", error.message);
    res.status(500).send("Server Error");
  }
});
router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required.");
  }

  try {
    const account = await Account.findOne({ username });

    if (!account) {
      return res.status(400).send("Invalid credentials.");
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials.");
    }

    req.session.isAuthenticated = true;
    res.redirect("/admin-pages/dashboard");
  } catch (error) {
    console.error("Error signing in:", error.message);
    res.status(500).send("Server Error");
  }
});

router.get("/admin-pages/dashboard", (req, res) => {
  res.render("admin-pages/dashboard", { layout: "admin-layout" });
});

router.get("/search", async (req, res) => {
  try {
    const query = req.query.query || "";
    let products = [];

    if (query) {
      products = await Product.find({
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      });
    }

    res.render("search", { layout: false, query, products });
  } catch (error) {
    console.error("Error fetching search results:", error.message);
    res.status(500).send("Server Error");
  }
});
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/signin");
  });
});
router.get("/contact-us",async(req,res)=>{
  try {
    res.render("contact-us");
  } catch (error) {
    console.error("Error Opening Contact Us!");
    res.status(500).send("Server Error");
  }
});

router.get("/admin-pages/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.render("admin-pages/orders", { layout: "admin-layout", orders });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
