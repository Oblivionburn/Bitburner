/*
	Interface for Hack OS
	RAM Cost: 5.00GB
*/

import {portMap,colors} from "./HackOS/Bus.js";
import {GetBaseServers,GetPurchasedServers} from "./HackOS/NET.js";
import {Packet} from "./HackOS/Packet.js";

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
				await Send(ns, new Packet(command, "UI", choice, null));
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
}

async function ShutDown(ns)
{
	ns.scriptKill("/HackOS/CPU.js", "home");
	ns.scriptKill("/HackOS/BANK.js", "home");
	ns.scriptKill("/HackOS/NET.js", "home");
	ns.scriptKill("/HackOS/RAM.js", "home");
	ns.scriptKill("/HackOS/Bus.js", "home");

	let base_servers = await GetBaseServers();
	for (let i = 0; i < base_servers.length; i++)
	{
		let server = base_servers[i];
		RemoveScript(ns, "/HackOS/Weaken.js", server);
		RemoveScript(ns, "/HackOS/Grow.js", server);
		RemoveScript(ns, "/HackOS/Hack.js", server);
	}

	let purchased_servers = await GetPurchasedServers();
	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		RemoveScript(ns, "/HackOS/Weaken.js", server);
		RemoveScript(ns, "/HackOS/Grow.js", server);
		RemoveScript(ns, "/HackOS/Hack.js", server);
	}
}

async function RemoveScript(ns, script, server)
{
	if (ns.fileExists(script, server))
	{
		ns.scriptKill(script, server);
		ns.rm(script, server);
	}
}

async function Send(ns, packet)
{
    let portNum = portMap["UI OUT"];
    if (portNum != null)
    {
        let outputPort = ns.getPortHandle(portNum);
        let packetData = JSON.stringify(packet);

		if (outputPort.tryWrite(packetData))
        {
            ns.tprint(`${colors["white"] + "- Sent " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                " Packet to " + colors["yellow"] + packet.Destination + colors["white"] + "."}`);
            return true;
        }
		else
		{
            ns.tprint(`${colors["red"] + "- Failed to Send " + colors["green"] + "'" + packet.Request + "'" + colors["red"] + 
                " Packet to " + colors["yellow"] + packet.Destination + colors["red"] + "."}`);
		}
    }
    
    return false;
}