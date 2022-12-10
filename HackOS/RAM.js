/*
    Holds data in memory for other hardware to request
	RAM Cost: 1.60GB
*/

import {Bus} from "./HackOS/Bus.js";
import {Packet} from "./HackOS/Packet.js";
import {Data} from "./HackOS/Data.js";

export var memory = [];

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

    while (true)
    {
        ns.clearLog();
        ns.print("Packets in memory: " + memory.length);

        let packet = CheckReceived(ns);
        if (packet != null)
        {
            if (packet.Request == "SAVE")
            {
                let data = Object.assign(Data.prototype, JSON.parse(packet.Data));
                memory.push(data);
                ns.print("Received '" + data.Name + "' data from " + packet.Source + ".");
            }
			else if (packet.Request == "LOAD")
			{
				let dataObject = Object.assign(Data.prototype, JSON.parse(packet.data));
                ns.print("Received request for '" + dataObject.Name + "' data from " + packet.Source + ".");

				for (let i = 0; i < memory.length; i++)
				{
					let memoryData = Object.assign(Data.prototype, memory[i]);
					if (memoryData.Name == dataObject.Name)
					{
						let newPacket = new Packet("REQUESTED DATA", "RAM", packet.Source, memoryData);
                        if (Send(ns, newPacket))
                        {
                            ns.print("Sent '" + data.Name + "' data to: " + newPacket.Destination);
                        }
                        break;
					}
				}
			}

            await ns.sleep(200);
        }
        else
        {
            await ns.sleep(1);
        }
    }
}

async function CheckReceived(ns)
{
    let portNum = Bus.portMap["RAM IN"];
    if (portNum != null)
    {
        let inputPort = ns.getPortHandle(portNum);
        if (!inputPort.empty())
        {
            let object = JSON.parse(port.read());
            let packet = Object.assign(Packet.prototype, object);
            return packet;
        }
    }
    
    return null;
}

async function Send(ns, packet)
{
    let portNum = Bus.portMap["RAM OUT"];
    if (portNum != null)
    {
        let outputPort = ns.getPortHandle(portNum);
        let packetData = JSON.stringify(packet);
        
        return outputPort.tryWrite(packetData);
    }
    
    return false;
}