const mongoose = require("mongoose");
const { Schema } = mongoose;

const withdrawSchema = new Schema({
    id: String,
    withdrawn_at: {
        type: Date,
        default: Date.now,
    },
    amount: Number,
    reference_id: String,
    withdrawn_by: {
        type: Schema.Types.String,
        ref: "Wallet",
    },
});

const Withdrawal = mongoose.model("withdrawals", withdrawSchema);

module.exports = Withdrawal;
