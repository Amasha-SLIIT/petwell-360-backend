const reviewReplySchema = new Schema({
    reviewID: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
    staffID: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ReviewReply = mongoose.model("ReviewReply", reviewReplySchema);
module.exports = ReviewReply;
