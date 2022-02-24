const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletSchema = new Schema({
    id: String,
    owned_by: String,
    status: String,
    enabled_at: {
        type: Date,
        default: Date.now,
    },
    balance: Number,
    deposit: [
        {
            type: Schema.Types.ObjectId,
            ref: "Deposit",
        },
    ],
    withdrawal: [
        {
            type: Schema.Types.ObjectId,
            ref: "Withdrawal",
        },
    ],
});

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
