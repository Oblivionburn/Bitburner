/*
    Queues and routes packets being sent between hardware
    RAM Cost: 1.60GB
*/

import {Packet} from "./HackOS/Packet.js";

let queue = [];

export const portMap = 
{
    "Void":    0,
    "CPU IN":  1,
    "GPU IN":  2,
    "NET IN":  3,
    "RAM IN":  4,
    "CPU OUT": 5,
    "GPU OUT": 6,
    "NET OUT": 7,
    "RAM OUT": 8
};

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

    while (true)
    {
        ns.clearLog();

        if (queue.length > 0)
        {
            ns.print("Packets in queue: " + queue.length);
            await Push(ns);
            await ns.sleep(200);
        }
        else
        {
            ns.print("Listening for incoming packets...");
            await Pull(ns);
            await ns.sleep(1);
        }
    }
}

async function Pull(ns)
{
    //Scan all the OUT ports for packets
    for (let i = 5; i <= 8; i++)
    {
        let port = ns.getPortHandle(i);
        if (!port.empty())
        {
            let packet = JSON.parse(port.read());
            packet = Object.assign(Packet.prototype, packet);
            ns.print("'" + packet.Request + "' Packet receieved from: " + packet.Source);
            queue.push(packet);
        }
    }
}

async function Push(ns)
{
    if (queue.length > 0)
    {
        let object = queue.shift();
        let packet = Object.assign(Packet.prototype, object);

        let portNum = portMap[packet.Destination + " IN"];
        if (portNum != null)
        {
            ns.print("Routing '" + packet.Request + "' Packet from " + packet.Source + " to " + packet.Destination + "...");

            let port = ns.getPortHandle(portNum);
            let data = JSON.stringify(packet);
            if (port.tryWrite(data))
            {
                ns.print("Sent packet to: " + packet.Destination);
                return true;
            }
        }
    }

    return false;
}