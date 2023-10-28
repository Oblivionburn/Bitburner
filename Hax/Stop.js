import * as IO from "./Hax/IO.js";
import {colors} from "./Hax/UI.js";

let base_servers = [];
let purchased_servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	let scripts = ["/Hax/Grow.js", "/Hax/Hack.js", "/Hax/Weaken.js", "/Hax/RunBatch.js"];

	let base_servers_object = await IO.Read(ns, "base_servers");
	if (base_servers_object != null)
	{
		base_servers = base_servers_object.List;

		for (let i = 0; i < base_servers.length; i++)
		{
			let server = base_servers[i];

			for (let s = 0; s < scripts.length; s++)
			{
				RemoveScript(ns, scripts[s], server);
			}
		}
	}

	let purchased_servers_object = await IO.Read(ns, "purchased_servers");
	if (purchased_servers_object != null)
	{
		purchased_servers = purchased_servers_object.List;

		for (let i = 0; i < purchased_servers.length; i++)
		{
			let server = purchased_servers[i];
			if (ns.serverExists(server))
			{
				for (let s = 0; s < scripts.length; s++)
				{
					RemoveScript(ns, scripts[s], server);
				}
			}
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

	let serverManager = ns.getRunningScript("/Hax/ServerManager.js", "home");
	if (serverManager != null)
	{
		ns.closeTail(serverManager.pid);
		ns.scriptKill("/Hax/ServerManager.js", "home");
	}

	let targeting = ns.getRunningScript("/Hax/Targeting.js", "home");
	if (targeting != null)
	{
		ns.closeTail(targeting.pid);
		ns.scriptKill("/Hax/Targeting.js", "home");
	}
	
	let networking = ns.getRunningScript("/Hax/Networking.js", "home");
	if (networking != null)
	{
		ns.closeTail(networking.pid);
		ns.scriptKill("/Hax/Networking.js", "home");
	}

	let index = await IO.Read(ns, "Index");
	if (index != null)
	{
		for (let i = 0; i < index.length; i++)
		{
			let fileName = index[i];
			if (ns.fileExists(fileName))
			{
				ns.rm(fileName);
			}
		}

		let indexFile = "/Hax/Index.txt";
		if (ns.fileExists(indexFile))
		{
			ns.rm(indexFile);
		}
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