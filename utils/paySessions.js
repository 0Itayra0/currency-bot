const paySessions = new Map(); // userId -> { recipientId, amount }

function createPaySession(userId, recipientId, amount) {
    paySessions.set(userId, { recipientId, amount });
}

function getPaySession(userId) {
    return paySessions.get(userId);
}

function deletePaySession(userId) {
    paySessions.delete(userId);
}

module.exports = {
    createPaySession,
    getPaySession,
    deletePaySession
};
