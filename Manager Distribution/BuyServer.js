/*
	BuyServer script handles purchasing new servers
	Naming convention: PS-0, PS-1, PS-2, etc
	RAM Cost: 5.00GB
*/

import * as ServerUtil from "ServerUtil.js";

/** @param {NS} ns */
export async function main(ns)
{
	var purchased_servers = await ServerUtil.getBoughtServers(ns);
	var money = ns.getPlayer().money;
	var serverNumLimit = ns.getPurchasedServerLimit();
	
	var serverCost = ns.getPurchasedServerCost(2);
	if (money >= serverCost &&
		purchased_servers.length < serverNumLimit)
	{
		ns.purchaseServer("PS-" + purchased_servers.length, 2);
	}
}