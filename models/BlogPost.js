const TimeAgo = require("javascript-time-ago");
const en = require("javascript-time-ago/locale/en");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

const BlogPostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  image: { type: String },
  timestamp: { type: Date, required: true, default: Date.now },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});

BlogPostSchema.virtual("formattedTimestamp").get(function () {
  return timeAgo.format(this.timestamp);
});

module.exports = mongoose.model("BlogPost", BlogPostSchema);
