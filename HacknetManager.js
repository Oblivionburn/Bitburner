/*
	Automates purchasing of Hacknet Nodes
	RAM Cost: 6.10GB
*/

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

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

		var money = ns.getPlayer().money;
		var nodesMax = ns.hacknet.maxNumNodes();
		var owned = ns.hacknet.numNodes();
		var nextNodeCost = ns.hacknet.getPurchaseNodeCost();

		ns.print(`${colors["white"] + "Current Money: " + colors["green"] + "$" + money.toLocaleString()}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Nodes Owned: " + owned}`);
		ns.print(`${colors["white"] + "Next Node Cost: " + colors["green"] + "$" + nextNodeCost.toLocaleString()}`);
		ns.print("\n");

		if (owned < nodesMax &&
			money >= nextNodeCost)
		{
			ns.hacknet.purchaseNode();
		}

		var minLevel = 200;
		var maxLevel = 0;

		var minRam = 64;
		var maxRam = 0;

		var minCores = 16;
		var maxCores = 0;

		var nextLevelCost = Number.MAX_SAFE_INTEGER;
		var nextRamCost = Number.MAX_SAFE_INTEGER;
		var nextCoreCost = Number.MAX_SAFE_INTEGER;

		for (let i = 0; i < owned; i++)
		{
			money = ns.getPlayer().money;
			var node = ns.hacknet.getNodeStats(i);

			if (node.level < minLevel)
			{
				minLevel = node.level;
			}
			if (node.level > maxLevel)
			{
				maxLevel = node.level;
			}

			if (node.ram < minRam)
			{
				minRam = node.ram;
			}
			if (node.ram > maxRam)
			{
				maxRam = node.ram;
			}

			if (node.cores < minCores)
			{
				minCores = node.cores;
			}
			if (node.cores > maxCores)
			{
				maxCores = node.cores;
			}

			var levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
			if (levelCost < nextLevelCost)
			{
				nextLevelCost = levelCost;
			}

			var ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
			if (ramCost < nextRamCost)
			{
				nextRamCost = ramCost;
			}

			var coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
			if (coreCost < nextCoreCost)
			{
				nextCoreCost = coreCost;
			}

			if (node.level < 200 &&
				money >= levelCost)
			{
				ns.hacknet.upgradeLevel(i, 1);
			}
			else if (node.ram < 64 &&
					 money >= ramCost)
			{
				ns.hacknet.upgradeRam(i, 1);
			}
			else if (node.cores < 16 &&
					 money >= coreCost)
			{
				ns.hacknet.upgradeCore(i, 1);
			}
		}

		ns.print(`${colors["yellow"] + "Node Levels"}`);
		ns.print(`${colors["white"] + "Lowest: " + minLevel + ", Highest: " + maxLevel + ", Max: 200"}`);
		ns.print(`${colors["white"] + "Next Cost: " + colors["green"] + "$" + nextLevelCost.toLocaleString()}`);
		ns.print("\n");
		ns.print(`${colors["yellow"] + "Node Ram"}`);
		ns.print(`${colors["white"] + "Lowest: " + minRam + ", Highest: " + maxRam + ", Max: 64"}`);
		ns.print(`${colors["white"] + "Next Cost: " + colors["green"] + "$" + nextRamCost.toLocaleString()}`);
		ns.print("\n");
		ns.print(`${colors["yellow"] + "Node Cores"}`);
		ns.print(`${colors["white"] + "Lowest: " + minCores + ", Highest: " + maxCores + ", Max: 16"}`);
		ns.print(`${colors["white"] + "Next Cost: " + colors["green"] + "$" + nextCoreCost.toLocaleString()}`);
		await ns.sleep(1000);
	}
}