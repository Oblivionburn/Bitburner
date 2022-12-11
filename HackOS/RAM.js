/*
    Holds data in memory for other hardware to request
	RAM Cost: 1.60GB
*/

import {portMap,colors} from "./HackOS/Bus.js";
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
        ns.print(`${colors["yellow"] + "Data in memory:"}`);
        if (memory.length > 0)
        {
            for (let i = 0; i < memory.length; i++)
            {
                let data = memory[i];
                ns.print(`${colors["white"] + data.Name}`);
            }
        }
        else
        {
            ns.print(`${colors["red"] + "Nothing"}`);
        }
        
        ns.print("\n");

        let packet = await CheckReceived(ns);
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
        }
        
        await ns.sleep(100);
    }
}

async function Store(ns, packet)
{
    if (packet.Data != null)
    {
        if (memory.length > 0)
        {
            let found = false;

            for (let i = 0; i < memory.length; i++)
            {
                let memoryData = Object.assign(Data.prototype, memory[i]);
                if (memoryData.Name == packet.Data.Name)
                {
                    found = true;
                    memory[i] = packet.Data;
                    break;
                }
            }

            if (!found)
            {
                memory.push(packet.Data);
            }
        }
        else
        {
            memory.push(packet.Data);
        }
    }
}

async function Return(ns, packet)
{
    for (let i = 0; i < memory.length; i++)
    {
        let memoryData = memory[i];
        if (memoryData.Name == packet.Data.Name)
        {
            memory.splice(i, 1); 

            packet.Destination = packet.Source;
            packet.Source = "RAM";
            packet.Data = memoryData;
            await Send(ns, packet);

            break;
        }
    }
}

async function CheckReceived(ns)
{
    let portNum = portMap["RAM IN"];
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
    let portNum = portMap["RAM OUT"];
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