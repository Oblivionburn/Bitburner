import * as ServerUtil from "ServerUtil.js";

let base_servers = [];
let base_servers_with_money = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.clearLog();
	ns.tail("Manager.js", "home");

	//Get all the base servers
	base_servers = await ServerUtil.getBaseServers(ns);
	base_servers_with_money = await ServerUtil.getServersWithMoney(ns);

	var serverNumLimit = ns.getPurchasedServerLimit();
	var serverRamLimit = ns.getPurchasedServerMaxRam();
	ns.print("Base Servers: " + base_servers.length);
	ns.print("Base Servers with money: " + base_servers_with_money.length);
	ns.print("Purchased Server Number Limit: " + serverNumLimit);
	ns.print("Purchased Server Ram Limit: " + serverRamLimit);
}