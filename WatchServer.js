/*
	Observe changes in server stats
	RAM Cost: 2.25GB
*/

/** @param {NS} ns */
export async function main(ns)
{
	var server = ns.args[0];

	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home", server);
	
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
		var maxRam = ns.getServerMaxRam(server);
		var usedRam = ns.getServerUsedRam(server);
		var availableRam = maxRam - usedRam;
		var hackLevel = ns.getHackingLevel();
		var requiredHack = ns.getServerRequiredHackingLevel(server);

		ns.print(`${colors["yellow"] + server}`);
		ns.print(`${colors["white"] + "Max Money: " + colors["green"] + "$" + maxMoney.toLocaleString()}`);
		ns.print(`${colors["white"] + "Available Money: " + colors["green"] + "$" + availableMoney.toLocaleString()}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Min Security Level: " + colors["green"] + minSecurityLevel.toFixed(2)}`);
		ns.print(`${colors["white"] + "Security Level: " + colors["green"] + securityLevel.toFixed(2)}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Max Ram: " + colors["green"] + maxRam.toFixed(2) + " GB"}`);
		ns.print(`${colors["white"] + "Used Ram: " + colors["green"] + usedRam.toFixed(2) + " GB"}`);
		ns.print(`${colors["white"] + "Available Ram: " + colors["green"] + availableRam.toFixed(2) + " GB"}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Required Hacking Level: " + colors["green"] + requiredHack}`);
		ns.print(`${colors["white"] + "Current Hacking Level: " + colors["green"] + hackLevel}`);
		await ns.sleep(1000);
	}
}