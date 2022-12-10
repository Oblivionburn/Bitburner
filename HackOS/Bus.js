import {Packet} from "./HackOS/Packet.js";

let queue = [];

export var portMap = 
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
    for (let i = 5; i <= 8; i++)
    {
        let port = ns.getPortHandle(i);
        if (!port.empty())
        {
            let packet = JSON.parse(port.read());
            packet = Object.assign(Packet.prototype, packet);
            ns.print("'" + packet.request + "' Packet receieved from: " + packet.source);
            queue.push(packet);
        }
    }
}

async function Push(ns)
{
    if (queue.length > 0)
    {
        let packet = queue[0];
        
        let portNum = portMap[packet.destination + " IN"];
        if (portNum != null)
        {
            ns.print("Routing '" + packet.request + "' Packet from " + packet.source + " to " + packet.destination + "...");

            let port = ns.getPortHandle(portNum);
            let data = JSON.stringify(packet);
            port.write(data);

            ns.print("Sent packet to: " + packet.destination);
        }
    }
}