/*
    Holds data in memory for other hardware to request
	RAM Cost: 1.60GB
*/

import {portMap} from "./HackOS/Bus.js";
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
            if (packet.Request == "STORE")
            {
                await Store(ns, packet);
            }
			else if (packet.Request == "RETURN")
			{
				await Return(ns, packet);
			}

            await ns.sleep(200);
        }
        else
        {
            await ns.sleep(1);
        }
    }
}

async function Store(ns, packet)
{
    let data = Object.assign(Data.prototype, JSON.parse(packet.Data));

    if (memory.length > 0)
    {
        let found = false;

        for (let i = 0; i < memory.length; i++)
        {
            let memoryData = Object.assign(Data.prototype, memory[i]);
            if (memoryData.Name == data.Name)
            {
                found = true;
                memory[i] = data;
                break;
            }
        }

        if (!found)
        {
            memory.push(data);
        }
    }
    else
    {
        memory.push(data);
    }
    
    ns.print("Received '" + data.Name + "' data from " + packet.Source + ".");
}

async function Return(ns, packet)
{
    let dataObject = Object.assign(Data.prototype, JSON.parse(packet.data));
    ns.print("Received request for '" + dataObject.Name + "' data from " + packet.Source + ".");

    for (let i = 0; i < memory.length; i++)
    {
        let memoryData = Object.assign(Data.prototype, memory[i]);
        if (memoryData.Name == dataObject.Name)
        {
            memory.splice(i, 1); 
            let newPacket = new Packet("REQUESTED DATA", "RAM", packet.Source, memoryData);
            await Send(ns, newPacket);
            break;
        }
    }
}

async function CheckReceived(ns)
{
    let portNum = portMap["RAM IN"];
    if (portNum != null)
    {
        ns.print("Listening for incoming packets on port " + portNum + "...");

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
    let portNum = portMap["RAM OUT"];
    if (portNum != null)
    {
        let outputPort = ns.getPortHandle(portNum);
        let packetData = JSON.stringify(packet);
        
        if (outputPort.tryWrite(packetData))
        {
            ns.print("Sent '" + packet.Data.Name + "' data to: " + packet.Destination);
            return true;
        }
    }
    
    return false;
}