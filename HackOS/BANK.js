/*
    BANK handles transactions involving money
	RAM Cost: 11.50GB
*/

import * as Bus from "./HackOS/Bus.js";
import {colors} from "./HackOS/UI.js";
import {Packet} from "./HackOS/Packet.js";
import {Data} from "./HackOS/Data.js";

let inPort = "BANK IN";
let outPort = "BANK OUT";

let purchased_servers = [];
let requestedServers = false;
var serverNumLimit = 0;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	serverNumLimit = ns.getPurchasedServerLimit();

	await Init(ns);

    while (true)
    {
		if (!requestedServers)
		{
			requestedServers = await Bus.Send(ns, new Packet("RETURN", "BANK", "RAM", new Data("PURCHASED_SERVERS", null)), outPort);
		}

        let packet = await Bus.CheckReceived(ns, inPort);
        if (packet != null)
        {
            if (packet.Request == "RETURN")
            {
				if (packet.Data.Name == "PURCHASED_SERVERS")
				{
					purchased_servers = packet.Data.List;
					requestedServers = false;
				}
            }
			else if (packet.Request == "RETURN_FAILED")
            {
                if (packet.Data.Name == "PURCHASED_SERVERS")
                {
                    await Bus.Send(ns, new Packet("SCAN_PURCHASED", "BANK", "NET", null), outPort);
                    requestedServers = false;
                }
            }
        }

		await BuyServer(ns);
        
		ns.clearLog();

        await Log(ns);

		await BuyHacknet(ns);
		await ns.sleep(100);
    }
}

async function Init(ns)
{
    await Bus.Send(ns, new Packet("SCAN_PURCHASED", "BANK", "NET", null), outPort);
}

async function Log(ns)
{
	let money = ns.getPlayer().money;
	let minPurchasedServerRam = Number.MAX_SAFE_INTEGER;
	let maxPurchasedServerRam = 0;
	let nextCost = Number.MAX_SAFE_INTEGER;

	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		
		let maxRam = ns.getServerMaxRam(server);
		if (maxRam < minPurchasedServerRam)
		{
			minPurchasedServerRam = maxRam;
		}
		if (maxRam > maxPurchasedServerRam)
		{
			maxPurchasedServerRam = maxRam;
		}

		let serverCost = ns.getPurchasedServerCost(maxRam * 2);
		if (serverCost < nextCost)
		{
			nextCost = serverCost;
		}
	}

	if (minPurchasedServerRam == Number.MAX_SAFE_INTEGER)
	{
		minPurchasedServerRam = 0;
	}
	if (nextCost == Number.MAX_SAFE_INTEGER)
	{
		nextCost = ns.getPurchasedServerCost(2);
	}

	ns.print(`${colors["white"] + "Current Money: " + colors["green"] + "$" + money.toLocaleString()}`);
	ns.print("\n");
    ns.print(`${colors["white"] + "Max Purchased Servers: " + colors["green"] + serverNumLimit}`);
	ns.print(`${colors["white"] + "Purchased Servers: " + colors["green"] + purchased_servers.length}`);
	ns.print(`${colors["white"] + "Buy/Upgrade Server Cost: " + colors["green"] + "$" + nextCost.toLocaleString()}`);
}

async function BuyServer(ns)
{
	let money = ns.getPlayer().money;
	
	let serverCost = ns.getPurchasedServerCost(2);
	if (money >= serverCost &&
		purchased_servers.length < serverNumLimit)
	{
		ns.purchaseServer("PS-" + purchased_servers.length, 2);
	}
	else
	{
		let serverRamLimit = ns.getPurchasedServerMaxRam();
	
		for (let i = 0; i < purchased_servers.length; i++)
		{
			let money = ns.getPlayer().money;
			let server_name = purchased_servers[i];
			let serverRam = ns.getServerMaxRam(server_name);
			let nextRam = serverRam * 2;

			if (serverRam < serverRamLimit &&
				nextRam < serverRamLimit)
			{
				let upgradeCost = ns.getPurchasedServerCost(nextRam);
				if (money >= upgradeCost)
				{
					ns.killall(server_name);
					ns.deleteServer(server_name);
					ns.purchaseServer(server_name, nextRam);
				}
			}
		}
	}
}

async function BuyHacknet(ns)
{
	let money = ns.getPlayer().money;
	let nodesMax = ns.hacknet.maxNumNodes();
	let owned = ns.hacknet.numNodes();
	let nextNodeCost = ns.hacknet.getPurchaseNodeCost();

	if (owned < nodesMax &&
		money >= nextNodeCost)
	{
		ns.hacknet.purchaseNode();
	}

	let minLevel = 200;
	let maxLevel = 0;

	let minRam = 64;
	let maxRam = 0;

	let minCores = 16;
	let maxCores = 0;

	let nextLevelCost = Number.MAX_SAFE_INTEGER;
	let nextRamCost = Number.MAX_SAFE_INTEGER;
	let nextCoreCost = Number.MAX_SAFE_INTEGER;

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

		let levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
		if (levelCost < nextLevelCost)
		{
			nextLevelCost = levelCost;
		}

		let ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
		if (ramCost < nextRamCost)
		{
			nextRamCost = ramCost;
		}

		let coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
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

	ns.print("\n");
	ns.print(`${colors["white"] + "Nodes Owned: " + owned}`);
	ns.print(`${colors["white"] + "Next Node Cost: " + colors["green"] + "$" + nextNodeCost.toLocaleString()}`);
	ns.print("\n");
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
}