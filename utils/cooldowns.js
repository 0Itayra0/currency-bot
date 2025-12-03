const cooldowns = new Map(); // commandName -> Map(userId -> timestamp)

function checkCooldown(commandName, userId, cooldownSeconds) {
    if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Map());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(commandName);

    if (timestamps.has(userId)) {
        const expiration = timestamps.get(userId) + cooldownSeconds * 1000;
        if (now < expiration) {
            const remaining = ((expiration - now) / 1000).toFixed(1);
            return remaining; // return seconds left
        }
    }

    // Set new cooldown
    timestamps.set(userId, now);
    return null; // no cooldown active
}

module.exports = { checkCooldown };
