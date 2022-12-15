import {colors} from "./Hax/Paint.js";

/** @param {NS} ns */
export async function main(ns)
{
	ns.exec("/Hax/HacknetManager.js", "home");
	ns.exec("/Hax/DatabaseManager.js", "home");
	ns.exec("/Hax/NetworkManager.js", "home");
	ns.exec("/Hax/ServerManager.js", "home");
	ns.exec("/Hax/WorkerManager.js", "home");

	ns.tprint(`${colors["white"] + "Hax has started."}`);
}