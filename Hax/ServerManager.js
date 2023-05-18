import {colors} from "./Hax/UI.js";
import * as DB from "./Hax/Databasing.js";

let money = 0;
let serverRamLimit = 0;
let serverCost = 0;
let serverNumLimit = 0;
let nextCost = 0;
let minPurchasedServerRam = 0;
let maxPurchasedServerRam = 0;
let purchased_servers = [];
let purchasedNum = 0;

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

	serverNumLimit = ns.getPurchasedServerLimit();
    serverCost = ns.getPurchasedServerCost(2);
	serverRamLimit = ns.getPurchasedServerMaxRam();

    while (true)
    {
		ns.resizeTail(440, 160);

		purchased_servers = await DB.Select(ns, "purchased_servers");
		if (purchased_servers != null)
		{
			purchasedNum = purchased_servers.length;

			await UpgradeServers(ns);
			await BuyServer(ns);
		}

        ns.clearLog();
        await Log(ns);
        await ns.sleep(1000);
    }
}

async function Log(ns)
{
    ns.print(`${colors["white"] + "Max Purchased Servers: " + colors["green"] + serverNumLimit}`);
	ns.print(`${colors["white"] + "Purchased Servers: " + colors["green"] + purchasedNum}`);
	ns.print(`${colors["white"] + "Min Purchased Server Ram: " + colors["green"] + minPurchasedServerRam + " GB"}`);
	ns.print(`${colors["white"] + "Max Purchased Server Ram: " + colors["green"] + maxPurchasedServerRam + " GB"}`);
	ns.print(`${colors["white"] + "Buy/Upgrade Server Cost: " + colors["green"] + "$" + nextCost.toLocaleString()}`);
}

async function BuyServer(ns)
{
	money = ns.getServerMoneyAvailable("home");

	if (money >= serverCost &&
		purchasedNum < serverNumLimit)
	{
		let server_name = "PS-" + purchasedNum + "-v1";
		ns.purchaseServer(server_name, 2);
	}
}

async function UpgradeServers(ns)
{
	nextCost = Number.MAX_SAFE_INTEGER;
	minPurchasedServerRam = Number.MAX_SAFE_INTEGER;
	maxPurchasedServerRam = 0;

	for (let i = 0; i < purchasedNum; i++)
	{
		money = ns.getServerMoneyAvailable("home");

		let server_name = purchased_servers[i];
		if (ns.serverExists(server_name))
		{
			let serverRam = ns.getServerMaxRam(server_name);
			let nextRam = serverRam * 2;
			let upgradeCost = ns.getPurchasedServerCost(nextRam);

			let version_index = server_name.indexOf("v");
			let server_subName = server_name.substring(0, version_index);
			let version = server_name.substring(version_index + 1, server_name.length);
			let new_serverName = server_subName + "v" + (Number(version) + 1);

			if (upgradeCost < nextCost)
			{
				nextCost = upgradeCost;
			}

			if (serverRam < minPurchasedServerRam)
			{
				minPurchasedServerRam = serverRam;
			}
			
			if (serverRam > maxPurchasedServerRam)
			{
				maxPurchasedServerRam = serverRam;
			}

			if (serverRam < serverRamLimit &&
				nextRam < serverRamLimit &&
				money >= upgradeCost)
			{
				ns.killall(server_name);
				ns.deleteServer(server_name);
				ns.purchaseServer(new_serverName, nextRam);
			}
		}
	}
	
	if (minPurchasedServerRam == Number.MAX_SAFE_INTEGER)
	{
		minPurchasedServerRam = 0;
	}

	if (nextCost == Number.MAX_SAFE_INTEGER)
	{
		nextCost = serverCost;
	}
}