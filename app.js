const express = require('express');
const cookieParser = require('cookie-parser');
const userModel = require("./models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const flash = require('connect-flash');
const session = require('express-session');

const app = express();

require("./config/db.config");

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(flash());
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));

app.get("/", function (req, res) {
    res.render("welcome");
});

app.get("/profile", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ username: req.user.username });
    res.render("profile", { user });
});

app.get("/register", function (req, res) {
    res.render("register", { errors: req.flash("errors") [0]});
});

app.post("/register", async function (req, res) {
    let { username, password } = req.body;
    let user = await userModel.findOne({ username });
    if (user) return res.redirect("/register");
    if(user){
        req.flash("errors", "Username already exists");
        return res.redirect("/register");
    }
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
            await userModel.create({
                username,
                password: hash
            })

            let token = jwt.sign({ username }, "secret"); // don't do this, extremely unsafe, for representational purpose only.
            res.cookie("token", token);
            res.redirect("/profile");
        })
    })

});

app.get("/login", function (req, res) {
    res.render("login", { errors: req.flash("errors") [0]});
})

app.post("/login", async function (req, res) {
    let { username, password } = req.body;
    let user = await userModel.findOne({ username });
    if (!user) {
        req.flash("errors", "Incorrect username or password");
        return res.redirect("/login");
    }

    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ username }, "secret"); // don't repeat this, extremely unsafe
            res.cookie("token", token);
            res.redirect("/profile");
        }
        else {
            req.flash("errors", "Incorrect username or password");
            return res.redirect("/login");
        }
    });
})

app.get("/logout", function (req, res) {
    res.cookie("token", "");
    res.redirect("/login");
})

function isLoggedIn(req, res, next) {
    if(!req.cookies.token) {
        req.flash("errors", "You must be logged in");
        return res.redirect("/login");
    }
    jwt.verify(req.cookies.token, "secret", function (err, decoded) {
        if (err) {
            res.cookie("token", "");
            return res.redirect("/login");
        }
        req.user = decoded;
        next();
    })
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});