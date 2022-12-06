/** @param {NS} ns */
export async function main(ns)
{
	var server = ns.args[0];

	var availableMoney = ns.getServerMoneyAvailable(server);
	var maxMoney = ns.getServerMaxMoney(server);

	if (availableMoney < maxMoney)
	{
		await ns.grow(server);
	}
}