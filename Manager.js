import * as ServerUtil from "ServerUtil.js";

let base_servers = [];
let base_servers_with_money = [];
let purchased_servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail("Manager.js", "home");

	//Start hacknet manager to earn money
	ns.exec("HacknetManager.js", "home");

	//Get all the base servers
	base_servers = await ServerUtil.getBaseServers(ns);
	base_servers_with_money = await ServerUtil.getServersWithMoney(ns);

	//Get server limits
	var serverNumLimit = ns.getPurchasedServerLimit();
	var serverRamLimit = ns.getPurchasedServerMaxRam();

	while (true)
	{
		ns.clearLog();

		//Root all the servers
		for (let i = 0; i < base_servers.length; i++)
		{
			ServerUtil.gainRoot(ns, base_servers[i]);
		}

		var maxRam = 0;
		var money = ns.getPlayer().money;
		purchased_servers = ns.getPurchasedServers();

		//Buy more servers
		var serverCost = ns.getPurchasedServerCost(4);
		if (money >= serverCost &&
			purchased_servers.length < serverNumLimit)
		{
			ns.purchaseServer(4);
		}
		
		//Upgrade servers
		for (let i = 0; i < purchased_servers.length; i++)
		{
			money = ns.getPlayer().money;

			var server_name = purchased_servers[i];
			var server = ns.getServer(server_name);

			if (server.ram < serverRamLimit)
			{
				var upgradeCost = ns.getPurchasedServerUpgradeCost(server_name, server.ram * 2);
				if (money >= upgradeCost)
				{
					ns.upgradePurchasedServer(server_name, server.ram * 2)
				}
			}

			if (server.ram > maxRam)
			{
				maxRam = server.ram;
			}
		}

		//Grow base servers with money
		//Weaken base servers with money
		//Hack base servers with money
		
		ns.print("Base Servers: " + base_servers.length);
		ns.print("Base Servers with money: " + base_servers_with_money.length);
		ns.print("Purchased Servers: " + purchased_servers.length);
		ns.print("Purchased Server Number Limit: " + serverNumLimit);
		ns.print("Purchased Server Max Ram: " + maxRam);

		await ns.sleep(1);
	}
}