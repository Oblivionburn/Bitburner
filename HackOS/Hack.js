/*
	Extracts money from a server
	RAM Cost: 2.25GB
*/

/** @param {NS} ns */
export async function main(ns)
{
    var server = ns.args[0];

    var hackLevel = ns.getHackingLevel();
    var requiredHackLevel = ns.getServerRequiredHackingLevel(server);

    var availableMoney = ns.getServerMoneyAvailable(server);
    var maxMoney = ns.getServerMaxMoney(server);

    var securityLevel = ns.getServerSecurityLevel(server);
    var minSecurityLevel = ns.getServerMinSecurityLevel(server);

    if (hackLevel >= requiredHackLevel &&
        availableMoney >= maxMoney * 0.75 &&
        securityLevel < minSecurityLevel * 2 &&
        securityLevel < 100)
    {
        await ns.hack(server);
    }
}