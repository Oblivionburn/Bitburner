/*
	Interface for Hack OS
	RAM Cost: 5.00GB
*/

import * as Bus from "./HackOS/Bus.js";
import {colors} from "./HackOS/UI.js";
import * as NET from "./HackOS/NET.js";
import {Packet} from "./HackOS/Packet.js";

let base_servers = [];
let purchased_servers = [];
let outPort = "OS OUT";

/** @param {NS} ns */
export async function main(ns)
{
	let menu_choices = ["Boot", "Send Command", "Shut Down"];
	let menu = await ns.prompt("What would you like to do?", { type: "select", choices: menu_choices});

	if (menu == "Boot")
	{
		await Boot(ns);
	}
	else if (menu == "Send Command")
	{
		let component_choices = ["NET", "BANK"];
		let choice = await ns.prompt("Send command to which component?", { type: "select", choices: component_choices});
		if (choice)
		{
			let command = "";

			if (choice == "NET")
			{
				let command_choices = ["ROOT_SERVERS", "SCAN_DEEP", "SCAN_ROOTED", "SCAN_PURCHASED", "SCAN_AVAILABLE"];
				command = await ns.prompt("Send which command?", { type: "select", choices: command_choices});
			}
			else if (choice == "BANK")
			{
				let command_choices = ["BUY_SERVER", "UPGRADE_SERVERS"];
				command = await ns.prompt("Which command are you sending?", { type: "select", choices: command_choices});
			}

			if (command)
			{
				await Bus.Send(ns, new Packet(command, "UI", choice, null), outPort);
				ns.tprint(`${colors["white"] + "- Sent " + colors["green"] + "'" + command + "'" + colors["white"] + 
                	" Packet to " + colors["yellow"] + choice + colors["white"] + "."}`);
			}
		}
	}
	else if (menu == "Shut Down")
	{
		await ShutDown(ns);
	}
}

async function Boot(ns)
{
	ns.exec("/HackOS/Bus.js", "home");
	ns.exec("/HackOS/RAM.js", "home");
	ns.exec("/HackOS/NET.js", "home");
	ns.exec("/HackOS/BANK.js", "home");
	ns.exec("/HackOS/CPU.js", "home");

	ns.tprint(`${colors["white"] + "HackOS has booted."}`);
}

async function ShutDown(ns)
{
	await DeepScan(ns);
	for (let i = 0; i < base_servers.length; i++)
	{
		let server = base_servers[i];
		RemoveScript(ns, "/HackOS/Weaken.js", server);
		RemoveScript(ns, "/HackOS/Grow.js", server);
		RemoveScript(ns, "/HackOS/Hack.js", server);
	}

	await Scan_PurchasedServers(ns);
	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		RemoveScript(ns, "/HackOS/Weaken.js", server);
		RemoveScript(ns, "/HackOS/Grow.js", server);
		RemoveScript(ns, "/HackOS/Hack.js", server);
	}

	if (base_servers.length > 0 ||
		purchased_servers.length > 0)
	{
		let cpu = ns.getRunningScript("/HackOS/CPU.js", "home");
		if (cpu != null)
		{
			ns.closeTail(cpu.pid);
			ns.scriptKill("/HackOS/CPU.js", "home");
		}

		let bank = ns.getRunningScript("/HackOS/BANK.js", "home");
		if (bank != null)
		{
			ns.closeTail(bank.pid);
			ns.scriptKill("/HackOS/BANK.js", "home");
		}
		
		let net = ns.getRunningScript("/HackOS/NET.js", "home");
		if (net != null)
		{
			ns.closeTail(net.pid);
			ns.scriptKill("/HackOS/NET.js", "home");
		}
		
		let ram = ns.getRunningScript("/HackOS/RAM.js", "home");
		if (ram != null)
		{
			ns.closeTail(ram.pid);
			ns.scriptKill("/HackOS/RAM.js", "home");
		}

		let bus = ns.getRunningScript("/HackOS/Bus.js", "home");
		if (bus != null)
		{
			ns.closeTail(bus.pid);
			ns.scriptKill("/HackOS/Bus.js", "home");
		}
	}

	ns.tprint(`${colors["white"] + "HackOS has shut down."}`);
}

async function RemoveScript(ns, script, server)
{
	if (ns.fileExists(script, server))
	{
		ns.scriptKill(script, server);
		ns.rm(script, server);
	}
}

async function DeepScan(ns, server)
{
	let scan_results = ns.scan(server);
	if (scan_results.length > 0)
	{
		for (let i = 0; i < scan_results.length; i++)
		{
			let server = scan_results[i];

			if (server != "home" &&
				!server.includes("PS-") &&
				!base_servers.includes(server))
			{
				base_servers.push(server);
				await DeepScan(ns, server);
			}
		}
	}
}

async function Scan_PurchasedServers(ns)
{
	let scan_results = ns.scan("home");
	let scanCount = scan_results.length;
	if (scanCount > 0)
	{
		for (let i = 0; i < scanCount; i++)
		{
			let server = scan_results[i];

			if (server.includes("PS-") &&
				!purchased_servers.includes(server))
			{
				purchased_servers.push(server);
			}
		}
	}
}