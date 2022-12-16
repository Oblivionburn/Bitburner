import {colors} from "./Hax/Paint.js";

/** @param {NS} ns */
export async function main(ns)
{
	ns.exec("/Hax/HacknetManager.js", "home");
	ns.exec("/Hax/Databasing.js", "home");
	ns.exec("/Hax/Networking.js", "home");
	ns.exec("/Hax/ServerManager.js", "home");
	ns.exec("/Hax/Distributor.js", "home");
	ns.exec("/Hax/Scheduler.js", "home");

	ns.tprint(`${colors["white"] + "Hax has started."}`);
}