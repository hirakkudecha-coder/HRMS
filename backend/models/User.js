// Import mongoose to build schema and bcryptjs to hash passwords
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User / Employee Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function (v) {
        return /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[@$!%*?&]/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    },
    select: false // Do not return password by default when querying users
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'hr', 'finance', 'admin'],
    default: 'employee'
  },
  // Details specific to employees
  employeeDetails: {
    employeeId: {
      type: String,
      unique: true,
      sparse: true // Allows admin users without an employee ID
    },
    department: {
      type: String,
      default: 'General'
    },
    designation: {
      type: String,
      default: 'Associate'
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    phone: {
      type: String,
      default: ''
    },
    skills: {
      type: [String],
      default: []
    },
    region: {
      type: String,
      enum: ['India', 'USA', 'UK', 'Russia'],
      default: 'India'
    },
    profileImage: {
      type: String,
      default: '' // URL path of the uploaded avatar image
    }
  }
}, {
  timestamps: true // Automatically create 'createdAt' and 'updatedAt' fields
});

// Middleware: Encrypt password using bcryptjs before saving to database
UserSchema.pre('save', async function (next) {
  // Only encrypt password if it is being modified or is new
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: Compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model
module.exports = mongoose.model('User', UserSchema);
