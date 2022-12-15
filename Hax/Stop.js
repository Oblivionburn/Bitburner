import * as Database from "./Hax/DatabaseManager.js";
import {colors} from "./Hax/Paint.js";

/** @param {NS} ns */
export async function main(ns)
{
	let base_servers = await Database.Select(ns, "base_servers");
	for (let i = 0; i < base_servers.length; i++)
	{
		let server = base_servers[i];
		RemoveScript(ns, "/Hax/Worker.js", server);
	}

	let purchased_servers = await Database.Select(ns, "purchased_servers");
	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		RemoveScript(ns, "/Hax/Worker.js", server);
	}

	let workerManager = ns.getRunningScript("/Hax/WorkerManager.js", "home");
	if (workerManager != null)
	{
		ns.closeTail(workerManager.pid);
		ns.scriptKill("/Hax/WorkerManager.js", "home");
	}

	let serverManager = ns.getRunningScript("/Hax/ServerManager.js", "home");
	if (serverManager != null)
	{
		ns.closeTail(serverManager.pid);
		ns.scriptKill("/Hax/ServerManager.js", "home");
	}
	
	let networkManager = ns.getRunningScript("/Hax/NetworkManager.js", "home");
	if (networkManager != null)
	{
		ns.closeTail(networkManager.pid);
		ns.scriptKill("/Hax/NetworkManager.js", "home");
	}
	
	let database = ns.getRunningScript("/Hax/DatabaseManager.js", "home");
	if (database != null)
	{
		ns.closeTail(database.pid);
		ns.scriptKill("/Hax/DatabaseManager.js", "home");
	}

	let hacknetManager = ns.getRunningScript("/Hax/HacknetManager.js", "home");
	if (hacknetManager != null)
	{
		ns.closeTail(hacknetManager.pid);
		ns.scriptKill("/Hax/HacknetManager.js", "home");
	}

	ns.tprint(`${colors["white"] + "Hax has stopped."}`);
}

async function RemoveScript(ns, script, server)
{
	if (ns.fileExists(script, server))
	{
		ns.scriptKill(script, server);
		ns.rm(script, server);
	}
}