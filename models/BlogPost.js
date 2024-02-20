const TimeAgo = require("javascript-time-ago");
const en = require("javascript-time-ago/locale/en");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

const BlogPostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: "Author", required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  published: { type: Boolean, required: true },
});

BlogPostSchema.virtual("formattedTimestamp").get(function () {
  return timeAgo.format(this.timestamp);
});

BlogPostSchema.virtual("url").get(function () {
  return `/posts/${this._id}`;
});

module.exports = mongoose.model("BlogPost", BlogPostSchema);
