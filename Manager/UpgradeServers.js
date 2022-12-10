/*
	UpgradeServers script handles upgrading purchased servers
		by deleting the server and re-purchasing with more RAM.
	RAM Cost: 7.75GB
*/

import * as ServerUtil from "./Manager/ServerUtil.js";

/** @param {NS} ns */
export async function main(ns)
{
	var purchased_servers = await ServerUtil.getBoughtServers(ns);
	var serverRamLimit = ns.getPurchasedServerMaxRam();
	
	for (let i = 0; i < purchased_servers.length; i++)
	{
		var money = ns.getPlayer().money;
		var server_name = purchased_servers[i];
		var serverRam = ns.getServerMaxRam(server_name);
		var nextRam = serverRam * 2;

		if (serverRam < serverRamLimit &&
			nextRam < serverRamLimit)
		{
			var upgradeCost = ns.getPurchasedServerCost(nextRam);
			if (money >= upgradeCost)
			{
				ns.killall(server_name);
				ns.deleteServer(server_name);
				ns.purchaseServer(server_name, nextRam);
			}
		}
	}
}