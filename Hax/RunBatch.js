/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	let server = ns.getHostname();

	let batchStr = ns.args[0];
	let batch = JSON.parse(batchStr);

	let target = batch.Target;
	let growThreads = batch.GrowThreads;
	let hackDelay = batch.HackDelay;
	let hackThreads = batch.HackThreads;
	let weakenDelay = batch.WeakenDelay;
	let weakenThreads = batch.WeakenThreads;

	ns.clearLog();
	ns.print("Target: " + target);
	ns.print("GrowThreads: " + growThreads);
	ns.print("HackDelay: " + hackDelay);
	ns.print("HackThreads: " + hackThreads);
	ns.print("WeakenDelay: " + weakenDelay);
	ns.print("Weaken Threads: " + weakenThreads);
	ns.print("\n");

	let growRamCost = ns.getScriptRam("/Hax/Grow.js") * growThreads;
	let hackRamCost = ns.getScriptRam("/Hax/Hack.js") * hackThreads;
	let weakenRamCost = ns.getScriptRam("/Hax/Weaken.js") * weakenThreads;

	if (growThreads > 0 &&
		(ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) >= growRamCost &&
		!ns.isRunning("/Hax/Grow.js", server, growThreads, target))
	{
		ns.exec("/Hax/Grow.js", server, growThreads, target);
		ns.print("Ran Grow.js");
	}
	
	if (hackThreads > 0 &&
		(ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) >= hackRamCost &&
		!ns.isRunning("/Hax/Hack.js", server, hackThreads, target, hackDelay))
	{
		ns.exec("/Hax/Hack.js", server, hackThreads, target, hackDelay);
		ns.print("Ran Hack.js");
	}
	
	if (weakenThreads > 0 &&
		(ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) >= weakenRamCost &&
		!ns.isRunning("/Hax/Weaken.js", server, weakenThreads, target, weakenDelay))
	{
		ns.exec("/Hax/Weaken.js", server, weakenThreads, target, weakenDelay);
		ns.print("Ran Weaken.js");
	}
}