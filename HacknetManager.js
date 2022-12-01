/*
	Automates purchasing of Hacknet Nodes
*/

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail("HacknetManager.js", "home");

	while (true)
	{
		ns.clearLog();

		var money = ns.getPlayer().money;
		var nodesMax = ns.hacknet.maxNumNodes();
		var owned = ns.hacknet.numNodes();
		var nextNodeCost = ns.hacknet.getPurchaseNodeCost();

		ns.print("Current Money: $" + money.toFixed(2));
		ns.print("Nodes Owned: " + owned);
		ns.print("Next Node Cost: " + nextNodeCost.toFixed(2));

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

		var nextLevelCost = 0;
		var nextRamCost = 0;
		var nextCoreCost = 0;

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
			if (nextLevelCost < levelCost)
			{
				nextLevelCost = levelCost;
			}

			var ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
			if (nextRamCost < ramCost)
			{
				nextRamCost = ramCost;
			}

			var coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
			if (nextCoreCost < coreCost)
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

		ns.print("Node Levels = Min: " + minLevel + ", Max:" + maxLevel + ", Next Cost: " + nextLevelCost.toFixed(2));
		ns.print("Node Ram = Min: " + minRam + ", Max: " + maxRam + ", Next Cost: " + nextRamCost.toFixed(2));
		ns.print("Node Cores = Min: " + minCores + ", Max: " + maxCores + ", Next Cost: " + nextCoreCost.toFixed(2));

		await ns.sleep(1);
	}
}