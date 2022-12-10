/*
    Processes instructions sent from other hardware
	RAM Cost: 1.60GB
*/

import {portMap,colors} from "./HackOS/Bus.js";
import {Packet} from "./HackOS/Packet.js";
import {Data} from "./HackOS/Data.js";

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

    let newPacket = new Packet("SCAN_DEEP", "CPU", "NET", null);
    await Send(ns, newPacket);
    newPacket = new Packet("RETURN_BASE", "CPU", "NET", null);
    await Send(ns, newPacket);
    newPacket = new Packet("RETURN_BASE_WITH_MONEY", "CPU", "NET", null);
    await Send(ns, newPacket);
    newPacket = new Packet("RETURN_BASE_WITH_RAM", "CPU", "NET", null);
    await Send(ns, newPacket);
    
    while (true)
    {
        ns.clearLog();
        ns.print("Waiting for instructions...");

        let packet = await CheckReceived(ns);
        if (packet != null)
        {
            if (packet.Request == "RETURN_BASE" ||
                packet.Request == "RETURN_BASE_WITH_MONEY" ||
                packet.Request == "RETURN_BASE_WITH_RAM")
            {
                let newPacket = new Packet("STORE", "CPU", "RAM", packet.Data);
                await Send(ns, newPacket);
            }
        }

		await ns.sleep(100);
    }
}

async function CheckReceived(ns)
{
    let portNum = portMap["CPU IN"];
    if (portNum != null)
    {
        let port = ns.getPortHandle(portNum);
        if (!port.empty())
        {
			let objectString = port.read();
            let object = JSON.parse(objectString);
            let packet = Object.assign(Packet.prototype, object);

            ns.print(`${colors["white"] + "- Received " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                " Packet from " + colors["yellow"] + packet.Source + colors["white"] + "."}`);

            return packet;
        }
    }

	return null;
}

async function Send(ns, packet)
{
    let portNum = portMap["CPU OUT"];
    if (portNum != null)
    {
        let outputPort = ns.getPortHandle(portNum);
        let packetData = JSON.stringify(packet);

		if (outputPort.tryWrite(packetData))
        {
            ns.print(`${colors["white"] + "- Sent " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                " Packet to " + colors["yellow"] + packet.Destination + colors["white"] + "."}`);
            return true;
        }
		else
		{
            ns.print(`${colors["red"] + "- Failed to Send " + colors["green"] + "'" + packet.Request + "'" + colors["red"] + 
                " Packet to " + colors["yellow"] + packet.Destination + colors["red"] + "."}`);
		}
    }
    
    return false;
}