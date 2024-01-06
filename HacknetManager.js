/*
	Automates purchasing of Hacknet Nodes
	RAM Cost: 6.10GB
*/

let money = 0;
let nodesMax = 0;
let owned = 0;
let nextNodeCost = 0;

let minLevel = 200;
let maxLevel = 0;

let minRam = 64;
let maxRam = 0;

let minCores = 16;
let maxCores = 0;

let nodesAtMinLevel = 0;
let nodesAtMaxLevel = 0;
let nodesAtMinRam = 0;
let nodesAtMaxRam = 0;
let nodesAtMinCores = 0;
let nodesAtMaxCores = 0;

let nextLevelCost = Number.MAX_SAFE_INTEGER;
let nextRamCost = Number.MAX_SAFE_INTEGER;
let nextCoreCost = Number.MAX_SAFE_INTEGER;

const colors = 
{
	red: "\u001b[31;1m",
	green: "\u001b[32;1m",
	yellow: "\u001b[33;1m",
	white: "\u001b[37;1m",
	reset: "\u001b[0m"
};

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	while (true)
	{
		ns.resizeTail(440, 420);

		await Update(ns);

		ns.clearLog();
		await Log(ns);
		await ns.sleep(1);
	}
}

async function Update(ns)
{
	money = ns.getServerMoneyAvailable("home");
	nodesMax = ns.hacknet.maxNumNodes();
	owned = ns.hacknet.numNodes();
	nextNodeCost = ns.hacknet.getPurchaseNodeCost();

	minLevel = 200;
	maxLevel = 0;

	minRam = 64;
	maxRam = 0;

	minCores = 16;
	maxCores = 0;

	nextLevelCost = Number.MAX_SAFE_INTEGER;
	nextRamCost = Number.MAX_SAFE_INTEGER;
	nextCoreCost = Number.MAX_SAFE_INTEGER;

	if (owned < nodesMax &&
			money >= nextNodeCost)
	{
		ns.hacknet.purchaseNode();
	}

	for (let i = 0; i < owned; i++)
	{
		money = ns.getPlayer().money;
		let node = ns.hacknet.getNodeStats(i);

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

	nodesAtMinLevel = 0;
	nodesAtMaxLevel = 0;
	nodesAtMinRam = 0;
	nodesAtMaxRam = 0;
	nodesAtMinCores = 0;
	nodesAtMaxCores = 0;

	for (let i = 0; i < owned; i++)
	{
		let node = ns.hacknet.getNodeStats(i);

		if (node.level == maxLevel)
		{
			nodesAtMaxLevel++;
		}
		else if (node.level == minLevel)
		{
			nodesAtMinLevel++;
		}

		if (node.ram == maxRam)
		{
			nodesAtMaxRam++;
		}
		else if (node.ram == minRam)
		{
			nodesAtMinRam++;
		}

		if (node.cores == maxCores)
		{
			nodesAtMaxCores++;
		}
		else if (node.cores == minCores)
		{
			nodesAtMinCores++;
		}
	}

	if (nextLevelCost == Number.MAX_SAFE_INTEGER)
	{
		nextLevelCost = 0;
	}
	if (nextRamCost == Number.MAX_SAFE_INTEGER)
	{
		nextRamCost = 0;
	}
	if (nextCoreCost == Number.MAX_SAFE_INTEGER)
	{
		nextCoreCost = 0;
	}
}

async function Log(ns)
{
	ns.print(`${colors["white"] + "Current Money: " + colors["green"] + "$" + money.toLocaleString()}`);
	ns.print("\n");
	ns.print(`${colors["white"] + "Nodes Owned: " + owned}`);
	ns.print(`${colors["white"] + "Next Node Cost: " + colors["green"] + "$" + nextNodeCost.toLocaleString()}`);
	ns.print("\n");
	ns.print(`${colors["yellow"] + "Node Levels"}`);
	ns.print(`${colors["white"] + "Lowest(" + nodesAtMinLevel + "): " + minLevel + ", Highest(" + nodesAtMaxLevel 
		+ "): " + maxLevel + ", Max: 200"}`);
	ns.print(`${colors["white"] + "Next Cost: " + colors["green"] + "$" + nextLevelCost.toLocaleString()}`);
	ns.print("\n");
	ns.print(`${colors["yellow"] + "Node Ram"}`);
	ns.print(`${colors["white"] + "Lowest(" + nodesAtMinRam + "): " + minRam + ", Highest(" + nodesAtMaxRam 
		+ "): " + maxRam + ", Max: 64"}`);
	ns.print(`${colors["white"] + "Next Cost: " + colors["green"] + "$" + nextRamCost.toLocaleString()}`);
	ns.print("\n");
	ns.print(`${colors["yellow"] + "Node Cores"}`);
	ns.print(`${colors["white"] + "Lowest(" + nodesAtMinCores + "): " + minCores + ", Highest(" + nodesAtMaxCores 
		+ "): " + maxCores + ", Max: 16"}`);
	ns.print(`${colors["white"] + "Next Cost: " + colors["green"] + "$" + nextCoreCost.toLocaleString()}`);
}