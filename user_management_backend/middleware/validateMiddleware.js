const { body, validationResult } = require("express-validator");

// Validation middleware wrapper
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Get validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};

// User registration validation rules
const registerValidation = validate([
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscores"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter"),

  body("contact")
    .trim()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage("Please enter a valid contact number"),

  body("role")
    .optional()
    .isIn(["BOOKING_USER", "VENUE_OWNER"])
    .withMessage("Invalid role specified"),
]);

// Login validation rules
const loginValidation = validate([
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
]);

// Profile update validation rules
const updateProfileValidation = validate([
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscores"),

  body("contact")
    .optional()
    .trim()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage("Please enter a valid contact number"),

  body("profilePicture")
    .optional()
    .isURL()
    .withMessage("Please provide a valid URL for the profile picture"),
]);

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
};
