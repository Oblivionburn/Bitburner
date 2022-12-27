import {colors} from "./Hax/UI.js";

/** @param {NS} ns */
export async function main(ns)
{
	ns.exec("/Hax/Databasing.js", "home");
	ns.exec("/Hax/Networking.js", "home");
	ns.exec("/Hax/Targeting.js", "home");
	ns.exec("/Hax/Monitor.js", "home");
	ns.exec("/Hax/ServerManager.js", "home");
	ns.exec("/Hax/Distributing.js", "home");
	ns.exec("/Hax/Batching.js", "home");

	ns.tprint(`${colors["white"] + "Hax has started."}`);
}