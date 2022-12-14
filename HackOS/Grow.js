/*
	Increases available money on a server
	RAM Cost: 2.15GB
*/

/** @param {NS} ns */
export async function main(ns)
{
	var server = ns.args[0];

	var availableMoney = ns.getServerMoneyAvailable(server);
	var maxMoney = ns.getServerMaxMoney(server);

	var securityLevel = ns.getServerSecurityLevel(server);
	var minSecurityLevel = ns.getServerMinSecurityLevel(server);

	if (availableMoney < maxMoney &&
		securityLevel < minSecurityLevel * 2 &&
		securityLevel < 100)
	{
		await ns.grow(server);
	}
}