/** @param {NS} ns */
export async function main(ns)
{
	var server = ns.args[0];

	while (true)
	{
		var availableMoney = ns.getServerMoneyAvailable(server);
		var maxMoney = ns.getServerMaxMoney(server);

		if (availableMoney < maxMoney)
		{
			await ns.grow(server);
		}
		else
		{
			await ns.sleep(1);
		}
	}
}