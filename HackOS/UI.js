/*
	Interface for manual transmission of messages across the Bus
	RAM Cost: 1.60GB
*/

import {portMap,colors} from "./HackOS/Bus.js";
import {Packet} from "./HackOS/Packet.js";

/** @param {NS} ns */
export async function main(ns)
{
	let component_choices = ["NET", "BANK"];

	let choice = await ns.prompt("Send command to which component?", { type: "select", choices: component_choices});
	if (choice)
	{
		if (choice == "NET")
		{
			let command_choices = ["ROOT_SERVERS", "SCAN_DEEP", "SCAN_ROOTED", "SCAN_PURCHASED", "SCAN_AVAILABLE"];
			let command = await ns.prompt("Send which command?", { type: "select", choices: command_choices});
			await Send(ns, new Packet(command, "UI", choice, null));
		}
		else if (choice == "BANK")
		{
			let command_choices = ["BUY_SERVER", "UPGRADE_SERVERS"];
			let command = await ns.prompt("Which command are you sending?", { type: "select", choices: command_choices});
			await Send(ns, new Packet(command, "UI", choice, null));
		}
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