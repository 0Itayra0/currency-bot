const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    type: { type: String, required: true }, 
    senderId: { type: String, default: null },
    recipientId: { type: String, default: null },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", TransactionSchema);
