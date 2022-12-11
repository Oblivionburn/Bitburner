/*
    Queues and routes packets being sent between hardware
    RAM Cost: 1.60GB
*/

import {Packet} from "./HackOS/Packet.js";
import {colors} from "./HackOS/UI.js";

export const portMap = 
{
    "Void":     0,
    "CPU IN":   1,
    "GPU IN":   2,
    "NET IN":   3,
    "RAM IN":   4,
    "BANK IN":  5,
    "CPU OUT":  6,
    "GPU OUT":  7,
    "NET OUT":  8,
    "RAM OUT":  9,
    "BANK OUT": 10,
    "OS OUT":   11,
};

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");

    while (true)
    {
        ns.clearLog();

        for (let i = 6; i <= 11; i++)
        {
            let outPort = ns.getPortHandle(i);
            while (!outPort.empty())
            {
                let objectString = outPort.read();
                let object = JSON.parse(objectString);
                let packet = Object.assign(Packet.prototype, object);

                let portNum = portMap[packet.Destination + " IN"];
                if (portNum != null)
                {
                    let inPort = ns.getPortHandle(portNum);
                    if (inPort.tryWrite(objectString))
                    {
                        ns.print(`${colors["white"] + "- Routing " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                            " Packet from " + colors["yellow"] + packet.Source + colors["white"] + " to " + colors["yellow"] + 
                            packet.Destination + colors["white"] + "."}`);
                    }
                }
            }
        }

        await ns.sleep(1);
    }
}

export async function CheckReceived(ns, portName)
{
    let portNum = portMap[portName];
    if (portNum != null)
    {
        let inPort = ns.getPortHandle(portNum);
        if (!inPort.empty())
        {
			let objectString = inPort.read();
            let object = JSON.parse(objectString);
            let packet = Object.assign(Packet.prototype, object);

            ns.print(`${colors["white"] + "- Received " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                " Packet from " + colors["yellow"] + packet.Source + colors["white"] + "."}`);

            return packet;
        }
    }

	return null;
}

export async function Send(ns, packet, portName)
{
    let portNum = portMap[portName];
    if (portNum != null)
    {
        let outPort = ns.getPortHandle(portNum);
        let packetData = JSON.stringify(packet);

		if (outPort.tryWrite(packetData))
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