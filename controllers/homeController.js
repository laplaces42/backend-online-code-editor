const Account = require("../models/account");
const bcrypt = require("bcryptjs");

const logIn = async (req, res) => {
  try {
    
    if (!req.body.username || !req.body.password) {
      return res.status(401).json({
        status: "error",
        message: "Input all required fields",
      });
    }
    const account = await Account.findOne({
      $or: [{ username: req.body.username }, { email: req.body.username }],
    }).exec();

    if (account) {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        account.password
      );

      if (passwordMatch) {
        req.session.userId = account._id.toString();
        console.log(req.session)

        return res.status(200).json({
          status: "success",
          message: "Login successful",
          data: { userId: account._id },
        });
      } else {
        return res.status(401).json({
          status: "error",
          message: "Incorrect password",
        });
      }
    } else {
      return res.status(401).json({
        status: "error",
        message: "Username not found",
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const signUp = async (req, res) => {
  try {
    const checkPassword = (password) => {
      if (password.length < 8 || password.length > 20) {
        return "Passwords must be between 8 and 20 characters";
      }
      if (!/[A-Z]/.test(password)) {
        return "Passwords must have an uppercase letter";
      }
      if (!/[a-z]/.test(password)) {
        return "Passwords must have a lowercase letter";
      }
      if (!/\d/.test(password)) {
        return "Passwords must have at least 1 digit";
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Passwords must have at least 1 special character";
      }
      return null;
    };

    const checkUsername = (username) => {
      if (username.length < 4 || username.length > 20) {
        return "Usernames must be between 4 and 20 characters";
      }
      if (/[^a-zA-Z0-9._-]/.test(username)) {
        return "Usernames cannot have any special characters";
      }
      return null;
    };

    if (!req.body.username || !req.body.password || !req.body.email) {
      return res.status(400).json({
        status: "error",
        message: "Input all required fields",
      });
    }

    const passwordError = checkPassword(req.body.password);
    const usernameError = checkUsername(req.body.username);
    if (passwordError || usernameError) {
      return res.status(400).json({
        status: "error",
        message: passwordError || usernameError,
      });
    }

    const account = await Account.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }],
    }).exec();

    if (account) {
      return res.status(400).json({
        status: "error",
        message: "Username or email already taken",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newAccount = new Account({
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email,
      projects: [],
    });

    await newAccount.save();

    req.session.userId = newAccount._id.toString();
    return res.status(200).json({
      status: "success",
      message: "Signup successful",
      data: { userId: newAccount._id },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = { logIn, signUp };
