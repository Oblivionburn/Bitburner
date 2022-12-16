import * as DB from "./Hax/Databasing.js";
import {colors} from "./Hax/Paint.js";

/** @param {NS} ns */
export async function main(ns)
{
	let base_servers = await DB.Select(ns, "base_servers");
	for (let i = 0; i < base_servers.length; i++)
	{
		let server = base_servers[i];
		RemoveScript(ns, "/Hax/Grow.js", server);
		RemoveScript(ns, "/Hax/Hack.js", server);
		RemoveScript(ns, "/Hax/Weaken.js", server);
		RemoveScript(ns, "/Hax/RunBatch.js", server);
	}

	let purchased_servers = await DB.Select(ns, "purchased_servers");
	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		RemoveScript(ns, "/Hax/Grow.js", server);
		RemoveScript(ns, "/Hax/Hack.js", server);
		RemoveScript(ns, "/Hax/Weaken.js", server);
		RemoveScript(ns, "/Hax/RunBatch.js", server);
	}

	let distributor = ns.getRunningScript("/Hax/Distributor.js", "home");
	if (distributor != null)
	{
		ns.closeTail(distributor.pid);
		ns.scriptKill("/Hax/Distributor.js", "home");
	}

	let scheduler = ns.getRunningScript("/Hax/Scheduler.js", "home");
	if (scheduler != null)
	{
		ns.closeTail(scheduler.pid);
		ns.scriptKill("/Hax/Scheduler.js", "home");
	}

	let serverManager = ns.getRunningScript("/Hax/ServerManager.js", "home");
	if (serverManager != null)
	{
		ns.closeTail(serverManager.pid);
		ns.scriptKill("/Hax/ServerManager.js", "home");
	}
	
	let networking = ns.getRunningScript("/Hax/Networking.js", "home");
	if (networking != null)
	{
		ns.closeTail(networking.pid);
		ns.scriptKill("/Hax/Networking.js", "home");
	}
	
	let databasing = ns.getRunningScript("/Hax/Databasing.js", "home");
	if (databasing != null)
	{
		ns.closeTail(databasing.pid);
		ns.scriptKill("/Hax/Databasing.js", "home");
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