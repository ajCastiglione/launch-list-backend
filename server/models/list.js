const mongoose = require("mongoose");

const List = mongoose.model("List", {
  text: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  type: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  },
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = { List };
