/*
    Holds data in memory for other hardware to request
	RAM Cost: 1.60GB
*/

import * as Bus from "./HackOS/Bus.js";
import {colors} from "./HackOS/UI.js";
import {Packet} from "./HackOS/Packet.js";
import {Data} from "./HackOS/Data.js";

let inPort = "RAM IN";
let outPort = "RAM OUT";

let memory = [];

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    //ns.tail(ns.getScriptName(), "home");
    
    while (true)
    {
        ns.clearLog();

        let packet = await Bus.CheckReceived(ns, inPort);
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

        ns.print("\n");
        await Log(ns);
        
        await ns.sleep(1);
    }
}

async function Log(ns)
{
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
                let memoryData = memory[i];
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
    let found = false;

    for (let i = 0; i < memory.length; i++)
    {
        let memoryData = memory[i];
        if (memoryData.Name == packet.Data.Name)
        {
            found = true;

            packet.Destination = packet.Source;
            packet.Source = "RAM";
            packet.Data = memoryData;
            await Bus.Send(ns, packet, outPort);
            
            break;
        }
    }

    if (!found)
    {
        packet.Request = "RETURN_FAILED";
        packet.Destination = packet.Source;
        packet.Source = "RAM";
        packet.Data = new Data(packet.Data.Name, null);
        await Bus.Send(ns, packet, outPort);
    }
}