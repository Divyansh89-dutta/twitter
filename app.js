const express = require('express');
const cookieParser = require('cookie-parser');
const userModel = require("./models/user.model");
const tweetModel = require("./models/tweet.model");
const upload = require("./models/matler.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const flash = require('connect-flash');
const path = require('path');
const expressSession = require("express-session");

const app = express();

require("./config/db.config");

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "hjagshkncbhjakskzbchkj"
}));
app.use(flash());

app.get("/", redirectToFeed, function (req, res) {
    res.render("welcome");
});

app.get("/profile", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ username: req.user.username });
    res.render("profile", { user });
});

app.get("/register", function (req, res) {
    res.render("register", { error: req.flash("error")[0] });
});

app.post("/register", async function (req, res) {
    let { username, password } = req.body;

    let user = await userModel.findOne({ username });
    if (user) {
        req.flash("error", "account already exists, please login.");
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
    res.render("login", { error: req.flash("error")[0] });
})

app.post("/login", async function (req, res) {
    let { username, password } = req.body;
    let user = await userModel.findOne({ username });
    if (!user) {
        req.flash("error", "username or password is incorrect.");
        return res.redirect("/login");
    }

    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ username }, "secret"); // don't repeat this, extremely unsafe
            res.cookie("token", token);
            res.redirect("/feed");
        }
        else {
            req.flash("error", "username or password is incorrect.")
            res.redirect("/login");
        }
    });
})
app.get("/edit", isLoggedIn, function (req, res) {
    res.render("edit");
})
app.post("/upload", isLoggedIn, upload.single('profilePicture', 'document'), async function (req, res) {
    let user = await userModel.findOne({ username: req.user.username });
    user.profilePicture = req.file.filename;
    await user.save();
    console.log(req.file.filename);
    res.redirect("/profile");
})


app.get("/logout", function (req, res) {
    res.cookie("token", "");
    res.redirect("/login");
})

app.get("/feed", isLoggedIn, async function (req, res) {
    let tweets = await tweetModel.find()
    let profilePicture = await userModel.findOne({ username: req.user.username });
    let user = await userModel.findOne({ username: req.user.username });
    res.render("feed", { tweets, user, profilePicture });
})

app.get("/createpost", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ username: req.user.username });
    res.render("createpost", { user });
})

app.post("/createpost", isLoggedIn, async function (req, res) {
    let { tweet } = req.body;
    await tweetModel.create({
        tweet,
        profilePicture: req.user.profilePicture,
        username: req.user.username
    })
    res.redirect("/feed");
})


function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        req.flash("error", "you must be loggedin.");
        return res.redirect("/login");
    }
    jwt.verify(req.cookies.token, "secret", function (err, decoded) {
        if (err) {
            res.cookie("token", "");
            return res.redirect("/login");
        }
        else {
            req.user = decoded;
            return next();
        }
    }) // don't write secret here, it's extremely unsafe

}

function redirectToFeed(req, res, next) {
    if (req.cookies.token) {
        jwt.verify(req.cookies.token, "secret", function (err, decoded) {
            if (err) {
                res.cookie("token", "");
                return next();
            }
            else {
                res.redirect("/feed");
            }
        })
    }
    else{
        return next();
    }
}
app.get('/like/:id', isLoggedIn, async function (req, res) {
    let tweet = await tweetModel.findById(req.params.id);
    if (!tweet.likes.includes(req.user.username)) {
        tweet.likes.push(req.user.username);
        await tweet.save();
    }
    else {
        tweet.likes = tweet.likes.filter(username => username !== req.user.username);
        await tweet.save();
    }
    res.redirect("/feed");
})

app.post('/comment/:id', isLoggedIn, async function (req, res) {
    let tweet = await tweetModel.findById(req.params.id);
    tweet.comments.push({
        comment: req.body.comment,
        username: req.user.username,
        createdAt: new Date()
    });
    await tweet.save();
    res.redirect("/feed");
})
app.get('/comment/:id', isLoggedIn, function (req, res) {
    res.render("comment");
})
app.get('/delete/:id', isLoggedIn, async function (req, res) {
    await tweetModel.findByIdAndDelete(req.params.id);
    res.redirect("/feed");
})

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});