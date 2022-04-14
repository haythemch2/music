const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requireLogin = require("../middleware/requireLogin");

// post a user
// signup
//http://localhost:5000/signup

router.post("/signup", (req, res) => {
  const {
    name,
    email,
    password,
    url,
    role,
    phone,
    description,
    facebook,
    instagram,
    twitter,
  } = req.body;
  if (!email || !name || !password) {
    return res.status(422).json({ error: "Please add all the fields" });
  }
  User.findOne({ email: email })
    .then((savedUser) => {
      if (savedUser) {
        return res
          .status(422)
          .json({ error: "User already exists with that email" });
      }
      bcrypt.hash(password, 10).then((hashedPassword) => {
        const user = new User({
          email,
          password: hashedPassword,
          name,
          url,
          role,
          phone,
          description,
          facebook,
          instagram,
          twitter,
        });
        user
          .save()
          .then((user) => {
            res.json({ user: user, message: "succesfuly saved" });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

// post
// signin
// http://localhost:5000/signin

router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ error: "please add email and password" });
  }
  User.findOne({ email: email }).then((savedUser) => {
    if (!savedUser) {
      console.log("no email");
      return res.status(422).json({ error: "invalid email or password" });
    }
    bcrypt
      .compare(password, savedUser.password)
      .then((doMatch) => {
        if (doMatch) {
          //res.json({message:"succesfully signed in"})

          const token = jwt.sign(
            { _id: savedUser._id },
            process.env.JWT_SECRET
          );
          const {
            _id,
            name,
            email,
            url,
            role,
            phone,
            description,
            facebook,
            instagram,
            twitter,
          } = savedUser;
          res.json({
            token,
            user: {
              _id,
              name,
              email,
              url,
              role,
              phone,
              description,
              facebook,
              instagram,
              twitter,
            },
          });
        } else if (password === savedUser.password) {
          {
            //res.json({message:"succesfully signed in"})
            console.log(savedUser);
            const token = jwt.sign(
              { _id: savedUser._id },
              process.env.JWT_SECRET
            );
            const {
              _id,
              name,
              email,
              url,
              role,
              phone,
              description,
              facebook,
              instagram,
              twitter,
            } = savedUser;
            res.json({
              token,
              user: {
                _id,
                name,
                email,
                url,
                role,
                phone,
                description,
                facebook,
                instagram,
                twitter,
              },
            });
          }
        } else {
          return res.status(422).json({ error: "invalid email or password" });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

// get user
//login
// http://localhost:5000/signin

router.get("/current", requireLogin, (req, res) => {
  res.status(200).send({ user: req.user });
});

//@Method GET
//@des GET all users
//@Path: http://localhost:6000/user/users
router.get("/users", async (req, res) => {
  try {
    const result = await User.find();
    res.send({ response: result, message: "Getting Users successfully " });
  } catch (error) {
    res.status(400).send({ message: "can not get users" });
  }
});

//@Method DELETE
//@des delete one user by id
//@Path: http://localhost:6000/delete/:id
//@Params id
router.delete("/deleteuser/:id", async (req, res) => {
  try {
    const result = await User.deleteOne({ _id: req.params.id });
    result.n
      ? res.send({ reponse: "user deleted" })
      : res.send("There is no user with this id");
  } catch (error) {
    res.send("Not deleted");
  }
});

//@Method PUT
//@desc update one user by id
//@Path: http://localhost:6000/user/update/:id
//@Params id Body
router.put("/updateprofile/:id", async (req, res) => {
  try {
    console.log(req.body);
    const result = await User.updateOne(
      { _id: req.params.id },
      { $set: { ...req.body } }
    );
    result.nModified
      ? res.send({ message: "user updated" })
      : res.send({ message: "User already updated" });
  } catch (error) {
    res.status(400).send({ message: "there is no user with this id" });
  }
});

module.exports = router;
