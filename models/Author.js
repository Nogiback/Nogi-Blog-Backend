const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

AuthorSchema.virtual("url").get(function () {
  return `/author/${this._id}`;
});

module.exports = mongoose.model("Author", AuthorSchema);
