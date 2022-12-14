/*
	Manager script is in charge of distributing scripts to
		all the other servers and executing them
		
	RAM Cost: 4.05GB
*/

import * as ServerUtil from "./Manager/ServerUtil.js";

/** @param {NS} ns */
export async function main(ns)
{
	let base_servers = await ServerUtil.getBaseServers(ns);
	for (let i = 0; i < base_servers.length; i++)
	{
		let server = base_servers[i];
		removeScript(ns, "/Manager/Weaken.js", server);
		removeScript(ns, "/Manager/Grow.js", server);
		removeScript(ns, "/Manager/Hack.js", server);
	}

	let purchased_servers = await ServerUtil.getBoughtServers(ns);
	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		removeScript(ns, "/Manager/Weaken.js", server);
		removeScript(ns, "/Manager/Grow.js", server);
		removeScript(ns, "/Manager/Hack.js", server);
	}
}

export async function removeScript(ns, script, server)
{
	if (ns.fileExists(script, server))
	{
		ns.scriptKill(script, server);
		ns.rm(script, server);
	}
}