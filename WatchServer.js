/*
	Observe changes in server stats
	RAM Cost: 2GB
*/

/** @param {NS} ns */
export async function main(ns)
{
	var server = ns.args[0];

	ns.disableLog("ALL");
	ns.tail("WatchServer.js", "home", server);

	const colors = 
    {
		red: "\u001b[31;1m",
		green: "\u001b[32;1m",
		yellow: "\u001b[33;1m",
		white: "\u001b[37;1m",
		reset: "\u001b[0m"
	};

	while (true)
	{
		ns.clearLog();
		
		var availableMoney = ns.getServerMoneyAvailable(server);
		var maxMoney = ns.getServerMaxMoney(server);
		var securityLevel = ns.getServerSecurityLevel(server);
		var minSecurityLevel = ns.getServerMinSecurityLevel(server);

		ns.print(`${colors["yellow"] + server}`);
		ns.print(`${colors["white"] + "Max Money: " + colors["green"] + "$" + maxMoney.toLocaleString()}`);
		ns.print(`${colors["white"] + "Available Money: " + colors["green"] + "$" + availableMoney.toLocaleString()}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Min Security Level: " + colors["green"] + minSecurityLevel}`);
		ns.print(`${colors["white"] + "Security Level: " + colors["green"] + securityLevel}`);

		await ns.sleep(1);
	}
}