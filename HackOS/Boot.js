/*
	Starts running all hardware
	RAM Cost: 2.90GB
*/

/** @param {NS} ns */
export async function main(ns)
{
	ns.exec("/HackOS/Bus.js", "home");
	ns.exec("/HackOS/RAM.js", "home");
}