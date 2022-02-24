const mongoose = require("mongoose");
const { Schema } = mongoose;

const depositSchema = new Schema({
    id: String,
    deposited_at: {
        type: Date,
        default: Date.now,
    },
    amount: Number,
    reference_id: String,
    deposited_by: {
        type: Schema.Types.String,
        ref: "Wallet",
    },
});

const Deposit = mongoose.model("Deposit", depositSchema);

module.exports = Deposit;
