import * as DB from "./Hax/Databasing.js";
import {colors} from "./Hax/UI.js";

/** @param {NS} ns */
export async function main(ns)
{
	let scripts = ["/Hax/Grow.js", "/Hax/Hack.js", "/Hax/Weaken.js", "/Hax/RunBatch.js"];

	let base_servers = await DB.Select(ns, "base_servers");
	for (let i = 0; i < base_servers.length; i++)
	{
		let server = base_servers[i];

		for (let s = 0; s < scripts.length; s++)
		{
			RemoveScript(ns, scripts[s], server);
		}
	}

	let purchased_servers = await DB.Select(ns, "purchased_servers");
	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		for (let s = 0; s < scripts.length; s++)
		{
			RemoveScript(ns, scripts[s], server);
		}
	}

	let batching = ns.getRunningScript("/Hax/Batching.js", "home");
	if (batching != null)
	{
		ns.closeTail(batching.pid);
		ns.scriptKill("/Hax/Batching.js", "home");
	}

	let distributing = ns.getRunningScript("/Hax/Distributing.js", "home");
	if (distributing != null)
	{
		ns.closeTail(distributing.pid);
		ns.scriptKill("/Hax/Distributing.js", "home");
	}

	let monitor = ns.getRunningScript("/Hax/Monitor.js", "home");
	if (monitor != null)
	{
		ns.closeTail(monitor.pid);
		ns.scriptKill("/Hax/Monitor.js", "home");
	}

	let targeting = ns.getRunningScript("/Hax/Targeting.js", "home");
	if (targeting != null)
	{
		ns.closeTail(targeting.pid);
		ns.scriptKill("/Hax/Targeting.js", "home");
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