const TimeAgo = require("javascript-time-ago");
const en = require("javascript-time-ago/locale/en");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

const CommentSchema = new Schema({
  username: { type: String, required: true, minLength: 1 },
  comment: { type: String, required: true, maxLength: 500 },
  post: { type: Schema.Types.ObjectId, ref: "BlogPost", required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

CommentSchema.virtual("formattedTimestamp").get(function () {
  return timeAgo.format(this.timestamp);
});

module.exports = mongoose.model("Comment", CommentSchema);
